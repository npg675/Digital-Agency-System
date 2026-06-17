from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
import uuid

from app.api import deps
from app.models.user import User, UserRole
from app.models.lead import Lead
from app.models.inbox_message import InboxMessage as InboxMessageModel
from app.schemas.inbox_message import InboxMessage, InboxMessageCreate

router = APIRouter()

@router.get("/conversations")
def get_conversations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get all leads with their latest message snippet."""
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Not authorized to access inbox")
        
    # For now, just return all leads with a mock last_message or their actual last message.
    # In a production app, we'd do a complex join or distinct query.
    # Let's get all leads that have messages or just all leads.
    leads = db.query(Lead).order_by(desc(Lead.submitted_at)).limit(50).all()
    
    conversations = []
    for lead in leads:
        last_msg = db.query(InboxMessageModel).filter(InboxMessageModel.lead_id == lead.id).order_by(desc(InboxMessageModel.sent_at)).first()
        conversations.append({
            "lead_id": lead.id,
            "lead_name": lead.name,
            "lead_phone": lead.phone,
            "lead_email": lead.email,
            "last_message": last_msg.content if last_msg else None,
            "last_message_date": last_msg.sent_at if last_msg else lead.submitted_at,
            "unread_count": 0 # placeholder
        })
        
    conversations.sort(key=lambda x: x["last_message_date"], reverse=True)
    return conversations

@router.get("/{lead_id}/messages", response_model=List[InboxMessage])
def get_messages(
    lead_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get all messages for a specific lead."""
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Not authorized to access inbox")
        
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    messages = db.query(InboxMessageModel).filter(InboxMessageModel.lead_id == lead_id).order_by(InboxMessageModel.sent_at).all()
    return messages

@router.post("/{lead_id}/send", response_model=InboxMessage)
def send_message(
    lead_id: uuid.UUID,
    payload: InboxMessageCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Send a message to a lead via SMS or Email."""
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Not authorized to access inbox")
        
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    # TODO: Here we would trigger the actual SMS via Twilio or Email via SendGrid.
    # For now, we mock success and store it in the DB.
    
    new_message = InboxMessageModel(
        lead_id=lead.id,
        direction="OUTBOUND",
        channel=payload.channel.upper(),
        content=payload.content,
        status="SENT"
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message
