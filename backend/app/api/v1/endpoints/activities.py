from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.models.activity_log import ActivityLog
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

router = APIRouter()

class ActivityLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    user_email: str
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    details: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ActivityLogResponse])
def get_activity_logs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[UUID] = None,
    action_type: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve activity logs. Only admins can access this endpoint.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can view activity logs")

    query = db.query(ActivityLog)
    
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if action_type:
        query = query.filter(ActivityLog.action == action_type)
        
    logs = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    
    # Manually stitch user data for the response (avoiding complex joins in Pydantic for now)
    result = []
    for log in logs:
        u = db.query(User).filter(User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "user_name": f"{u.first_name or ''} {u.last_name or ''}".strip() if u else "Unknown",
            "user_email": u.email if u else "Unknown",
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at
        })
        
    return result
