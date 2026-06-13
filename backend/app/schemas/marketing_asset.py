from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.models.marketing_asset import MarketingAssetType, StepType

# --------------------------
# Marketing Sequence Step
# --------------------------
class MarketingSequenceStepBase(BaseModel):
    day_offset: int
    step_type: StepType
    subject_line: Optional[str] = None
    body_content: str

class MarketingSequenceStepResponse(MarketingSequenceStepBase):
    id: UUID
    sequence_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --------------------------
# Marketing Sequence
# --------------------------
class MarketingSequenceBase(BaseModel):
    name: str
    industry_category: str
    objective: Optional[str] = None

class MarketingSequenceResponse(MarketingSequenceBase):
    id: UUID
    steps: List[MarketingSequenceStepResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --------------------------
# Marketing Asset (Ad Copy)
# --------------------------
class MarketingAssetBase(BaseModel):
    asset_type: MarketingAssetType
    industry_category: str
    title: str
    content: str
    file_url: Optional[str] = None

class MarketingAssetResponse(MarketingAssetBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
