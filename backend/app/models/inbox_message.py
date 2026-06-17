from sqlalchemy import Column, String, ForeignKey, DateTime, Uuid, Text
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.models.base import Base

class InboxMessage(Base):
    __tablename__ = "inbox_messages"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    lead_id = Column(Uuid(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    
    direction = Column(String, nullable=False) # "INBOUND" or "OUTBOUND"
    channel = Column(String, nullable=False) # "SMS" or "EMAIL"
    content = Column(Text, nullable=False)
    status = Column(String, default="SENT", nullable=False) # "SENT", "DELIVERED", "FAILED"
    
    sent_at = Column(DateTime, default=datetime.utcnow, index=True)

    lead = relationship("Lead", back_populates="messages")
