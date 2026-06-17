from typing import Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

class InboxMessageBase(BaseModel):
    direction: str
    channel: str
    content: str
    status: Optional[str] = "SENT"

class InboxMessageCreate(BaseModel):
    channel: str
    content: str

class InboxMessageInDBBase(InboxMessageBase):
    id: uuid.UUID
    lead_id: uuid.UUID
    sent_at: datetime

    class Config:
        from_attributes = True

class InboxMessage(InboxMessageInDBBase):
    pass
