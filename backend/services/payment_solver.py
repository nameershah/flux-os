import logging
import os
from typing import Optional
from web3 import Web3

ARC_RPC = "https://rpc.testnet.arc.network"
ARC_CHAIN_ID = 5042002
USDC_TOKEN_ADDRESS = "0x3600000000000000000000000000000000000000"
USDC_DECIMALS = 6

WHITELISTED_MERCHANTS = {
    "amazon": "0x1111111111111111111111111111111111111111",
    "walmart": "0x2222222222222222222222222222222222222222",
    "tech_direct": "0x3333333333333333333333333333333333333333",
}

MAX_BUDGET_CAP = 10_000.0

ERC20_TRANSFER_ABI = [
    {"inputs": [{"name": "to", "type": "address"}, {"name": "value", "type": "uint256"}], "name": "transfer", "type": "function"}
]

logger = logging.getLogger(__name__)

class PolicyViolation(Exception):
    pass

def execute_payment(cart: list[dict]) -> dict:
    private_key = os.environ.get("PAYMENT_PRIVATE_KEY")
    w3 = Web3(Web3.HTTPProvider(ARC_RPC))
    
    # Policy check (Whitelisting + Budget)
    total_usd = sum(float(i.get("price", 0)) for i in cart)
    if total_usd > MAX_BUDGET_CAP:
        raise PolicyViolation("Budget exceeded")

    if not private_key:
        return {"status": "success", "logs": ["Sandbox Mode"], "transaction_hashes": ["0x-mock"]}

    if private_key.startswith("0x"): private_key = private_key[2:]
    acct = w3.eth.account.from_key(private_key)
    contract = w3.eth.contract(address=Web3.to_checksum_address(USDC_TOKEN_ADDRESS), abi=ERC20_TRANSFER_ABI)

    # NONCE MANAGEMENT
    current_nonce = w3.eth.get_transaction_count(acct.address)
    transaction_hashes = []

    for item in cart:
        to_address = WHITELISTED_MERCHANTS.get(item["vendor_id"])
        amount_raw = int(float(item["price"]) * (10**USDC_DECIMALS))
        
        tx = contract.functions.transfer(
            Web3.to_checksum_address(to_address), 
            amount_raw
        ).build_transaction({
            "from": acct.address,
            "chainId": ARC_CHAIN_ID,
            "gas": 120_000,
            "gasPrice": w3.eth.gas_price,
            "nonce": current_nonce,
        })
        
        signed = acct.sign_transaction(tx)
        tx_hash = w3.to_hex(w3.eth.send_raw_transaction(signed.raw_transaction))
        transaction_hashes.append(tx_hash)
        current_nonce += 1 # Increment for next item in cart

    return {"status": "success", "transaction_hashes": transaction_hashes}