import logging
import random
import uuid

from fastapi import APIRouter
from models.schemas import ProcurementOption, UserRequest
from services import ai_engine

router = APIRouter(prefix="/api", tags=["procurement"])

MOCK_AUTHORIZED_VENDORS = {
    "amazon": {"name": "Amazon", "trust_score": 99, "chain_id": "0xAmz...99"},
    "walmart": {"name": "Walmart", "trust_score": 95, "chain_id": "0xWal...88"},
    "tech_direct": {"name": "TechData", "trust_score": 92, "chain_id": "0xTch...77"},
}

# Scenario C: Hackathon Host Kit — Snacks, Badges, Adapters, Prizes (prioritized)
SCENARIO_C_CATEGORIES = ["snacks", "badges", "adapters", "prizes"]


def generate_dynamic_inventory() -> list[dict]:
    """Generate inventory prioritizing Hackathon Scenario C items."""
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
    # Ensure Scenario C categories are well represented
    return [i for i in base if i["category"] in SCENARIO_C_CATEGORIES]


def apply_coupon_event(item: dict) -> dict:
    """1 in 4 chance: agent negotiates a discount (simulated autonomous negotiation)."""
    if random.random() > 0.25:
        return item
    discount_pct = random.choice([5, 10, 15])
    original = item["price"]
    new_price = round(original * (1 - discount_pct / 100), 2)
    return {**item, "original_price": original, "price": new_price, "negotiated_discount": discount_pct}


@router.post("/orchestrate")
async def orchestrate_procurement(request: UserRequest):
    logging.info(f"NEW REQUEST: {request.prompt} | Budget: ${request.budget}")

    categories, telemetry = ai_engine.parse_intent_ai(request.prompt)
    # Ensure Scenario C categories are included when relevant
    if any(c in str(request.prompt).lower() for c in ["hackathon", "event", "kit"]):
        for cat in SCENARIO_C_CATEGORIES:
            if cat not in categories:
                categories.append(cat)
    categories = list(dict.fromkeys(categories))[:6]  # dedupe, cap

    inventory = generate_dynamic_inventory()
    optimized_cart = []
    current_spend = 0.0

    for category in categories:
        # Build candidates: items in category, within budget, trust >= 90
        all_cands = []
        for i in inventory:
            if i["category"] != category:
                continue
            vendor = MOCK_AUTHORIZED_VENDORS[i["vendor_id"]]
            if vendor["trust_score"] < 90:
                continue
            if (current_spend + i["price"]) > request.budget:
                continue
            cand = dict(i)
            cand["ai_score"] = ai_engine.calculate_score(cand, request.strategy)
            all_cands.append(cand)

        if not all_cands:
            continue

        best_item = min(all_cands, key=lambda x: x["ai_score"])
        best_item = apply_coupon_event(best_item)
        ai_reason = ai_engine.derive_ai_reason(best_item, all_cands, request.strategy)

        opt = ProcurementOption(
            id=best_item["id"],
            name=best_item["name"],
            price=best_item["price"],
            vendor_name=MOCK_AUTHORIZED_VENDORS[best_item["vendor_id"]]["name"],
            vendor_id=best_item["vendor_id"],
            trust_score=MOCK_AUTHORIZED_VENDORS[best_item["vendor_id"]]["trust_score"],
            delivery_days=best_item["delivery_days"],
            ai_score=ai_engine.calculate_score(best_item, request.strategy),
            reason=f"Chosen because it optimizes {request.strategy} within your constraints.",
            ai_reason=ai_reason,
            original_price=best_item.get("original_price"),
        )
        optimized_cart.append(opt)
        current_spend += best_item["price"]

    return {"options": [o.model_dump() for o in optimized_cart], "telemetry": telemetry}


@router.post("/execute_payment")
async def execute_secure_payment(cart: list[dict]):
    """Simulate orchestrated payment fan-out to multiple retailers (Rule 2.5)."""
    audit_logs = []

    audit_logs.append("🔐 Authenticating Secure Gateway...")
    audit_logs.append("  > Gateway: SANDBOX MOCK — Policy Check PASSED")
    audit_logs.append("")

    for idx, item in enumerate(cart):
        tx_id = str(uuid.uuid4())[:8]
        vendor = item.get("vendor_name", "Vendor")
        order_num = 100 + idx * 51 + (hash(vendor) % 50)
        audit_logs.append(f"📦 Placing Order #{order_num} at {vendor}...")
        audit_logs.append(f"  > Item: {item.get('name', 'Unknown')}")
        audit_logs.append(f"  > Amount: ${item.get('price', 0):.2f}")
        audit_logs.append("  > Policy Check: PASSED")
        audit_logs.append(f"  > Tx Hash: 0x{tx_id}...")
        audit_logs.append("")
        logging.info(f"TRANSACTION {tx_id} FINALIZED. Vendor: {vendor}")

    audit_logs.append("✅ Syncing Logistics...")
    audit_logs.append("All orders confirmed. Delivery tracking active.")

    return {"status": "success", "logs": audit_logs}
