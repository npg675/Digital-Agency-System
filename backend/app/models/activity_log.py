import uuid
from sqlalchemy import Column, String, Uuid, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class ActivityLog(Base, TimestampMixin):
    __tablename__ = "activity_logs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    # What was done (e.g. "LOGIN", "CREATE_NOTE", "UPDATE_USER", "HANDOVER")
    action = Column(String, nullable=False, index=True)
    
    # What type of entity was affected (e.g. "USER", "NOTE", "TEMPLATE")
    entity_type = Column(String, nullable=True)
    
    # The ID of the affected entity
    entity_id = Column(String, nullable=True)
    
    # Human-readable description of the action
    details = Column(Text, nullable=False)
    
    # IP address or other metadata can be added here if needed in the future
    ip_address = Column(String, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
