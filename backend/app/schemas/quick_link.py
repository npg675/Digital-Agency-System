from pydantic import BaseModel, HttpUrl
from typing import Optional
from uuid import UUID
from datetime import datetime

class QuickLinkBase(BaseModel):
    name: str
    url: str
    category: Optional[str] = None
    is_shared_with_staff: bool = False

class QuickLinkCreate(QuickLinkBase):
    pass

class QuickLinkUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    is_shared_with_staff: Optional[bool] = None

class QuickLink(QuickLinkBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
