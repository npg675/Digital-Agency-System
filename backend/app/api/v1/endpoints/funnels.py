from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.api import deps
from app.models.user import User
from app.models.funnel import Funnel, FunnelStep
from app.models.landing_page import LandingPage

router = APIRouter()

class FunnelCreate(BaseModel):
    name: str

class FunnelStepCreate(BaseModel):
    landing_page_id: uuid.UUID
    step_type: str

class FunnelStepResponse(BaseModel):
    id: uuid.UUID
    landing_page_id: uuid.UUID | None
    step_order: int
    step_type: str
    views: int
    conversions: int
    revenue: float
    page_name: str | None = None
    
    class Config:
        from_attributes = True

class FunnelResponse(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    total_revenue: float
    created_at: datetime
    steps: List[FunnelStepResponse] = []
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[FunnelResponse])
def get_funnels(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get all funnels for the current client."""
    funnels = db.query(Funnel).filter(Funnel.client_id == current_user.id).order_by(Funnel.created_at.desc()).all()
    
    # Hydrate page names for UI
    result = []
    for f in funnels:
        f_resp = FunnelResponse.model_validate(f)
        for i, step in enumerate(f.steps):
            if step.landing_page_id:
                page = db.query(LandingPage).filter(LandingPage.id == step.landing_page_id).first()
                if page:
                    f_resp.steps[i].page_name = page.name
        result.append(f_resp)
        
    return result

@router.post("/", response_model=FunnelResponse)
def create_funnel(
    funnel_in: FunnelCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create a new funnel."""
    f = Funnel(
        name=funnel_in.name,
        client_id=current_user.id
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

@router.post("/{funnel_id}/steps", response_model=FunnelStepResponse)
def add_step(
    funnel_id: uuid.UUID,
    step_in: FunnelStepCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Add a step to a funnel."""
    funnel = db.query(Funnel).filter(Funnel.id == funnel_id, Funnel.client_id == current_user.id).first()
    if not funnel:
        raise HTTPException(status_code=404, detail="Funnel not found")
        
    # Get max order
    current_steps = db.query(FunnelStep).filter(FunnelStep.funnel_id == funnel_id).all()
    next_order = len(current_steps) + 1
    
    step = FunnelStep(
        funnel_id=funnel_id,
        landing_page_id=step_in.landing_page_id,
        step_order=next_order,
        step_type=step_in.step_type
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    
    page = db.query(LandingPage).filter(LandingPage.id == step.landing_page_id).first()
    
    resp = FunnelStepResponse.model_validate(step)
    resp.page_name = page.name if page else "Unknown Page"
    
    return resp

@router.delete("/{funnel_id}")
def delete_funnel(
    funnel_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    funnel = db.query(Funnel).filter(Funnel.id == funnel_id, Funnel.client_id == current_user.id).first()
    if not funnel:
        raise HTTPException(status_code=404)
    db.delete(funnel)
    db.commit()
    return {"message": "Deleted"}
