import os
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.api.deps import get_current_user, get_current_active_user
from app.models.user import User, UserRole
from app.models.invoice import Invoice
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse

router = APIRouter()

# Set up Stripe Secret Key from env (for real usage)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_placeholder")

@router.post("/", response_model=InvoiceResponse)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to create invoices")
        
    invoice = Invoice(
        client_id=invoice_in.client_id,
        amount=invoice_in.amount,
        currency=invoice_in.currency,
        status=invoice_in.status,
        description=invoice_in.description,
        due_date=invoice_in.due_date
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role == UserRole.ADMIN:
        return db.query(Invoice).all()
    # Clients can only see their own invoices
    return db.query(Invoice).filter(Invoice.client_id == current_user.id).all()

@router.post("/{invoice_id}/pay")
def pay_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if current_user.role != UserRole.ADMIN and invoice.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to pay this invoice")
        
    if invoice.status == "PAID":
        raise HTTPException(status_code=400, detail="Invoice is already paid")
        
    # Generate Stripe Checkout Session
    try:
        # Convert amount to smallest currency unit (e.g. cents for USD)
        amount_in_cents = int(invoice.amount * 100)
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': invoice.currency,
                    'product_data': {
                        'name': invoice.description or f"Invoice #{invoice.id}",
                    },
                    'unit_amount': amount_in_cents,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + f"/portal/invoices?success=true&invoice_id={invoice.id}",
            cancel_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + f"/portal/invoices?canceled=true",
            client_reference_id=str(invoice.id),
        )
        
        invoice.stripe_checkout_session_id = session.id
        db.commit()
        
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f"Signature Verification Error: {e}")
        # Return 200 during local dev if we don't have a real webhook secret
        if STRIPE_WEBHOOK_SECRET == "whsec_placeholder":
            return {"status": "skipped"}
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        invoice_id = session.get('client_reference_id')
        
        if invoice_id:
            invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
            if invoice:
                invoice.status = "PAID"
                db.commit()
                print(f"Invoice {invoice_id} marked as PAID.")
                
    return {"status": "success"}
