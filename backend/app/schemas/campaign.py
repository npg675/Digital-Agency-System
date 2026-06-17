from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    client_id: Optional[UUID] = None
    status: Optional[str] = "DRAFT"
    budget: Optional[float] = 0.0
    ad_spend: Optional[float] = 0.0
    revenue_generated: Optional[float] = 0.0

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    client_id: Optional[UUID] = None
    status: Optional[str] = None
    budget: Optional[float] = None
    ad_spend: Optional[float] = None
    revenue_generated: Optional[float] = None

class Campaign(CampaignBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
