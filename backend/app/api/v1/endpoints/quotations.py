from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.user import User, UserRole
from app.models.quotation import Quotation, QuotationItem, QuotationLog
from app.schemas.quotation import QuotationCreate, QuotationUpdate, QuotationResponse
from app.api.deps import get_current_user
from app.core.email import send_smtp_email
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[QuotationResponse])
def get_quotations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.CLIENT:
        return db.query(Quotation).options(joinedload(Quotation.client)).filter(Quotation.client_id == current_user.id).all()
    # Admin and staff can see all
    return db.query(Quotation).options(joinedload(Quotation.client)).all()

@router.get("/public/{quotation_id}", response_model=QuotationResponse)
def get_public_quotation(
    quotation_id: UUID,
    db: Session = Depends(get_db)
):
    quotation = db.query(Quotation).options(joinedload(Quotation.client)).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    # Mark as viewed if it's SENT
    if quotation.status == "SENT":
        quotation.status = "VIEWED"
        log = QuotationLog(
            quotation_id=quotation.id,
            action="VIEWED_BY_CLIENT",
            details="Client opened the public link."
        )
        db.add(log)
        db.commit()
        db.refresh(quotation)
        
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin:
        quotation.agency = {
            "agency_name": admin.agency_name,
            "agency_address": admin.agency_address,
            "agency_email": admin.agency_email,
            "agency_contact_no": admin.agency_contact_no,
            "agency_website": admin.agency_website,
            "hide_agency_address": admin.hide_agency_address,
            "hide_agency_email": admin.hide_agency_email,
            "hide_agency_contact_no": admin.hide_agency_contact_no,
            "hide_agency_website": admin.hide_agency_website,
            "agency_footer_text": admin.agency_footer_text,
            "hide_agency_footer_text": admin.hide_agency_footer_text,
            "agency_signature": admin.agency_signature,
            "hide_agency_signature": admin.hide_agency_signature,
            "hide_agency_signature_text": admin.hide_agency_signature_text,
            "branding_logo": admin.branding_logo
        }

    return quotation

@router.get("/{quotation_id}", response_model=QuotationResponse)
def get_quotation(
    quotation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quotation = db.query(Quotation).options(joinedload(Quotation.client)).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    if current_user.role == UserRole.CLIENT and quotation.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this quotation")
        
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin:
        quotation.agency = {
            "agency_name": admin.agency_name,
            "agency_address": admin.agency_address,
            "agency_email": admin.agency_email,
            "agency_contact_no": admin.agency_contact_no,
            "agency_website": admin.agency_website,
            "hide_agency_address": admin.hide_agency_address,
            "hide_agency_email": admin.hide_agency_email,
            "hide_agency_contact_no": admin.hide_agency_contact_no,
            "hide_agency_website": admin.hide_agency_website,
            "agency_footer_text": admin.agency_footer_text,
            "hide_agency_footer_text": admin.hide_agency_footer_text,
            "agency_signature": admin.agency_signature,
            "hide_agency_signature": admin.hide_agency_signature,
            "hide_agency_signature_text": admin.hide_agency_signature_text,
            "branding_logo": admin.branding_logo
        }

    return quotation

@router.post("/", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED)
def create_quotation(
    quotation_in: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot create quotations")
        
    db_quotation = Quotation(
        client_id=quotation_in.client_id,
        status=quotation_in.status,
        total_amount=quotation_in.total_amount,
        valid_until=quotation_in.valid_until,
        template_name=quotation_in.template_name,
        notes=quotation_in.notes,
        customization=quotation_in.customization
    )
    db.add(db_quotation)
    db.flush() # flush to get id
    
    for item in quotation_in.items:
        db_item = QuotationItem(
            quotation_id=db_quotation.id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=item.total
        )
        db.add(db_item)
        
    db.commit()
    db.refresh(db_quotation)
    return db_quotation

@router.put("/{quotation_id}", response_model=QuotationResponse)
def update_quotation(
    quotation_id: UUID,
    quotation_in: QuotationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot update quotations")
        
    db_quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not db_quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    update_data = quotation_in.model_dump(exclude_unset=True)
    items_data = update_data.pop("items", None)
    
    for field, value in update_data.items():
        setattr(db_quotation, field, value)
        
    if items_data is not None:
        # Delete existing items
        db.query(QuotationItem).filter(QuotationItem.quotation_id == quotation_id).delete()
        # Create new items
        for item in items_data:
            db_item = QuotationItem(
                quotation_id=quotation_id,
                description=item["description"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                total=item["total"]
            )
            db.add(db_item)
            
    db.commit()
    db.refresh(db_quotation)
    return db_quotation

@router.delete("/{quotation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quotation(
    quotation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot delete quotations")
        
    db_quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not db_quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    db.delete(db_quotation)
    db.commit()
    return None

def send_quotation_email_task(quotation_id: UUID, admin_id: UUID):
    db = next(get_db())
    try:
        quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
        admin = db.query(User).filter(User.id == admin_id).first()
        if not quotation or not admin:
            return
            
        client = quotation.client
        if not client or not client.email:
            return
            
        agency_name = admin.agency_name or "Our Agency"
        
        # Link to the public quotation view
        # We assume the frontend URL is running on localhost:3000 for local dev or a production URL
        frontend_url = "http://localhost:3000" # Should be dynamic based on env, but fallback
        link = f"{frontend_url}/portal/quote/{quotation.id}"
        
        subject = f"New Quotation from {agency_name}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Hello {client.first_name or client.company_name or 'Client'},</h2>
                <p>We have prepared a new quotation for you regarding your recent request.</p>
                <p>Total Amount: <strong>${quotation.total_amount:,.2f}</strong></p>
                <p>
                    <a href="{link}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 5px;">
                        View Full Quotation
                    </a>
                </p>
                <p>If you have any questions, please reply to this email.</p>
                <p>Best regards,<br>{agency_name}</p>
            </body>
        </html>
        """
        
        send_smtp_email(admin, client.email, subject, html_content)
        
        # Log the action
        log = QuotationLog(
            quotation_id=quotation.id,
            action="SENT_VIA_EMAIL",
            details=f"Sent to {client.email}"
        )
        db.add(log)
        db.commit()
    finally:
        db.close()

@router.post("/{quotation_id}/send", status_code=status.HTTP_200_OK)
def send_quotation(
    quotation_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot send quotations")
        
    db_quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not db_quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    db_quotation.status = "SENT"
    db.commit()
    
    # Send email in background
    background_tasks.add_task(send_quotation_email_task, db_quotation.id, current_user.id)
    
    return {"message": "Quotation sending initiated"}
