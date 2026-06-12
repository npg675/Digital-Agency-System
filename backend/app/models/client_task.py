import uuid
from sqlalchemy import Column, String, Text, Uuid, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class ClientTask(Base, TimestampMixin):
    __tablename__ = "client_tasks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # The client this task belongs to
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # The staff member assigned to the task
    assigned_to_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Task Details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Status: TODO, IN_PROGRESS, REVIEW, DONE
    status = Column(String, default="TODO", nullable=False)
    
    # Optional category (e.g. Graphic Design, Web Development)
    service_category = Column(String, nullable=True)
    
    # Due Date
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Notifications Flags
    reminder_sent = Column(Boolean, default=False)
    overdue_alert_sent = Column(Boolean, default=False)

    client = relationship("User", foreign_keys=[client_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
