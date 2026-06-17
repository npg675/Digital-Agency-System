from sqlalchemy import Column, String, Enum, Integer, ForeignKey, JSON, Boolean, Uuid
from sqlalchemy.orm import relationship
import uuid
import enum
from app.models.base import Base, TimestampMixin

class PageStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class LandingPage(Base, TimestampMixin):
    __tablename__ = "landing_pages"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    industry = Column(String, nullable=True)
    
    # Client Info
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    campaign_id = Column(Uuid(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    custom_domain = Column(String, unique=True, index=True, nullable=True)
    client_name = Column(String, nullable=True)
    client_email = Column(String, nullable=True)
    client_phone = Column(String, nullable=True)
    
    # Branding & SEO
    logo_url = Column(String, nullable=True)
    favicon_url = Column(String, nullable=True)
    seo_title = Column(String, nullable=True)
    seo_description = Column(String, nullable=True)
    meta_keywords = Column(String, nullable=True)
    og_image_url = Column(String, nullable=True)
    
    # Custom Code
    custom_css = Column(String, nullable=True)
    custom_js = Column(String, nullable=True)
    
    # Analytics & Tracking
    gtm_id = Column(String, nullable=True)
    fb_pixel_id = Column(String, nullable=True)
    tiktok_pixel_id = Column(String, nullable=True)
    ga4_id = Column(String, nullable=True)
    
    # Integrations
    webhook_url = Column(String, nullable=True)
    mailchimp_api_key = Column(String, nullable=True)
    mailchimp_server_prefix = Column(String, nullable=True)
    mailchimp_list_id = Column(String, nullable=True)
    
    # Compliance & Trust
    enable_cookie_consent = Column(Boolean, default=False, nullable=False)
    privacy_policy_url = Column(String, nullable=True)
    tos_url = Column(String, nullable=True)
    
    # Auto-Responder
    autoresponder_subject = Column(String, nullable=True)
    autoresponder_body = Column(String, nullable=True)
    ai_system_prompt = Column(String, nullable=True)
    default_sequence_id = Column(Uuid(as_uuid=True), ForeignKey("marketing_sequences.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(Enum(PageStatus), default=PageStatus.DRAFT, nullable=False)

    # A/B Testing
    is_ab_test_active = Column(Boolean, default=False, nullable=False)
    variant_name = Column(String, nullable=True) # e.g. 'A', 'B'
    is_ab_test_primary = Column(Boolean, default=False, nullable=False)
    ab_test_variant_of_id = Column(Uuid(as_uuid=True), ForeignKey("landing_pages.id", ondelete="SET NULL"), nullable=True)
    ab_test_auto_optimize = Column(Boolean, default=True, nullable=False)
    ab_test_traffic_weight = Column(Integer, default=50, nullable=False) # Only used if auto_optimize is False

    # Localization
    language_code = Column(String, default="en", nullable=False)
    translation_of_id = Column(Uuid(as_uuid=True), ForeignKey("landing_pages.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    sections = relationship("LandingPageSection", back_populates="landing_page", cascade="all, delete-orphan", order_by="LandingPageSection.order")
    client = relationship("User", foreign_keys=[client_id])
    campaign = relationship("Campaign", back_populates="pages")
    leads = relationship("Lead", back_populates="landing_page", cascade="all, delete-orphan")
    page_views = relationship("PageView", back_populates="landing_page", cascade="all, delete-orphan")
    default_sequence = relationship("MarketingSequence")

class LandingPageSection(Base):
    __tablename__ = "landing_page_sections"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    landing_page_id = Column(Uuid(as_uuid=True), ForeignKey("landing_pages.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    config = Column(JSON, nullable=False, default={})
    order = Column(Integer, nullable=False, default=0)

    landing_page = relationship("LandingPage", back_populates="sections")
