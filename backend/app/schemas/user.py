from typing import Optional
from pydantic import BaseModel, EmailStr
from uuid import UUID
from app.models.user import UserRole

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    phone_number: Optional[str] = None
    can_manage_users: Optional[bool] = False
    
    # Brand Vault
    brand_primary_color: Optional[str] = None
    brand_secondary_color: Optional[str] = None
    brand_facebook_url: Optional[str] = None
    brand_twitter_url: Optional[str] = None
    brand_instagram_url: Optional[str] = None
    brand_linkedin_url: Optional[str] = None
    brand_tiktok_url: Optional[str] = None
    brand_whatsapp: Optional[str] = None
    brand_email: Optional[str] = None
    brand_notes: Optional[str] = None
    
    # Agency Configurations
    openai_key: Optional[str] = None
    default_domain: Optional[str] = None
    branding_logo: Optional[str] = None
    client_self_serve_mode: Optional[bool] = False
    show_agency_configs_to_staff: Optional[bool] = False
    show_agency_configs_to_clients: Optional[bool] = False
    show_reports_to_clients: Optional[bool] = False
    
    media_vault_file_size_limit_mb: Optional[int] = 5
    media_vault_total_size_limit_mb: Optional[int] = 100
    
    agency_name: Optional[str] = None
    agency_address: Optional[str] = None
    agency_email: Optional[str] = None
    agency_contact_no: Optional[str] = None
    agency_website: Optional[str] = None
    hide_agency_address: Optional[bool] = False
    hide_agency_email: Optional[bool] = False
    hide_agency_contact_no: Optional[bool] = False
    hide_agency_website: Optional[bool] = False
    agency_footer_text: Optional[str] = None
    hide_agency_footer_text: Optional[bool] = False
    agency_signature: Optional[str] = None
    hide_agency_signature: Optional[bool] = False
    hide_agency_signature_text: Optional[bool] = False
    agency_profile_text: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    
    whatsapp_access_token: Optional[str] = None
    whatsapp_phone_number_id: Optional[str] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str
    role: UserRole = UserRole.CLIENT
    manager_id: Optional[UUID] = None

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    manager_id: Optional[UUID] = None

class UserInDBBase(UserBase):
    id: Optional[UUID] = None
    role: UserRole
    manager_id: Optional[UUID] = None
    can_manage_users: bool = False

    class Config:
        from_attributes = True

# Additional properties to return via API
class UserResponse(UserInDBBase):
    pass

class User(UserInDBBase):
    pass
