from sqlalchemy import Column, String, ForeignKey, DateTime, Uuid, Text
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin

class SocialPost(Base, TimestampMixin):
    __tablename__ = "social_posts"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    content = Column(Text, nullable=False)
    media_url = Column(String, nullable=True)
    platforms = Column(String, nullable=False) # e.g. "FACEBOOK,INSTAGRAM"
    
    scheduled_for = Column(DateTime, nullable=False, index=True)
    status = Column(String, default="SCHEDULED", nullable=False) # "DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"
    
    client = relationship("User", foreign_keys=[client_id])
