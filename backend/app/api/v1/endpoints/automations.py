from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.api import deps
from app.models.user import User
from app.models.automation import Automation, AutomationNode, AutomationEdge, AutomationStatus

router = APIRouter()

class NodeCreate(BaseModel):
    id: str
    type: str
    subtype: str
    position_x: float
    position_y: float
    data: dict

class EdgeCreate(BaseModel):
    id: str
    source: str
    target: str
    source_handle: str | None = None
    target_handle: str | None = None

class AutomationSave(BaseModel):
    nodes: List[NodeCreate]
    edges: List[EdgeCreate]
    name: str | None = None

class AutomationCreate(BaseModel):
    name: str
    description: str | None = None

class AutomationResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    status: str
    total_runs: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AutomationDetailResponse(AutomationResponse):
    nodes: List[Dict] = []
    edges: List[Dict] = []

@router.get("/", response_model=List[AutomationResponse])
def get_automations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return db.query(Automation).filter(Automation.client_id == current_user.id).order_by(Automation.created_at.desc()).all()

@router.get("/{id}")
def get_automation(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    automation = db.query(Automation).filter(Automation.id == id, Automation.client_id == current_user.id).first()
    if not automation:
        raise HTTPException(status_code=404, detail="Not found")
    
    prefix = f"{id}_"
    nodes = [{"id": n.id.replace(prefix, "", 1) if n.id.startswith(prefix) else n.id, "type": n.type, "subtype": n.subtype, "position": {"x": n.position_x, "y": n.position_y}, "data": n.data} for n in automation.nodes]
    edges = [{"id": e.id.replace(prefix, "", 1) if e.id.startswith(prefix) else e.id, "source": e.source.replace(prefix, "", 1) if e.source.startswith(prefix) else e.source, "target": e.target.replace(prefix, "", 1) if e.target.startswith(prefix) else e.target, "sourceHandle": e.source_handle, "targetHandle": e.target_handle} for e in automation.edges]
    
    return {
        "id": automation.id,
        "name": automation.name,
        "description": automation.description,
        "status": automation.status.value,
        "nodes": nodes,
        "edges": edges
    }

@router.post("/", response_model=AutomationResponse)
def create_automation(
    request: AutomationCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    automation = Automation(
        client_id=current_user.id,
        name=request.name,
        description=request.description
    )
    db.add(automation)
    db.commit()
    db.refresh(automation)
    return automation

@router.put("/{id}")
def save_automation(
    id: uuid.UUID,
    request: AutomationSave,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    automation = db.query(Automation).filter(Automation.id == id, Automation.client_id == current_user.id).first()
    if not automation:
        raise HTTPException(status_code=404)
        
    if request.name is not None:
        automation.name = request.name
        
    # Delete existing
    db.query(AutomationNode).filter(AutomationNode.automation_id == id).delete()
    db.query(AutomationEdge).filter(AutomationEdge.automation_id == id).delete()
    
    prefix = f"{id}_"
    # Add new
    for n in request.nodes:
        db.add(AutomationNode(
            id=f"{prefix}{n.id}" if not n.id.startswith(prefix) else n.id,
            automation_id=id,
            type=n.type,
            subtype=n.subtype,
            position_x=n.position_x,
            position_y=n.position_y,
            data=n.data
        ))
        
    for e in request.edges:
        db.add(AutomationEdge(
            id=f"{prefix}{e.id}" if not e.id.startswith(prefix) else e.id,
            automation_id=id,
            source=f"{prefix}{e.source}" if not e.source.startswith(prefix) else e.source,
            target=f"{prefix}{e.target}" if not e.target.startswith(prefix) else e.target,
            source_handle=e.source_handle,
            target_handle=e.target_handle
        ))
        
    db.commit()
    return {"message": "Saved"}

@router.patch("/{id}/status")
def update_status(
    id: uuid.UUID,
    status: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    automation = db.query(Automation).filter(Automation.id == id, Automation.client_id == current_user.id).first()
    if not automation:
        raise HTTPException(status_code=404)
    automation.status = AutomationStatus(status)
    db.commit()
    return {"message": "Status updated"}

@router.delete("/{id}")
def delete_automation(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    automation = db.query(Automation).filter(Automation.id == id, Automation.client_id == current_user.id).first()
    if not automation:
        raise HTTPException(status_code=404)
    db.delete(automation)
    db.commit()
    return {"message": "Deleted"}

@router.get("/{id}/runs")
def get_automation_runs(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    automation = db.query(Automation).filter(Automation.id == id, Automation.client_id == current_user.id).first()
    if not automation:
        raise HTTPException(status_code=404)
        
    from app.models.automation import AutomationRun
    runs = db.query(AutomationRun).filter(AutomationRun.automation_id == id).order_by(AutomationRun.created_at.desc()).limit(50).all()
    
    return [
        {
            "id": r.id,
            "status": r.status,
            "payload": r.payload,
            "logs": r.logs,
            "error_message": r.error_message,
            "created_at": r.created_at
        }
        for r in runs
    ]

# --- Execution Endpoint ---
from app.services.automation_engine import run_automation_workflow

@router.post("/{id}/webhook")
async def trigger_automation_webhook(
    id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Public endpoint to trigger an automation via webhook"""
    automation = db.query(Automation).filter(Automation.id == id).first()
    if not automation or automation.status != AutomationStatus.ACTIVE:
        return {"message": "Automation not found or not active"}
        
    try:
        payload = await request.json()
    except:
        payload = {}
        
    automation.total_runs += 1
    db.commit()
    
    # Run in background
    background_tasks.add_task(run_automation_workflow, str(id), payload)
    
    return {"message": "Automation triggered successfully"}
