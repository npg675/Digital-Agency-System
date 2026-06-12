import uuid
from sqlalchemy import Column, String, Uuid, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class ClientService(Base, TimestampMixin):
    __tablename__ = "client_services"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # The client receiving the service
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # The staff member providing the service
    staff_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # The specific service role (e.g., "Graphic Designer", "Video Editor", "SEO")
    service_role = Column(String, nullable=False)
    
    # Status of the enrollment ("ACTIVE", "PAUSED", "COMPLETED")
    status = Column(String, default="ACTIVE")
    
    # SLA Tracking
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Notifications Flags
    reminder_sent = Column(Boolean, default=False)
    overdue_alert_sent = Column(Boolean, default=False)

    client = relationship("User", foreign_keys=[client_id])
    staff = relationship("User", foreign_keys=[staff_id])
