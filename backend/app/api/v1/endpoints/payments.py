from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

try:
    import stripe
except ImportError:
    stripe = None

from app.api import deps
from app.models.user import User

router = APIRouter()

class CreatePaymentIntent(BaseModel):
    amount: int
    currency: str = "usd"
    description: str | None = None

@router.post("/create-intent")
def create_payment_intent(
    request: CreatePaymentIntent,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create a Stripe Payment Intent using the client's or agency's API key."""
    stripe_key = current_user.brand_stripe_secret_key or current_user.agency_stripe_secret_key
    
    if not stripe_key:
        raise HTTPException(status_code=400, detail="Stripe API keys not configured in Brand Vault.")
        
    if stripe is None:
        # Fallback/Mock mode if stripe library is missing
        return {"client_secret": "pi_mock_123_secret_mock456"}

    try:
        stripe.api_key = stripe_key
        intent = stripe.PaymentIntent.create(
            amount=request.amount,
            currency=request.currency,
            description=request.description,
            metadata={"client_id": str(current_user.id)}
        )
        return {"client_secret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
