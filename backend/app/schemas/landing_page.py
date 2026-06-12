from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from app.models.landing_page import PageStatus

class LandingPageSectionBase(BaseModel):
    type: str
    config: Dict[str, Any]
    order: int

class LandingPageSectionCreate(LandingPageSectionBase):
    pass

class LandingPageSection(LandingPageSectionBase):
    id: UUID
    landing_page_id: UUID

    model_config = ConfigDict(from_attributes=True)

class LandingPageBase(BaseModel):
    name: str
    slug: str
    industry: Optional[str] = None
    client_id: Optional[UUID] = None
    campaign_id: Optional[UUID] = None
    custom_domain: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_image_url: Optional[str] = None
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None
    # Analytics & Tracking
    gtm_id: Optional[str] = None
    fb_pixel_id: Optional[str] = None
    tiktok_pixel_id: Optional[str] = None
    ga4_id: Optional[str] = None
    
    # Integrations
    webhook_url: Optional[str] = None
    mailchimp_api_key: Optional[str] = None
    mailchimp_server_prefix: Optional[str] = None
    mailchimp_list_id: Optional[str] = None
    
    # Compliance & Trust
    enable_cookie_consent: bool = False
    privacy_policy_url: Optional[str] = None
    tos_url: Optional[str] = None
    
    # Auto-Responder
    autoresponder_subject: Optional[str] = None
    autoresponder_body: Optional[str] = None
    
    status: PageStatus = PageStatus.DRAFT
    is_ab_test_primary: bool = False
    ab_test_variant_of_id: Optional[UUID] = None
    language_code: str = "en"
    translation_of_id: Optional[UUID] = None

class LandingPageCreate(LandingPageBase):
    template_id: Optional[UUID] = None

class LandingPageUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    industry: Optional[str] = None
    client_id: Optional[UUID] = None
    campaign_id: Optional[UUID] = None
    custom_domain: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_image_url: Optional[str] = None
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None
    # Analytics & Tracking
    gtm_id: Optional[str] = None
    fb_pixel_id: Optional[str] = None
    tiktok_pixel_id: Optional[str] = None
    ga4_id: Optional[str] = None
    
    # Integrations
    webhook_url: Optional[str] = None
    mailchimp_api_key: Optional[str] = None
    mailchimp_server_prefix: Optional[str] = None
    mailchimp_list_id: Optional[str] = None
    
    # Compliance & Trust
    enable_cookie_consent: Optional[bool] = None
    privacy_policy_url: Optional[str] = None
    tos_url: Optional[str] = None
    
    # Auto-Responder
    autoresponder_subject: Optional[str] = None
    autoresponder_body: Optional[str] = None
    
    status: Optional[PageStatus] = None
    is_ab_test_primary: Optional[bool] = None
    ab_test_variant_of_id: Optional[UUID] = None
    language_code: Optional[str] = None
    translation_of_id: Optional[UUID] = None

class LandingPage(LandingPageBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    sections: List[LandingPageSection] = []
    available_languages: List[str] = [] # populated dynamically on read

    model_config = ConfigDict(from_attributes=True)
