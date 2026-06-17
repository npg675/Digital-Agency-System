from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class QuotationItemBase(BaseModel):
    description: str
    quantity: int = 1
    unit_price: float
    tax_rate: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    total: float = 0.0

class QuotationItemCreate(QuotationItemBase):
    pass

class QuotationItemResponse(QuotationItemBase):
    id: UUID
    quotation_id: UUID

    model_config = ConfigDict(from_attributes=True)

class QuotationLogBase(BaseModel):
    action: str
    details: Optional[str] = None

class QuotationLogResponse(QuotationLogBase):
    id: UUID
    quotation_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class QuotationBase(BaseModel):
    status: str = "DRAFT"
    total_amount: float = 0.0
    valid_until: Optional[datetime] = None
    template_name: str = "professional"
    notes: Optional[str] = None
    customization: Optional[Dict[str, Any]] = None

class QuotationCreate(QuotationBase):
    client_id: UUID
    items: List[QuotationItemCreate] = []

class QuotationUpdate(BaseModel):
    client_id: Optional[UUID] = None
    status: Optional[str] = None
    total_amount: Optional[float] = None
    valid_until: Optional[datetime] = None
    template_name: Optional[str] = None
    notes: Optional[str] = None
    customization: Optional[Dict[str, Any]] = None
    items: Optional[List[QuotationItemCreate]] = None

class QuotationClientResponse(BaseModel):
    id: UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class QuotationAgencyResponse(BaseModel):
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
    branding_logo: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class QuotationResponse(QuotationBase):
    id: UUID
    client_id: UUID
    created_at: datetime
    updated_at: datetime
    items: List[QuotationItemResponse] = []
    logs: List[QuotationLogResponse] = []
    client: Optional[QuotationClientResponse] = None
    agency: Optional[QuotationAgencyResponse] = None

    model_config = ConfigDict(from_attributes=True)
