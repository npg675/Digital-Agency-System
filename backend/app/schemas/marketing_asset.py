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
    video_url: Optional[str] = None
    video_status: Optional[str] = None
    video_job_id: Optional[str] = None
    video_provider: Optional[str] = None
    approval_status: Optional[str] = None
    approval_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --------------------------
# AI Generation Requests
# --------------------------
class GenerateAdRequest(BaseModel):
    industry_category: str
    platform: str
    topic: str
    content_style: Optional[str] = None
    target_pain_points: Optional[str] = None
    video_length: Optional[str] = None
    ai_model: Optional[str] = None

class AssetApprovalUpdate(BaseModel):
    approval_status: str # "pending", "approved", "revision"
    approval_note: Optional[str] = None

class MarketingAssetUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

