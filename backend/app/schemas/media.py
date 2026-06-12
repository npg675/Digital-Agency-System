from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class MediaAssetBase(BaseModel):
    filename: str
    mimetype: str
    size: int
    notes: Optional[str] = None
    client_id: Optional[UUID] = None

class MediaAssetCreate(MediaAssetBase):
    filepath: str

class MediaAsset(MediaAssetBase):
    id: UUID
    filepath: str
    uploader_id: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
