from sqlalchemy import Column, String, Enum, ForeignKey, Boolean, Integer, Uuid, DateTime
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.models.base import Base, TimestampMixin

import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    CLIENT = "CLIENT"

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.ADMIN, nullable=False)
    manager_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Profile Details
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    
    # Brand Vault (For Clients)
    brand_primary_color = Column(String, nullable=True)
    brand_secondary_color = Column(String, nullable=True)
    brand_facebook_url = Column(String, nullable=True)
    brand_twitter_url = Column(String, nullable=True)
    brand_instagram_url = Column(String, nullable=True)
    brand_linkedin_url = Column(String, nullable=True)
    brand_tiktok_url = Column(String, nullable=True)
    brand_whatsapp = Column(String, nullable=True)
    brand_email = Column(String, nullable=True)
    brand_notes = Column(String, nullable=True)

    # Permissions
    can_manage_users = Column(Boolean, default=False, nullable=False)
    
    # Agency Configurations (mostly used by ADMIN)
    openai_key = Column(String, nullable=True)
    default_domain = Column(String, nullable=True)
    branding_logo = Column(String, nullable=True)
    client_self_serve_mode = Column(Boolean, default=False, nullable=False)
    show_agency_configs_to_staff = Column(Boolean, default=False, nullable=False)
    show_agency_configs_to_clients = Column(Boolean, default=False, nullable=False)
    show_reports_to_clients = Column(Boolean, default=False, nullable=False)
    
    media_vault_file_size_limit_mb = Column(Integer, default=5, nullable=False)
    media_vault_total_size_limit_mb = Column(Integer, default=100, nullable=False)
    
    agency_name = Column(String, nullable=True)
    agency_address = Column(String, nullable=True)
    agency_email = Column(String, nullable=True)
    agency_contact_no = Column(String, nullable=True)
    agency_website = Column(String, nullable=True)
    hide_agency_address = Column(Boolean, default=False)
    hide_agency_email = Column(Boolean, default=False)
    hide_agency_contact_no = Column(Boolean, default=False)
    hide_agency_website = Column(Boolean, default=False)
    agency_footer_text = Column(String, nullable=True)
    hide_agency_footer_text = Column(Boolean, default=False)
    agency_signature = Column(String, nullable=True)
    hide_agency_signature = Column(Boolean, default=False)
    hide_agency_signature_text = Column(Boolean, default=False)
    agency_profile_text = Column(String, nullable=True)
    smtp_host = Column(String, nullable=True)
    smtp_port = Column(Integer, nullable=True)
    smtp_user = Column(String, nullable=True)
    smtp_password = Column(String, nullable=True)
    smtp_from_email = Column(String, nullable=True)
    
    whatsapp_access_token = Column(String, nullable=True)
    whatsapp_phone_number_id = Column(String, nullable=True)

    # Google Calendar Sync Integrations
    google_access_token = Column(String, nullable=True)
    google_refresh_token = Column(String, nullable=True)
    google_token_expiry = Column(DateTime, nullable=True)

    manager = relationship("User", remote_side=[id], backref="clients")
