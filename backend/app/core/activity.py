from sqlalchemy.orm import Session
from uuid import UUID
from app.models.activity_log import ActivityLog

def log_activity(
    db: Session,
    user_id: UUID,
    action: str,
    details: str,
    entity_type: str = None,
    entity_id: str = None,
    ip_address: str = None,
):
    """
    Helper function to log an activity.
    """
    activity = ActivityLog(
        user_id=user_id,
        action=action,
        details=details,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        ip_address=ip_address
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
