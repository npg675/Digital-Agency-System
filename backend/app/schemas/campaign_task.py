from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class CampaignTaskBase(BaseModel):
    title: str
    is_completed: bool = False
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[UUID] = None
    campaign_id: UUID

class CampaignTaskCreate(CampaignTaskBase):
    pass

class CampaignTaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[UUID] = None

class CampaignTask(CampaignTaskBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
