from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

from app.api import deps
from app.models.user import User, UserRole
from app.models.quick_link import QuickLink
from app.schemas.quick_link import QuickLink as QuickLinkSchema, QuickLinkCreate, QuickLinkUpdate

router = APIRouter()

@router.get("", response_model=List[QuickLinkSchema])
@router.get("/", response_model=List[QuickLinkSchema], include_in_schema=False)
def read_quick_links(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # If admin or staff, they see their own links PLUS links that are shared with staff
    if current_user.role in [UserRole.ADMIN, UserRole.STAFF]:
        links = db.query(QuickLink).filter(
            (QuickLink.user_id == current_user.id) | 
            (QuickLink.is_shared_with_staff == True)
        ).order_by(QuickLink.created_at.desc()).offset(skip).limit(limit).all()
    else:
        # Clients or other roles just see their own
        links = db.query(QuickLink).filter(
            QuickLink.user_id == current_user.id
        ).order_by(QuickLink.created_at.desc()).offset(skip).limit(limit).all()
    return links

@router.post("", response_model=QuickLinkSchema)
@router.post("/", response_model=QuickLinkSchema, include_in_schema=False)
def create_quick_link(
    *,
    db: Session = Depends(deps.get_db),
    link_in: QuickLinkCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    link = QuickLink(**link_in.model_dump(), user_id=current_user.id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return link

@router.patch("/{id}", response_model=QuickLinkSchema)
def update_quick_link(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    link_in: QuickLinkUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    link = db.query(QuickLink).filter(QuickLink.id == id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    # Permission check: Only owner or ADMIN can edit
    if link.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = link_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(link, field, value)
    
    link.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(link)
    return link

@router.delete("/{id}")
def delete_quick_link(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    link = db.query(QuickLink).filter(QuickLink.id == id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    # Permission check: Only owner or ADMIN can delete
    if link.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db.delete(link)
    db.commit()
    return {"message": "Link deleted successfully"}
