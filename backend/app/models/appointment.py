import uuid
from sqlalchemy import Column, String, Text, Uuid, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Appointment(Base, TimestampMixin):
    __tablename__ = "appointments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # The user (staff/admin) hosting the appointment
    host_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # The client/user booking the appointment (if an existing client)
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # The lead booking the appointment (if a new lead from landing page)
    lead_id = Column(Uuid(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    
    # Status: SCHEDULED, CANCELED, COMPLETED
    status = Column(String, default="SCHEDULED", nullable=False)
    
    meeting_link = Column(String, nullable=True)
    
    # Google Calendar Sync tracking
    google_event_id = Column(String, nullable=True)
    
    # Notification tracking
    reminder_1h_sent = Column(Boolean, default=False)
    reminder_24h_sent = Column(Boolean, default=False)

    host = relationship("User", foreign_keys=[host_id])
    client = relationship("User", foreign_keys=[client_id])
    lead = relationship("Lead", foreign_keys=[lead_id])
