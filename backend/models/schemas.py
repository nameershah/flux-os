from typing import Optional
from pydantic import BaseModel


class UserRequest(BaseModel):
    prompt: str
    budget: float
    deadline_days: int
    strategy: str = "balanced"


class ProcurementOption(BaseModel):
    id: str
    name: str
    price: float
    vendor_name: str
    vendor_id: str  # amazon, walmart, tech_direct for retailer badge
    trust_score: int
    delivery_days: int
    ai_score: float
    reason: str
    ai_reason: str  # e.g. "Best Price", "Fastest Delivery" — visible reasoning
    original_price: Optional[float] = None  # set when agent negotiates discount
