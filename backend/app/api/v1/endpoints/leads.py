from typing import Any, List
import json
import urllib.request
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import uuid

from app.api import deps
from app.models.lead import Lead
from app.models.user import User
from app.models.landing_page import LandingPage
from app.schemas.lead import Lead as LeadSchema, LeadCreate, LeadUpdate
import smtplib
from email.message import EmailMessage
from app.models.user import UserRole
from app.models.marketing_asset import LeadSequence, SequenceStatus
import requests

router = APIRouter()

def send_webhook(url: str, data: dict):
    """Send an HTTP POST to the webhook URL."""
    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps(data).encode('utf-8'), 
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            pass # We don't really care about the response
    except Exception as e:
        print(f"Webhook failed for {url}: {e}")

def send_to_mailchimp(api_key: str, server_prefix: str, list_id: str, email: str, name: str, phone: str):
    """Add a subscriber to a Mailchimp audience."""
    if not all([api_key, server_prefix, list_id, email]):
        return
        
    url = f"https://{server_prefix}.api.mailchimp.com/3.0/lists/{list_id}/members"
    
    # Split name into first and last name if possible
    name_parts = (name or "").split(" ", 1)
    fname = name_parts[0] if len(name_parts) > 0 else ""
    lname = name_parts[1] if len(name_parts) > 1 else ""

    payload = {
        "email_address": email,
        "status": "subscribed",
        "merge_fields": {
            "FNAME": fname,
            "LNAME": lname,
            "PHONE": phone or ""
        }
    }
    
    try:
        response = requests.post(
            url,
            auth=("anystring", api_key),
            json=payload,
            timeout=10
        )
        response.raise_for_status()
    except Exception as e:
        print(f"Mailchimp sync failed for {email}: {e}")

