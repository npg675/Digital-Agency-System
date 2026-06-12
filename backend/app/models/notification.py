from sqlalchemy import Column, String, Boolean, Uuid, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin

class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    type = Column(String, nullable=False) # e.g. "NEW_NOTE", "REPLY"
    message = Column(String, nullable=False)
    reference_id = Column(String, nullable=True) # e.g. Client ID to redirect to
    is_read = Column(Boolean, default=False)

    user = relationship("User", foreign_keys=[user_id])
