from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app import schemas, models
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.Notification])
def read_notifications(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve notifications for the current user.
    """
    notifications = db.query(models.Notification)\
        .filter(models.Notification.user_id == current_user.id)\
        .order_by(models.Notification.created_at.desc())\
        .offset(skip).limit(limit).all()
    return notifications

@router.patch("/{id}/read", response_model=schemas.Notification)
def mark_notification_read(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark a specific notification as read.
    """
    notification = db.query(models.Notification).filter(models.Notification.id == id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    notification.is_read = True
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark all unread notifications as read.
    """
    db.query(models.Notification)\
        .filter(models.Notification.user_id == current_user.id, models.Notification.is_read == False)\
        .update({"is_read": True})
    db.commit()
    return {"status": "success"}
