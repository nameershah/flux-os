import asyncio
import logging
import random
import os

from fastapi import APIRouter, HTTPException
from models.schemas import ProcurementOption, UserRequest
from services import ai_engine
from services.payment_solver import execute_payment as execute_payment_onchain
from services.payment_solver import PolicyViolation

ORCHESTRATION_TIMEOUT_SEC = 60
router = APIRouter(tags=["procurement"])

MOCK_AUTHORIZED_VENDORS = {
    "amazon": {"name": "Amazon", "trust_score": 99, "chain_id": "0xAmz...99"},
    "walmart": {"name": "Walmart", "trust_score": 95, "chain_id": "0xWal...88"},
    "tech_direct": {"name": "TechData", "trust_score": 92, "chain_id": "0xTch...77"},
}

SCENARIO_C_CATEGORIES = ["snacks", "badges", "adapters", "prizes"]

def generate_dynamic_inventory() -> list[dict]:
    base = [
        {"id": "a1", "name": "Bulk Energy Drinks (24pk)", "price": 45.00, "delivery_days": 2, "category": "snacks", "vendor_id": "amazon"},
        {"id": "a2", "name": "Hackathon Lanyards (100ct)", "price": 25.00, "delivery_days": 2, "category": "badges", "vendor_id": "amazon"},
        {"id": "a3", "name": "Participant Badges & Holders", "price": 35.00, "delivery_days": 3, "category": "badges", "vendor_id": "amazon"},
        {"id": "w1", "name": "Party Size Chips & Dip", "price": 18.00, "delivery_days": 1, "category": "snacks", "vendor_id": "walmart"},
        {"id": "w2", "name": "Peel-and-Stick Name Tags (50ct)", "price": 5.00, "delivery_days": 0, "category": "badges", "vendor_id": "walmart"},
        {"id": "w3", "name": "Hackathon Snack Variety Pack", "price": 32.00, "delivery_days": 1, "category": "snacks", "vendor_id": "walmart"},
        {"id": "t1", "name": "Universal Travel Adapter (6-pack)", "price": 28.00, "delivery_days": 3, "category": "adapters", "vendor_id": "tech_direct"},
        {"id": "t2", "name": "USB-C Hub (Prize)", "price": 45.00, "delivery_days": 4, "category": "prizes", "vendor_id": "tech_direct"},
        {"id": "t3", "name": "Smart Home Hub (Grand Prize)", "price": 120.00, "delivery_days": 4, "category": "prizes", "vendor_id": "tech_direct"},
        {"id": "a4", "name": "Coffee & Tea Station Kit", "price": 55.00, "delivery_days": 2, "category": "snacks", "vendor_id": "amazon"},
        {"id": "t4", "name": "International Power Strip", "price": 22.00, "delivery_days": 3, "category": "adapters", "vendor_id": "tech_direct"},
    ]
    return [i for i in base if i["category"] in SCENARIO_C_CATEGORIES]

def apply_coupon_event(item: dict) -> dict:
    if random.random() > 0.25:
        return item
    discount_pct = random.choice([5, 10, 15])
    original = item["price"]
    new_price = round(original * (1 - discount_pct / 100), 2)
    return {**item, "original_price": original, "price": new_price, "negotiated_discount": discount_pct}

async def _run_orchestration(intent_request: UserRequest) -> dict:
    loop = asyncio.get_event_loop()
    categories, cognitive_telemetry = await asyncio.wait_for(
        loop.run_in_executor(None, lambda: ai_engine.parse_intent_ai(intent_request.prompt)),
        timeout=55.0,
    )
    if not isinstance(categories, list):
        categories = [categories] if isinstance(categories, str) else list(categories) if categories else []
    
    inventory = generate_dynamic_inventory()
    flux_cart: list[ProcurementOption] = []
    current_spend = 0.0

    for category in categories:
        all_cands = [i for i in inventory if i["category"] == category and (current_spend + i["price"]) <= intent_request.budget]
        if not all_cands: continue

        for c in all_cands:
            c["ai_score"] = ai_engine.calculate_score(c, intent_request.strategy)

        best_item = min(all_cands, key=lambda x: x["ai_score"])
        best_item = apply_coupon_event(best_item)
        ai_reason = ai_engine.derive_ai_reason(best_item, all_cands, intent_request.strategy)

        opt = ProcurementOption(
            id=best_item["id"],
            name=best_item["name"],
            price=best_item["price"],
            vendor_name=MOCK_AUTHORIZED_VENDORS[best_item["vendor_id"]]["name"],
            vendor_id=best_item["vendor_id"],
            trust_score=MOCK_AUTHORIZED_VENDORS[best_item["vendor_id"]]["trust_score"],
            delivery_days=best_item["delivery_days"],
            ai_score=best_item["ai_score"],
            reason=f"Optimizing {intent_request.strategy} strategy.",
            ai_reason=ai_reason,
            original_price=best_item.get("original_price"),
        )
        flux_cart.append(opt)
        current_spend += best_item["price"]

    return {"options": [o.model_dump() for o in flux_cart], "telemetry": cognitive_telemetry}

@router.post("/orchestrate")
async def orchestrate_procurement(intent_request: UserRequest):
    try:
        return await asyncio.wait_for(_run_orchestration(intent_request), timeout=ORCHESTRATION_TIMEOUT_SEC)
    except Exception as e:
        logging.exception("Orchestration Error: %s", e)
        raise HTTPException(status_code=503, detail=str(e))

@router.post("/execute_payment")
async def execute_secure_payment(cart: list[dict]):
    is_live = os.getenv("PAYMENT_PRIVATE_KEY") is not None
    try:
        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: execute_payment_onchain(cart)),
            timeout=ORCHESTRATION_TIMEOUT_SEC,
        )
        logging.info(f"Settlement successful. Mode: {'LIVE' if is_live else 'SANDBOX'}")
        return result
    except PolicyViolation as e:
        raise HTTPException(status_code=403, detail=f"Policy Violation: {e}")
    except Exception as e:
        logging.exception("Payment Error: %s", e)
        raise HTTPException(status_code=503, detail="Payment failed.")