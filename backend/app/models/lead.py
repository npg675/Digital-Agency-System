from sqlalchemy import Column, String, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.models.base import Base
import enum

class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    PROPOSAL_SENT = "PROPOSAL_SENT"
    WON = "WON"
    LOST = "LOST"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    landing_page_id = Column(Uuid(as_uuid=True), ForeignKey("landing_pages.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    message = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    status = Column(String, default=LeadStatus.NEW.value, nullable=False)
    
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    # Follow-up features
    next_followup_date = Column(DateTime, nullable=True)
    followup_status = Column(String, default="PENDING", nullable=True) # PENDING, COMPLETED, SNOOZED

    # AI Lead Scoring
    ai_score = Column(String, nullable=True) # HOT, WARM, COLD
    ai_score_reason = Column(String, nullable=True)

    landing_page = relationship("LandingPage", back_populates="leads")
    messages = relationship("InboxMessage", back_populates="lead", cascade="all, delete-orphan")
