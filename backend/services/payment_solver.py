"""
ArcFlow Safety Kernel — deterministic on-chain settlement via Circle/Arc Testnet.
All payments are gated by WHITELISTED_MERCHANTS and MAX_BUDGET_CAP before any signing.
"""

import logging
import os
from typing import Optional

from web3 import Web3
from web3.exceptions import ContractLogicError

# ——— Circle / Arc Testnet Configuration ———
ARC_RPC = "https://rpc.testnet.arc.network"
ARC_CHAIN_ID = 5042002
USDC_TOKEN_ADDRESS = "0x3600000000000000000000000000000000000000"
USDC_DECIMALS = 6

# Deterministic policy: only these vendor IDs may receive funds
WHITELISTED_MERCHANTS: dict[str, str] = {
    "amazon": "0x1111111111111111111111111111111111111111",
    "walmart": "0x2222222222222222222222222222222222222222",
    "tech_direct": "0x3333333333333333333333333333333333333333",
}

MAX_BUDGET_CAP = 10_000.0

ERC20_TRANSFER_ABI = [
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "value", "type": "uint256"},
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

logger = logging.getLogger(__name__)

def _get_web3() -> Optional[Web3]:
    try:
        w3 = Web3(Web3.HTTPProvider(ARC_RPC, request_kwargs={"timeout": 15}))
        if not w3.is_connected():
            return None
        return w3
    except Exception as e:
        logger.warning("payment_solver: RPC unreachable: %s", e)
        return None

def _check_policy(cart: list[dict]) -> tuple[bool, str]:
    if not cart:
        return False, "Empty cart"
    total_usd = 0.0
    for item in cart:
        vendor_id = item.get("vendor_id")
        if not vendor_id or vendor_id not in WHITELISTED_MERCHANTS:
            return False, f"Merchant not whitelisted: {vendor_id}"
        total_usd += float(item.get("price", 0))
    if total_usd > MAX_BUDGET_CAP:
        return False, f"Total {total_usd:.2f} exceeds budget cap"
    return True, ""

def _run_sandbox_settlement(cart: list[dict], by_vendor: dict[str, float]) -> dict:
    import uuid
    transaction_hashes = ["0x" + uuid.uuid4().hex for _ in by_vendor]
    return {
        "status": "success", 
        "logs": ["🔐 Sandbox Mode: Policy Passed", "✅ Simulated Settlement Complete"], 
        "transaction_hashes": transaction_hashes
    }

def execute_payment(cart: list[dict]) -> dict:
    ok, err = _check_policy(cart)
    if not ok:
        raise PolicyViolation(err)

    by_vendor: dict[str, float] = {}
    for item in cart:
        vid = item.get("vendor_id", "")
        by_vendor[vid] = by_vendor.get(vid, 0) + float(item.get("price", 0))

    private_key = os.environ.get("PAYMENT_PRIVATE_KEY")
    if not private_key:
        return _run_sandbox_settlement(cart, by_vendor)

    w3 = _get_web3()
    if not w3:
        raise RuntimeError("Arc Testnet RPC unreachable")

    if private_key.startswith("0x"):
        private_key = private_key[2:]
    
    acct = w3.eth.account.from_key(private_key)
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(USDC_TOKEN_ADDRESS),
        abi=ERC20_TRANSFER_ABI,
    )

    # FETCH NONCE ONCE BEFORE STARTING
    current_nonce = w3.eth.get_transaction_count(acct.address)

    audit_logs = ["🔐 ArcFlow Safety Kernel — Policy Check PASSED"]
    transaction_hashes = []

    for vendor_id, total_usd in by_vendor.items():
        to_address = WHITELISTED_MERCHANTS[vendor_id]
        amount_raw = int(round(total_usd * (10**USDC_DECIMALS)))
        if amount_raw <= 0:
            continue

        try:
            # BUILD WITH EXPLICIT NONCE
            tx = contract.functions.transfer(
                Web3.to_checksum_address(to_address),
                amount_raw,
            ).build_transaction({
                "from": acct.address,
                "chainId": ARC_CHAIN_ID,
                "gas": 120_000,
                "gasPrice": w3.eth.gas_price,
                "nonce": current_nonce, # FIXED
            })

            signed = acct.sign_transaction(tx)
            tx_hash_bytes = w3.eth.send_raw_transaction(signed.raw_transaction)
            tx_hash = w3.to_hex(tx_hash_bytes)
            transaction_hashes.append(tx_hash)
            
            audit_logs.append(f"📦 USDC transfer to {vendor_id}: {tx_hash}")
            
            # INCREMENT NONCE FOR NEXT TRANSFER
            current_nonce += 1 

        except Exception as e:
            logger.exception("flux_payment_send_error: %s", e)
            raise RuntimeError(f"Send failed: {e}") from e

    audit_logs.append("✅ On-Chain Settlement Complete")
    return {"status": "success", "logs": audit_logs, "transaction_hashes": transaction_hashes}

class PolicyViolation(Exception):
    """Raised when whitelist or budget cap check fails. Maps to HTTP 403."""