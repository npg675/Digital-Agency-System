from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app import schemas, models
from app.api import deps
from app.models.user import UserRole

router = APIRouter()

@router.get("/campaign/{campaign_id}", response_model=List[schemas.CampaignTask])
def read_campaign_tasks(
    campaign_id: UUID,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve tasks for a specific campaign.
    """
    # Authorize
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if current_user.role == UserRole.CLIENT and campaign.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    tasks = db.query(models.CampaignTask).filter(models.CampaignTask.campaign_id == campaign_id).offset(skip).limit(limit).all()
    return tasks

@router.post("/", response_model=schemas.CampaignTask)
def create_campaign_task(
    *,
    db: Session = Depends(deps.get_db),
    task_in: schemas.CampaignTaskCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new campaign task.
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == task_in.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if current_user.role == UserRole.CLIENT and campaign.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    task = models.CampaignTask(
        title=task_in.title,
        is_completed=task_in.is_completed,
        due_date=task_in.due_date,
        campaign_id=task_in.campaign_id,
        assigned_to_id=task_in.assigned_to_id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.put("/{id}", response_model=schemas.CampaignTask)
def update_campaign_task(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    task_in: schemas.CampaignTaskUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a campaign task.
    """
    task = db.query(models.CampaignTask).filter(models.CampaignTask.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    campaign = db.query(models.Campaign).filter(models.Campaign.id == task.campaign_id).first()
    if current_user.role == UserRole.CLIENT and campaign.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if task_in.title is not None:
        task.title = task_in.title
    if task_in.is_completed is not None:
        task.is_completed = task_in.is_completed
    if task_in.due_date is not None:
        task.due_date = task_in.due_date
    if task_in.assigned_to_id is not None:
        task.assigned_to_id = task_in.assigned_to_id

    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{id}", response_model=schemas.CampaignTask)
def delete_campaign_task(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a campaign task.
    """
    task = db.query(models.CampaignTask).filter(models.CampaignTask.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    campaign = db.query(models.Campaign).filter(models.Campaign.id == task.campaign_id).first()
    if current_user.role == UserRole.CLIENT and campaign.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(task)
    db.commit()
    return task