def send_lead_email(admin_config: User, client_email: str, lead_data: dict, page_name: str):
    """Send an email notification about a new lead."""
    if not all([admin_config.smtp_host, admin_config.smtp_port, admin_config.smtp_user, admin_config.smtp_password, admin_config.smtp_from_email, client_email]):
        return
        
    try:
        msg = EmailMessage()
        msg.set_content(
            f"Hello,\n\nYou have received a new lead from your landing page '{page_name}'.\n\n"
            f"Name: {lead_data.get('name', 'N/A')}\n"
            f"Email: {lead_data.get('email', 'N/A')}\n"
            f"Phone: {lead_data.get('phone', 'N/A')}\n"
            f"Message: {lead_data.get('message', 'N/A')}\n\n"
            f"View your full dashboard to manage leads.\n\nBest,\nYour Marketing Team"
        )
        msg['Subject'] = f"New Lead Captured: {page_name}"
        msg['From'] = admin_config.smtp_from_email
        msg['To'] = client_email

        with smtplib.SMTP_SSL(admin_config.smtp_host, admin_config.smtp_port) as server:
            server.login(admin_config.smtp_user, admin_config.smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send email to {client_email}: {e}")

def send_autoresponder_email(admin_config: User, lead_email: str, subject: str, body: str, page_name: str, lead_name: str):
    """Send an auto-responder email to the lead."""
    if not all([admin_config.smtp_host, admin_config.smtp_port, admin_config.smtp_user, admin_config.smtp_password, admin_config.smtp_from_email, lead_email, subject, body]):
        return
        
    try:
        msg = EmailMessage()
        # Personalize body
        personalized_body = body.replace("{{name}}", lead_name or "there")
        msg.set_content(personalized_body)
        
        msg['Subject'] = subject.replace("{{name}}", lead_name or "")
        msg['From'] = admin_config.smtp_from_email
        msg['To'] = lead_email

        with smtplib.SMTP_SSL(admin_config.smtp_host, admin_config.smtp_port) as server:
            server.login(admin_config.smtp_user, admin_config.smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send autoresponder to {lead_email}: {e}")

def send_whatsapp_message(access_token: str, phone_number_id: str, to_phone: str, lead_data: dict, page_name: str):
    """Send a WhatsApp message via Meta Cloud API."""
    if not all([access_token, phone_number_id, to_phone]):
        return

    url = f"https://graph.facebook.com/v17.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    message_text = (
        f"🚨 *New Lead: {page_name}* 🚨\n\n"
        f"*Name:* {lead_data.get('name', 'N/A')}\n"
        f"*Email:* {lead_data.get('email', 'N/A')}\n"
        f"*Phone:* {lead_data.get('phone', 'N/A')}\n"
        f"*Message:* {lead_data.get('message', 'N/A')}"
    )

    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone.replace("+", "").replace(" ", ""), # Format: Country code without +
        "type": "text",
        "text": {"body": message_text}
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
    except Exception as e:
        print(f"Failed to send WhatsApp message to {to_phone}: {e}")

@router.get("/", response_model=List[LeadSchema])
def read_leads(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve leads (Filtered by Role).
    """
    from app.models.user import UserRole
    query = db.query(Lead)
    if current_user.role == UserRole.CLIENT:
        query = query.join(LandingPage).filter(LandingPage.client_id == current_user.id)
    elif current_user.role == UserRole.STAFF:
        managed_clients = db.query(User.id).filter(User.manager_id == current_user.id).all()
        managed_client_ids = [c[0] for c in managed_clients]
        query = query.join(LandingPage).filter(
            LandingPage.client_id.in_(managed_client_ids)
        )
    leads = query.offset(skip).limit(limit).all()
    return leads

@router.post("/", response_model=LeadSchema)
def create_lead(
    *,
    db: Session = Depends(deps.get_db),
    lead_in: LeadCreate,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Create a new lead (Public endpoint).
    """
    lead = Lead(**lead_in.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    
    # Check if page has a webhook URL and fire it
    page = db.query(LandingPage).filter(LandingPage.id == lead.landing_page_id).first()
    if page and page.webhook_url:
        webhook_data = {
            "id": str(lead.id),
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "message": lead.message,
            "landing_page_id": str(lead.landing_page_id),
            "landing_page_slug": page.slug,
            "submitted_at": lead.submitted_at.isoformat() if lead.submitted_at else None
        }
        background_tasks.add_task(send_webhook, page.webhook_url, webhook_data)
        
    # Check if page has Mailchimp integration
    if page and page.mailchimp_api_key and page.mailchimp_server_prefix and page.mailchimp_list_id:
        background_tasks.add_task(
            send_to_mailchimp, 
            page.mailchimp_api_key, 
            page.mailchimp_server_prefix, 
            page.mailchimp_list_id, 
            lead.email, 
            lead.name, 
            lead.phone
        )
        
    # Check if we should send an email or WhatsApp alert
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if page and admin:
        lead_data = {
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "message": lead.message
        }
        
        # Email Alert
        if page.client_email and admin.smtp_host:
            background_tasks.add_task(send_lead_email, admin, page.client_email, lead_data, page.name)
            
        # WhatsApp Alerts
        if admin.whatsapp_access_token and admin.whatsapp_phone_number_id:
            # 1. To Admin
            if admin.phone_number:
                background_tasks.add_task(
                    send_whatsapp_message, 
                    admin.whatsapp_access_token, 
                    admin.whatsapp_phone_number_id, 
                    admin.phone_number, 
                    lead_data, 
                    page.name
                )
            
            # 2. To Client
            if page.client_phone:
                background_tasks.add_task(
                    send_whatsapp_message, 
                    admin.whatsapp_access_token, 
                    admin.whatsapp_phone_number_id, 
                    page.client_phone, 
                    lead_data, 
                    page.name
                )
        
        # Auto-Responder Email
        if page.autoresponder_subject and page.autoresponder_body and lead.email:
            background_tasks.add_task(
                send_autoresponder_email,
                admin,
                lead.email,
                page.autoresponder_subject,
                page.autoresponder_body,
                page.name,
                lead.name
            )
            
        # Native Autoresponder Engine (Marketing Sequence)
        if page.default_sequence_id:
            from datetime import datetime
            lead_seq = LeadSequence(
                lead_id=lead.id,
                sequence_id=page.default_sequence_id,
                current_step_index=0,
                next_execution_time=datetime.utcnow(),
                status=SequenceStatus.ACTIVE
            )
            db.add(lead_seq)
            db.commit()
            
    return lead

@router.delete("/{id}")
def delete_lead(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Delete a lead."""
    from app.models.user import UserRole
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Authorize deletion
    if current_user.role == UserRole.CLIENT:
        page = db.query(LandingPage).filter(LandingPage.id == lead.landing_page_id).first()
        if not page or page.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.STAFF:
        page = db.query(LandingPage).filter(LandingPage.id == lead.landing_page_id).first()
        if page and page.client_id:
            client = db.query(User).filter(User.id == page.client_id).first()
            if client and client.manager_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted"}

@router.patch("/{id}", response_model=LeadSchema)
def update_lead(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    lead_in: LeadUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update a lead (e.g., status)."""
    from app.models.user import UserRole
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Authorize update
    if current_user.role == UserRole.CLIENT:
        page = db.query(LandingPage).filter(LandingPage.id == lead.landing_page_id).first()
        if not page or page.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.STAFF:
        page = db.query(LandingPage).filter(LandingPage.id == lead.landing_page_id).first()
        if page and page.client_id:
            client = db.query(User).filter(User.id == page.client_id).first()
            if client and client.manager_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized")

    if lead_in.status is not None:
        lead.status = lead_in.status
    if lead_in.notes is not None:
        lead.notes = lead_in.notes

    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

