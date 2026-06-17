from typing import Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

class SocialPostBase(BaseModel):
    content: str
    media_url: Optional[str] = None
    platforms: str
    scheduled_for: datetime
    status: Optional[str] = "SCHEDULED"

class SocialPostCreate(SocialPostBase):
    client_id: uuid.UUID

class SocialPostUpdate(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None
    platforms: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    status: Optional[str] = None

class SocialPostInDBBase(SocialPostBase):
    id: uuid.UUID
    client_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SocialPost(SocialPostInDBBase):
    pass

class AIAssistRequest(BaseModel):
    content: str
    action: str  # e.g., "rewrite", "hashtags", "professional", "engaging"
