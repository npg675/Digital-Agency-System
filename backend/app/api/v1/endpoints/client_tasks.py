from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.api import deps
from app.models.user import User, UserRole
from app.models.client_task import ClientTask
from app.schemas.client_task import ClientTaskCreate, ClientTaskUpdate, ClientTaskResponse
from app.core.activity import log_activity

router = APIRouter()

@router.get("/client/{client_id}", response_model=List[ClientTaskResponse])
def get_client_tasks(
    client_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get tasks assigned to a specific client.
    """
    if current_user.role == UserRole.CLIENT and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    tasks = db.query(ClientTask).filter(ClientTask.client_id == client_id).all()
    return tasks

@router.get("/staff/me", response_model=List[ClientTaskResponse])
def get_my_tasks(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get all tasks assigned to the current staff member across all clients.
    """
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    tasks = db.query(ClientTask).filter(ClientTask.assigned_to_id == current_user.id).all()
    return tasks

@router.get("/all", response_model=List[ClientTaskResponse])
def get_all_tasks(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Admin only: Get all tasks across the agency.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    tasks = db.query(ClientTask).all()
    return tasks

@router.post("/", response_model=ClientTaskResponse)
def create_client_task(
    task_in: ClientTaskCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create a new client task.
    """
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot create tasks directly")

    client = db.query(User).filter(User.id == task_in.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    task = ClientTask(
        client_id=task_in.client_id,
        assigned_to_id=task_in.assigned_to_id,
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        service_category=task_in.service_category,
        due_date=task_in.due_date
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Logging
    assigned_user = db.query(User).filter(User.id == task.assigned_to_id).first() if task.assigned_to_id else None
    assigned_name = f"{assigned_user.first_name} {assigned_user.last_name}".strip() if assigned_user else "Unassigned"
    
    log_activity(
        db=db,
        user_id=current_user.id,
        action="TASK_CREATED",
        entity_type="CLIENT_TASK",
        entity_id=str(task.id),
        details=f"Created task '{task.title}' for {client.email} (Assigned: {assigned_name})"
    )

    return task

@router.patch("/{task_id}", response_model=ClientTaskResponse)
def update_client_task(
    task_id: UUID,
    task_in: ClientTaskUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update a task (e.g., changing status).
    """
    task = db.query(ClientTask).filter(ClientTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == UserRole.CLIENT and current_user.id != task.client_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    old_status = task.status
    old_assigned = task.assigned_to_id

    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    # Track completion date for SLAs
    if "status" in update_data:
        if task.status == "DONE" and old_status != "DONE":
            task.completed_at = datetime.utcnow()
        elif task.status != "DONE" and old_status == "DONE":
            task.completed_at = None

    db.add(task)
    db.commit()
    db.refresh(task)

    # Activity Logging if status changed
    if "status" in update_data and old_status != task.status:
        log_activity(
            db=db,
            user_id=current_user.id,
            action="TASK_STATUS_CHANGED",
            entity_type="CLIENT_TASK",
            entity_id=str(task.id),
            details=f"Moved task '{task.title}' from {old_status} to {task.status}"
        )
    
    # Activity Logging if assignment changed
    if "assigned_to_id" in update_data and old_assigned != task.assigned_to_id:
        assigned_user = db.query(User).filter(User.id == task.assigned_to_id).first() if task.assigned_to_id else None
        assigned_name = f"{assigned_user.first_name} {assigned_user.last_name}".strip() if assigned_user else "Unassigned"
        log_activity(
            db=db,
            user_id=current_user.id,
            action="TASK_REASSIGNED",
            entity_type="CLIENT_TASK",
            entity_id=str(task.id),
            details=f"Reassigned task '{task.title}' to {assigned_name}"
        )

    return task

@router.delete("/{task_id}")
def delete_client_task(
    task_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Delete a task.
    """
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot delete tasks")

    task = db.query(ClientTask).filter(ClientTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    title = task.title
    db.delete(task)
    
    log_activity(
        db=db,
        user_id=current_user.id,
        action="TASK_DELETED",
        entity_type="CLIENT_TASK",
        entity_id=str(task_id),
        details=f"Deleted task '{title}'"
    )
    
    db.commit()
    return {"message": "Task deleted"}
