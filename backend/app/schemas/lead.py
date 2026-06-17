from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class LeadBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "NEW"

class LeadCreate(LeadBase):
    landing_page_id: UUID

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    ai_score: Optional[str] = None
    ai_score_reason: Optional[str] = None

class Lead(LeadBase):
    id: UUID
    landing_page_id: UUID
    submitted_at: datetime
    ai_score: Optional[str] = None
    ai_score_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
