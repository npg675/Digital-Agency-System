from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import uuid

from app.api import deps
from app.models.user import User, UserRole
from app.models.subscription_plan import SubscriptionPlan
from app.services.stripe_service import StripeService

router = APIRouter()

@router.get("/plans")
def list_plans(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get active subscription plans. If user is CLIENT, gets plans created by their Admin."""
    query = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True)
    
    if current_user.role == UserRole.CLIENT and current_user.manager_id:
        # Show Agency plans
        query = query.filter(SubscriptionPlan.agency_id == current_user.manager_id)
    else:
        # Show Platform SaaS plans
        query = query.filter(SubscriptionPlan.agency_id == None)
        
    return query.all()

from pydantic import BaseModel
class PlanCreate(BaseModel):
    name: str
    description: str = ""
    stripe_price_id: str
    price_monthly: float
    features: str = ""

@router.post("/plans")
def create_plan(
    *,
    db: Session = Depends(deps.get_db),
    plan_in: PlanCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create a new subscription plan (Admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    plan = SubscriptionPlan(
        name=plan_in.name,
        description=plan_in.description,
        stripe_price_id=plan_in.stripe_price_id,
        price_monthly=plan_in.price_monthly,
        features=plan_in.features,
        agency_id=current_user.id
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.post("/checkout")
def create_checkout_session(
    *,
    db: Session = Depends(deps.get_db),
    plan_id: uuid.UUID,
    success_url: str,
    cancel_url: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create Stripe Checkout Session."""
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    if not plan.stripe_price_id:
        raise HTTPException(status_code=400, detail="Plan missing Stripe Price ID")

    # Determine which Stripe key to use
    stripe_secret_key = None
    if plan.agency_id:
        agency = db.query(User).filter(User.id == plan.agency_id).first()
        if agency and agency.agency_stripe_secret_key:
            stripe_secret_key = agency.agency_stripe_secret_key
        else:
            raise HTTPException(status_code=400, detail="Agency Stripe key not configured")

    try:
        checkout_url = StripeService.create_checkout_session(
            price_id=plan.stripe_price_id,
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=current_user.email,
            client_reference_id=str(current_user.id),
            secret_key=stripe_secret_key
        )
        return {"url": checkout_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/portal")
def create_customer_portal(
    *,
    db: Session = Depends(deps.get_db),
    return_url: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create Stripe Customer Portal session."""
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active Stripe customer found")

    # If the user is a client, we need to use the Agency's Stripe key.
    # Otherwise, use the Platform key.
    stripe_secret_key = None
    if current_user.role == UserRole.CLIENT and current_user.manager_id:
        agency = db.query(User).filter(User.id == current_user.manager_id).first()
        if agency and agency.agency_stripe_secret_key:
            stripe_secret_key = agency.agency_stripe_secret_key

    try:
        portal_url = StripeService.create_customer_portal(
            customer_id=current_user.stripe_customer_id,
            return_url=return_url,
            secret_key=stripe_secret_key
        )
        return {"url": portal_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(deps.get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature")
        
    try:
        # First try to construct the event using the Platform's webhook secret
        event = StripeService.construct_webhook_event(payload, sig_header)
    except Exception as e:
        # In a real hybrid setup, we'd iterate through Agency secrets or use Connect.
        # For this MVP, we only verify the primary platform webhook.
        raise HTTPException(status_code=400, detail=str(e))

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Fulfill the purchase...
        user_id = session.get('client_reference_id')
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.stripe_customer_id = session.get('customer')
                user.stripe_subscription_id = session.get('subscription')
                user.subscription_status = 'active'
                db.commit()
                
    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        customer_id = subscription.get('customer')
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user:
            user.subscription_status = subscription.get('status')
            db.commit()

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        customer_id = subscription.get('customer')
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user:
            user.subscription_status = 'canceled'
            db.commit()

    return {"status": "success"}
