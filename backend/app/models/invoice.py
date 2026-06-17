import uuid
from sqlalchemy import Column, String, Float, Uuid, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Invoice(Base, TimestampMixin):
    __tablename__ = "invoices"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    amount = Column(Float, nullable=False)
    currency = Column(String, default="usd", nullable=False)
    
    # Status: DRAFT, SENT, PAID, OVERDUE, CANCELED
    status = Column(String, default="DRAFT", nullable=False)
    
    description = Column(String, nullable=True)
    due_date = Column(DateTime, nullable=True)
    
    stripe_payment_intent_id = Column(String, nullable=True)
    stripe_checkout_session_id = Column(String, nullable=True)
    
    client = relationship("User", foreign_keys=[client_id])
