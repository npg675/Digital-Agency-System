from sqlalchemy import Column, String, Uuid, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin

class QuickLink(Base, TimestampMixin):
    __tablename__ = "quick_links"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    category = Column(String, nullable=True)
    is_shared_with_staff = Column(Boolean, default=False, nullable=False)
    
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", backref="quick_links")
