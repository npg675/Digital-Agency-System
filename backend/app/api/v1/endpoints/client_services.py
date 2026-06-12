from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

from app.api import deps
from app.models.user import User, UserRole
from app.models.client_service import ClientService
from app.core.activity import log_activity

router = APIRouter()

class ClientServiceUpdate(BaseModel):
    status: Optional[str] = None
    due_date: Optional[datetime] = None

class ClientServiceCreate(BaseModel):
    staff_id: UUID
    service_role: str
    due_date: Optional[datetime] = None

class ClientServiceResponse(BaseModel):
    id: UUID
    client_id: UUID
    staff_id: UUID
    staff_name: str
    staff_email: str
    service_role: str
    status: str
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/all", response_model=List[ClientServiceResponse])
def read_all_client_services(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Retrieve all client services. Admin only.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    services = db.query(ClientService).all()
    result = []
    for s in services:
        staff = db.query(User).filter(User.id == s.staff_id).first()
        if staff:
            result.append({
                "id": s.id,
                "client_id": s.client_id,
                "staff_id": s.staff_id,
                "staff_name": f"{staff.first_name or ''} {staff.last_name or ''}".strip() or staff.email,
                "staff_email": staff.email,
                "service_role": s.service_role,
                "status": s.status,
                "due_date": s.due_date,
                "completed_at": s.completed_at
            })
    return result

@router.get("/client/{client_id}", response_model=List[ClientServiceResponse])
def get_client_squad(
    client_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get all specialized staff assigned to this client.
    Admins can see all. Staff can see if they are assigned.
    Clients can see their own squad.
    """
    if current_user.role == UserRole.CLIENT and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    services = db.query(ClientService).filter(ClientService.client_id == client_id).all()
    
    result = []
    for s in services:
        staff = db.query(User).filter(User.id == s.staff_id).first()
        if staff:
            result.append({
                "id": s.id,
                "client_id": s.client_id,
                "staff_id": s.staff_id,
                "staff_name": f"{staff.first_name or ''} {staff.last_name or ''}".strip() or staff.email,
                "staff_email": staff.email,
                "service_role": s.service_role,
                "status": s.status,
                "due_date": s.due_date,
                "completed_at": s.completed_at
            })
            
    return result

@router.post("/client/{client_id}", response_model=ClientServiceResponse)
def add_specialist_to_squad(
    client_id: UUID,
    payload: ClientServiceCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Enroll a staff member to provide a specific service for this client.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can manage the client's squad")

    client = db.query(User).filter(User.id == client_id, User.role == UserRole.CLIENT).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    staff = db.query(User).filter(User.id == payload.staff_id, User.role == UserRole.STAFF).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    # Check if already assigned
    existing = db.query(ClientService).filter(
        ClientService.client_id == client_id,
        ClientService.staff_id == payload.staff_id,
        ClientService.service_role == payload.service_role
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="This staff member is already assigned to this role for this client")

    service = ClientService(
        client_id=client_id,
        staff_id=payload.staff_id,
        service_role=payload.service_role,
        due_date=payload.due_date
    )
    db.add(service)
    db.commit()
    db.refresh(service)

    # Log Activity
    log_activity(
        db=db,
        user_id=current_user.id,
        action="SQUAD_ENROLLED",
        entity_type="CLIENT_SERVICE",
        entity_id=str(service.id),
        details=f"Enrolled {staff.email} as '{payload.service_role}' for client {client.email}"
    )

    return {
        "id": service.id,
        "client_id": service.client_id,
        "staff_id": service.staff_id,
        "staff_name": f"{staff.first_name or ''} {staff.last_name or ''}".strip() or staff.email,
        "staff_email": staff.email,
        "service_role": service.service_role,
        "status": service.status,
        "due_date": service.due_date,
        "completed_at": service.completed_at
    }

@router.patch("/{id}", response_model=ClientServiceResponse)
def update_client_service(
    id: UUID,
    payload: ClientServiceUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update a client service enrollment (e.g., mark as COMPLETED).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can manage the client's squad")

    service = db.query(ClientService).filter(ClientService.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Squad enrollment not found")

    old_status = service.status
    update_data = payload.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(service, field, value)

    if "status" in update_data:
        if service.status == "COMPLETED" and old_status != "COMPLETED":
            service.completed_at = datetime.utcnow()
        elif service.status != "COMPLETED" and old_status == "COMPLETED":
            service.completed_at = None

    db.add(service)
    db.commit()
    db.refresh(service)

    staff = db.query(User).filter(User.id == service.staff_id).first()

    # Log Activity
    if "status" in update_data and old_status != service.status:
        log_activity(
            db=db,
            user_id=current_user.id,
            action="SQUAD_STATUS_CHANGED",
            entity_type="CLIENT_SERVICE",
            entity_id=str(service.id),
            details=f"Changed '{service.service_role}' status from {old_status} to {service.status}"
        )

    return {
        "id": service.id,
        "client_id": service.client_id,
        "staff_id": service.staff_id,
        "staff_name": f"{staff.first_name or ''} {staff.last_name or ''}".strip() or staff.email if staff else "Unknown",
        "staff_email": staff.email if staff else "Unknown",
        "service_role": service.service_role,
        "status": service.status,
        "due_date": service.due_date,
        "completed_at": service.completed_at
    }

@router.delete("/{id}")
def remove_specialist_from_squad(
    id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Remove a staff member from the client's squad.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can manage the client's squad")

    service = db.query(ClientService).filter(ClientService.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Squad enrollment not found")

    client = db.query(User).filter(User.id == service.client_id).first()
    staff = db.query(User).filter(User.id == service.staff_id).first()

    db.delete(service)
    
    # Log Activity
    log_activity(
        db=db,
        user_id=current_user.id,
        action="SQUAD_REMOVED",
        entity_type="CLIENT_SERVICE",
        entity_id=str(id),
        details=f"Removed {staff.email if staff else 'staff'} from role '{service.service_role}' for client {client.email if client else 'client'}"
    )

    db.commit()
    return {"message": "Specialist removed from squad"}
