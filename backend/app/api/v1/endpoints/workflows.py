from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timedelta

from app.api import deps
from app.models.user import User, UserRole
from app.models.workflow import WorkflowTemplate, WorkflowTaskTemplate
from app.models.client_task import ClientTask
from app.schemas.workflow import (
    WorkflowTemplateCreate, 
    WorkflowTemplateResponse, 
    WorkflowTaskTemplateCreate,
    WorkflowTaskTemplateResponse,
    ApplyWorkflowPayload,
    WorkflowTemplateUpdate
)
from app.core.activity import log_activity

router = APIRouter()

@router.get("/", response_model=List[WorkflowTemplateResponse])
def get_workflows(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get all workflow templates.
    """
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return db.query(WorkflowTemplate).all()

@router.post("/", response_model=WorkflowTemplateResponse)
def create_workflow(
    payload: WorkflowTemplateCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create a new workflow template.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create workflows")
    
    workflow = WorkflowTemplate(name=payload.name, description=payload.description)
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow

@router.put("/{workflow_id}", response_model=WorkflowTemplateResponse)
def update_workflow(
    workflow_id: UUID,
    payload: WorkflowTemplateUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update a workflow template.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    workflow = db.query(WorkflowTemplate).filter(WorkflowTemplate.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    if payload.name is not None:
        workflow.name = payload.name
    if payload.description is not None:
        workflow.description = payload.description
        
    db.commit()
    db.refresh(workflow)
    return workflow

@router.delete("/{workflow_id}")
def delete_workflow(
    workflow_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Delete a workflow template.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    workflow = db.query(WorkflowTemplate).filter(WorkflowTemplate.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    db.delete(workflow)
    db.commit()
    return {"message": "Workflow deleted"}

@router.post("/{workflow_id}/tasks", response_model=WorkflowTaskTemplateResponse)
def add_task_to_workflow(
    workflow_id: UUID,
    payload: WorkflowTaskTemplateCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Add a task template to a workflow.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    workflow = db.query(WorkflowTemplate).filter(WorkflowTemplate.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    task = WorkflowTaskTemplate(
        workflow_id=workflow_id,
        title=payload.title,
        description=payload.description,
        service_category=payload.service_category,
        due_in_days=payload.due_in_days
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/tasks/{task_id}")
def delete_workflow_task(
    task_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Delete a task template from a workflow.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    task = db.query(WorkflowTaskTemplate).filter(WorkflowTaskTemplate.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task template not found")
        
    db.delete(task)
    db.commit()
    return {"message": "Task template deleted"}

@router.post("/{workflow_id}/apply/{client_id}")
def apply_workflow(
    workflow_id: UUID,
    client_id: UUID,
    payload: ApplyWorkflowPayload,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Apply a workflow to a client. Generates actual tasks with calculated SLAs.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can apply workflows")
        
    workflow = db.query(WorkflowTemplate).filter(WorkflowTemplate.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    client = db.query(User).filter(User.id == client_id, User.role == UserRole.CLIENT).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    now = datetime.utcnow()
    created_tasks = []
    
    for template_task in workflow.tasks:
        due_date = now + timedelta(days=template_task.due_in_days)
        
        new_task = ClientTask(
            client_id=client_id,
            assigned_to_id=payload.staff_id,
            title=template_task.title,
            description=template_task.description,
            service_category=template_task.service_category,
            status="TODO",
            due_date=due_date
        )
        db.add(new_task)
        created_tasks.append(new_task)
        
    db.commit()
    
    log_activity(
        db=db,
        user_id=current_user.id,
        action="WORKFLOW_APPLIED",
        entity_type="CLIENT",
        entity_id=str(client_id),
        details=f"Applied workflow '{workflow.name}' to client, generated {len(created_tasks)} tasks."
    )
    
    return {"message": f"Successfully applied {len(created_tasks)} tasks."}

@router.post("/{workflow_id}/duplicate", response_model=WorkflowTemplateResponse)
def duplicate_workflow(
    workflow_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Duplicate a workflow and its tasks.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    workflow = db.query(WorkflowTemplate).filter(WorkflowTemplate.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    new_workflow = WorkflowTemplate(
        name=f"{workflow.name} (Copy)",
        description=workflow.description
    )
    db.add(new_workflow)
    db.commit()
    db.refresh(new_workflow)
    
    for template_task in workflow.tasks:
        new_task = WorkflowTaskTemplate(
            workflow_id=new_workflow.id,
            title=template_task.title,
            description=template_task.description,
            service_category=template_task.service_category,
            due_in_days=template_task.due_in_days
        )
        db.add(new_task)
        
    db.commit()
    db.refresh(new_workflow)
    return new_workflow
