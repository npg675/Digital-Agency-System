from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class InvoiceBase(BaseModel):
    amount: float
    currency: str = "usd"
    status: str = "DRAFT"
    description: Optional[str] = None
    due_date: Optional[datetime] = None

class InvoiceCreate(InvoiceBase):
    client_id: UUID

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    stripe_checkout_session_id: Optional[str] = None

class InvoiceResponse(InvoiceBase):
    id: UUID
    client_id: UUID
    stripe_payment_intent_id: Optional[str] = None
    stripe_checkout_session_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
