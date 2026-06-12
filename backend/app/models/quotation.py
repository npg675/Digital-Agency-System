import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer, JSON, Uuid
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Quotation(Base, TimestampMixin):
    __tablename__ = "quotations"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(String, default="DRAFT", nullable=False) # DRAFT, SENT
    total_amount = Column(Float, nullable=False, default=0.0)
    valid_until = Column(DateTime, nullable=True)
    
    template_name = Column(String, default="professional", nullable=False)
    notes = Column(String, nullable=True)
    
    # Store customization options like colors, logo, etc.
    customization = Column(JSON, nullable=True)
    
    client = relationship("User", foreign_keys=[client_id])
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")
    logs = relationship("QuotationLog", back_populates="quotation", cascade="all, delete-orphan")

class QuotationItem(Base, TimestampMixin):
    __tablename__ = "quotation_items"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    quotation_id = Column(Uuid(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    
    description = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False, default=0.0)
    tax_rate = Column(Float, nullable=True, default=0.0)
    tax_amount = Column(Float, nullable=True, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    
    quotation = relationship("Quotation", back_populates="items")

class QuotationLog(Base, TimestampMixin):
    __tablename__ = "quotation_logs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    quotation_id = Column(Uuid(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    
    action = Column(String, nullable=False) # e.g. SENT_VIA_EMAIL, VIEWED
    details = Column(String, nullable=True)
    
    quotation = relationship("Quotation", back_populates="logs")
