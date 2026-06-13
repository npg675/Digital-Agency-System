import uuid
from sqlalchemy import Column, String, Text, Uuid, ForeignKey, Integer, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base, TimestampMixin

class MarketingAssetType(str, enum.Enum):
    AD_COPY = "AD_COPY"
    LEAD_MAGNET = "LEAD_MAGNET"
    LANDING_PAGE_COPY = "LANDING_PAGE_COPY"
    OTHER = "OTHER"

class StepType(str, enum.Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"

class MarketingSequence(Base, TimestampMixin):
    __tablename__ = "marketing_sequences"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    industry_category = Column(String, nullable=False) # e.g. REAL_ESTATE, ECOMMERCE
    objective = Column(String, nullable=True) # e.g. "Nurture to Call", "Abandoned Cart"

    steps = relationship("MarketingSequenceStep", back_populates="sequence", cascade="all, delete-orphan")


class MarketingSequenceStep(Base, TimestampMixin):
    __tablename__ = "marketing_sequence_steps"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    sequence_id = Column(Uuid(as_uuid=True), ForeignKey("marketing_sequences.id", ondelete="CASCADE"), nullable=False)
    
    day_offset = Column(Integer, default=0, nullable=False) # Day 0 = Immediate, Day 1 = 24 hrs later
    step_type = Column(SQLEnum(StepType), default=StepType.EMAIL, nullable=False)
    
    subject_line = Column(String, nullable=True) # For emails
    body_content = Column(Text, nullable=False)  # For email body or SMS text

    sequence = relationship("MarketingSequence", back_populates="steps")


class MarketingAsset(Base, TimestampMixin):
    __tablename__ = "marketing_assets"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    asset_type = Column(SQLEnum(MarketingAssetType), default=MarketingAssetType.AD_COPY, nullable=False)
    industry_category = Column(String, nullable=False)
    
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    file_url = Column(String, nullable=True) # If it's a PDF lead magnet

class SequenceStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"

class LeadSequence(Base, TimestampMixin):
    __tablename__ = "lead_sequences"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    lead_id = Column(Uuid(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    sequence_id = Column(Uuid(as_uuid=True), ForeignKey("marketing_sequences.id", ondelete="CASCADE"), nullable=False)
    
    current_step_index = Column(Integer, default=0, nullable=False)
    next_execution_time = Column(DateTime, nullable=False)
    status = Column(SQLEnum(SequenceStatus), default=SequenceStatus.ACTIVE, nullable=False)

    lead = relationship("Lead")
    sequence = relationship("MarketingSequence")
