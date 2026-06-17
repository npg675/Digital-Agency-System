from sqlalchemy import Column, String, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin

class SocialIntegration(Base, TimestampMixin):
    __tablename__ = "social_integrations"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    platform = Column(String, nullable=False, index=True) # e.g., FACEBOOK, INSTAGRAM, TWITTER, LINKEDIN
    
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Specific ID provided by the platform (e.g. Page ID, User ID)
    account_id = Column(String, nullable=True)
    
    client = relationship("User", foreign_keys=[client_id])
