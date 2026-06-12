from sqlalchemy import Column, String, Enum, Integer, ForeignKey, JSON, Uuid
from sqlalchemy.orm import relationship
import uuid
import enum
from app.models.base import Base, TimestampMixin

class TemplateCategory(str, enum.Enum):
    REAL_ESTATE = "Real Estate"
    EDUCATION = "Education"
    HEALTHCARE = "Healthcare"
    RESTAURANT = "Restaurant"
    HOTEL = "Hotel"
    TRAVEL = "Travel"
    ECOMMERCE = "Ecommerce"
    CONSTRUCTION = "Construction"
    CONSULTING = "Consulting"
    FINANCE = "Finance"
    SOFTWARE = "Software Company"
    NGO = "NGO"
    AUTOMOTIVE = "Automotive"
    BEAUTY = "Beauty & Salon"
    GYM = "Gym & Fitness"
    FUNNELS = "Funnels & Thank You"
    OTHER = "Other"

class Template(Base, TimestampMixin):
    __tablename__ = "templates"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    category = Column(Enum(TemplateCategory), default=TemplateCategory.OTHER, nullable=False)
    thumbnail_url = Column(String, nullable=True)

    sections = relationship("TemplateSection", back_populates="template", cascade="all, delete-orphan", order_by="TemplateSection.order")

class TemplateSection(Base):
    __tablename__ = "template_sections"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    template_id = Column(Uuid(as_uuid=True), ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False) # e.g. 'Hero', 'About', 'Features'
    config = Column(JSON, nullable=False, default={})
    order = Column(Integer, nullable=False, default=0)

    template = relationship("Template", back_populates="sections")
