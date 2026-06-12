from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from app.models.template import TemplateCategory

class TemplateSectionBase(BaseModel):
    type: str
    config: Dict[str, Any]
    order: int

class TemplateSectionCreate(TemplateSectionBase):
    pass

class TemplateSection(TemplateSectionBase):
    id: UUID
    template_id: UUID

    model_config = ConfigDict(from_attributes=True)

class TemplateBase(BaseModel):
    name: str
    category: TemplateCategory
    thumbnail_url: Optional[str] = None

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(TemplateBase):
    name: Optional[str] = None
    category: Optional[TemplateCategory] = None

class Template(TemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    sections: List[TemplateSection] = []

    model_config = ConfigDict(from_attributes=True)
