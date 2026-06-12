from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class NotificationBase(BaseModel):
    message: str
    type: str
    reference_id: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: UUID

class NotificationUpdate(BaseModel):
    is_read: bool

class Notification(NotificationBase):
    id: UUID
    user_id: UUID
    is_read: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
