import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api import deps
from app.models.service_role import ServiceRole
from app.models.user import User, UserRole
from app.schemas.service_role import ServiceRoleCreate, ServiceRoleUpdate, ServiceRoleResponse

router = APIRouter()

@router.get("", response_model=List[ServiceRoleResponse])
def read_service_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Retrieve service roles. Any authenticated user can read roles.
    """
    roles = db.query(ServiceRole).order_by(ServiceRole.name).offset(skip).limit(limit).all()
    return roles

@router.post("", response_model=ServiceRoleResponse)
def create_service_role(
    *,
    db: Session = Depends(deps.get_db),
    role_in: ServiceRoleCreate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create a new service role. Admin only.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    role = ServiceRole(name=role_in.name)
    db.add(role)
    try:
        db.commit()
        db.refresh(role)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Service role with this name already exists")
    return role

@router.patch("/{role_id}", response_model=ServiceRoleResponse)
def update_service_role(
    *,
    db: Session = Depends(deps.get_db),
    role_id: uuid.UUID,
    role_in: ServiceRoleUpdate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update a service role. Admin only.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    role = db.query(ServiceRole).filter(ServiceRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Service role not found")
        
    role.name = role_in.name
    try:
        db.add(role)
        db.commit()
        db.refresh(role)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Service role with this name already exists")
    return role

@router.delete("/{role_id}")
def delete_service_role(
    *,
    db: Session = Depends(deps.get_db),
    role_id: uuid.UUID,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Delete a service role. Admin only.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    role = db.query(ServiceRole).filter(ServiceRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Service role not found")
        
    db.delete(role)
    db.commit()
    return {"status": "success"}
