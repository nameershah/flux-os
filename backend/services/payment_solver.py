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

# Hard cap (USD) — no transaction may exceed this total
MAX_BUDGET_CAP = 10_000.0

# ERC-20 transfer ABI (minimal)
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
    """Build Web3 instance for Arc Testnet. Returns None if RPC unreachable."""
    try:
        w3 = Web3(Web3.HTTPProvider(ARC_RPC, request_kwargs={"timeout": 15}))
        if not w3.is_connected():
            return None
        return w3
    except Exception as e:
        logger.warning("payment_solver: RPC unreachable: %s", e)
        return None


def _check_policy(cart: list[dict]) -> tuple[bool, str]:
    """
    Enforce deterministic safety: whitelist + budget cap.
    Returns (ok, error_message). If ok is False, do not sign any transaction.
    """
    if not cart:
        return False, "Empty cart"

    total_usd = 0.0
    for item in cart:
        vendor_id = item.get("vendor_id")
        if not vendor_id:
            return False, "Cart item missing vendor_id"
        if vendor_id not in WHITELISTED_MERCHANTS:
            return False, f"Merchant not whitelisted: {vendor_id}"
        price = float(item.get("price", 0))
        if price < 0:
            return False, f"Invalid price for item: {price}"
        total_usd += price

    if total_usd > MAX_BUDGET_CAP:
        return False, f"Total {total_usd:.2f} exceeds MAX_BUDGET_CAP {MAX_BUDGET_CAP}"

    return True, ""


def _run_sandbox_settlement(cart: list[dict], by_vendor: dict[str, float]) -> dict:
    """When PAYMENT_PRIVATE_KEY is unset, return success + mock tx hashes for local demo."""
    import uuid
    audit_logs = []
    audit_logs.append("🔐 ArcFlow Safety Kernel — Policy Check PASSED (SANDBOX)")
    audit_logs.append(f"  > Whitelist: {list(WHITELISTED_MERCHANTS.keys())}")
    audit_logs.append(f"  > Max budget cap: ${MAX_BUDGET_CAP}")
    audit_logs.append("  > Mode: SANDBOX — set PAYMENT_PRIVATE_KEY for real Arc Testnet settlement")
    audit_logs.append("")

    transaction_hashes: list[str] = []
    for vendor_id, total_usd in by_vendor.items():
        tx_hash = "0x" + uuid.uuid4().hex
        transaction_hashes.append(tx_hash)
        audit_logs.append(f"📦 USDC transfer to {vendor_id} (simulated)")
        audit_logs.append(f"  > Amount: ${total_usd:.2f} USDC")
        audit_logs.append(f"  > Tx Hash: {tx_hash}")
        audit_logs.append("")
    audit_logs.append("✅ Simulated Settlement Complete")
    audit_logs.append("Set PAYMENT_PRIVATE_KEY for on-chain Arc Testnet.")
    return {"status": "success", "logs": audit_logs, "transaction_hashes": transaction_hashes}


def execute_payment(cart: list[dict]) -> dict:
    """
    Execute USDC settlement on Arc Testnet. Runs synchronously; call from run_in_executor.
    - Checks WHITELISTED_MERCHANTS and MAX_BUDGET_CAP; on failure raises PolicyViolation.
    - Aggregates by vendor, sends one USDC transfer per vendor, returns all tx hashes.
    - If PAYMENT_PRIVATE_KEY is unset, runs sandbox mode (mock hashes) for local demo.
    Returns: {"status": "success", "logs": [...], "transaction_hashes": ["0x...", ...]}
    """
    ok, err = _check_policy(cart)
    if not ok:
        raise PolicyViolation(err)

    # Aggregate amount per vendor (vendor_id -> total USD)
    by_vendor: dict[str, float] = {}
    for item in cart:
        vid = item.get("vendor_id", "")
        price = float(item.get("price", 0))
        by_vendor[vid] = by_vendor.get(vid, 0) + price

    private_key = os.environ.get("PAYMENT_PRIVATE_KEY") or os.environ.get("PRIVATE_KEY")
    if not private_key:
        return _run_sandbox_settlement(cart, by_vendor)

    w3 = _get_web3()
    if not w3:
        raise RuntimeError("Arc Testnet RPC unreachable")

    # Strip 0x prefix if present for key
    if private_key.startswith("0x"):
        private_key = private_key[2:]
    acct = w3.eth.account.from_key(private_key)
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(USDC_TOKEN_ADDRESS),
        abi=ERC20_TRANSFER_ABI,
    )

    audit_logs = []
    audit_logs.append("🔐 ArcFlow Safety Kernel — Policy Check PASSED")
    audit_logs.append(f"  > Whitelist: {list(WHITELISTED_MERCHANTS.keys())}")
    audit_logs.append(f"  > Max budget cap: ${MAX_BUDGET_CAP}")
    audit_logs.append("")

    transaction_hashes: list[str] = []
    for vendor_id, total_usd in by_vendor.items():
        to_address = WHITELISTED_MERCHANTS[vendor_id]
        amount_raw = int(round(total_usd * (10**USDC_DECIMALS)))
        if amount_raw <= 0:
            continue

        try:
            tx = contract.functions.transfer(
                Web3.to_checksum_address(to_address),
                amount_raw,
            ).build_transaction(
                {
                    "from": acct.address,
                    "chainId": ARC_CHAIN_ID,
                    "gas": 100_000,
                }
            )
            signed = acct.sign_transaction(tx)
            tx_hash_bytes = w3.eth.send_raw_transaction(signed.raw_transaction)
            tx_hash = w3.to_hex(tx_hash_bytes)
            transaction_hashes.append(tx_hash)

            audit_logs.append(f"📦 USDC transfer to {vendor_id}")
            audit_logs.append(f"  > Amount: ${total_usd:.2f} USDC")
            audit_logs.append(f"  > Tx Hash: {tx_hash}")
            audit_logs.append("")
            logger.info(
                "flux_onchain_settlement",
                extra={"vendor_id": vendor_id, "tx_hash": tx_hash, "amount_usd": total_usd},
            )
        except ContractLogicError as e:
            logger.exception("flux_payment_contract_error: %s", e)
            raise RuntimeError(f"Contract revert: {e}") from e
        except Exception as e:
            logger.exception("flux_payment_send_error: %s", e)
            raise RuntimeError(f"Send failed: {e}") from e

    audit_logs.append("✅ On-Chain Settlement Complete")
    audit_logs.append("All transfers submitted to Arc Testnet.")
    return {
        "status": "success",
        "logs": audit_logs,
        "transaction_hashes": transaction_hashes,
    }


class PolicyViolation(Exception):
    """Raised when whitelist or budget cap check fails. Maps to HTTP 403."""
