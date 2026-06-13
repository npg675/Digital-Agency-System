from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey, Uuid
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin

class SubscriptionPlan(Base, TimestampMixin):
    __tablename__ = "subscription_plans"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # Who created this plan? If null, it's a SaaS Platform plan. If set, it's an Agency plan.
    agency_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    stripe_product_id = Column(String, nullable=True)
    stripe_price_id = Column(String, nullable=True)
    
    price_monthly = Column(Float, nullable=False, default=0.0)
    currency = Column(String, default="USD")
    
    is_active = Column(Boolean, default=True)
    
    features = Column(String, nullable=True) # JSON or comma separated

    agency = relationship("User", foreign_keys=[agency_id])
