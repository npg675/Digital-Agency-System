from sqlalchemy import Column, String, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.models.base import Base

class PageView(Base):
    __tablename__ = "page_views"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    landing_page_id = Column(Uuid(as_uuid=True), ForeignKey("landing_pages.id", ondelete="CASCADE"), nullable=False)
    
    viewed_at = Column(DateTime, default=datetime.utcnow, index=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    referrer = Column(String, nullable=True)

    landing_page = relationship("LandingPage", back_populates="page_views")
