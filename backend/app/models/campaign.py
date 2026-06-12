from sqlalchemy import Column, String, Uuid, ForeignKey, Float
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin

class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    
    # Financial Analytics (For ROI calculation)
    status = Column(String, default="DRAFT")
    budget = Column(Float, default=0.0)
    ad_spend = Column(Float, default=0.0)
    revenue_generated = Column(Float, default=0.0)

    # Optional: Associate campaign with a specific client
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    client = relationship("User", foreign_keys=[client_id])
    pages = relationship("LandingPage", back_populates="campaign", cascade="all, delete-orphan")
