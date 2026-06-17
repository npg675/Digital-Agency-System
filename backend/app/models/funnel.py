from sqlalchemy import Column, String, ForeignKey, Integer, Uuid, Float
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin
import enum
from sqlalchemy import Enum

class StepType(str, enum.Enum):
    OPTIN = "OPTIN"
    CHECKOUT = "CHECKOUT"
    UPSELL = "UPSELL"
    DOWNSELL = "DOWNSELL"
    THANK_YOU = "THANK_YOU"

class FunnelStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"

class Funnel(Base, TimestampMixin):
    __tablename__ = "funnels"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False)
    domain = Column(String, nullable=True)
    status = Column(Enum(FunnelStatus), default=FunnelStatus.DRAFT, nullable=False)
    total_revenue = Column(Float, default=0.0)
    
    client = relationship("User", foreign_keys=[client_id])
    steps = relationship("FunnelStep", back_populates="funnel", cascade="all, delete-orphan", order_by="FunnelStep.step_order")

class FunnelStep(Base, TimestampMixin):
    __tablename__ = "funnel_steps"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    funnel_id = Column(Uuid(as_uuid=True), ForeignKey("funnels.id", ondelete="CASCADE"), nullable=False)
    landing_page_id = Column(Uuid(as_uuid=True), ForeignKey("landing_pages.id", ondelete="SET NULL"), nullable=True)
    
    step_order = Column(Integer, nullable=False, default=1)
    step_type = Column(Enum(StepType), default=StepType.OPTIN, nullable=False)
    
    # Analytics
    views = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    revenue = Column(Float, default=0.0)

    funnel = relationship("Funnel", back_populates="steps")
    landing_page = relationship("LandingPage")
