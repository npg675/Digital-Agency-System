from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.core.security import get_password_hash
from app.api.deps import get_current_user
from app.core.activity import log_activity

router = APIRouter()


class HandoverRequest(BaseModel):
    new_manager_id: UUID
    reason: Optional[str] = None

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user

@router.get("/agency-config")
def get_agency_config(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get global agency configuration (available to all logged-in users conditionally)."""
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if not admin:
        return {"client_self_serve_mode": False, "can_see_agency_configs": False}

    if current_user.role == UserRole.ADMIN:
        return {
            "agency_name": admin.agency_name,
            "agency_address": admin.agency_address,
            "agency_email": admin.agency_email,
            "agency_contact_no": admin.agency_contact_no,
            "agency_website": admin.agency_website,
            "hide_agency_address": admin.hide_agency_address,
            "hide_agency_email": admin.hide_agency_email,
            "hide_agency_contact_no": admin.hide_agency_contact_no,
            "hide_agency_website": admin.hide_agency_website,
            "agency_footer_text": admin.agency_footer_text,
            "hide_agency_footer_text": admin.hide_agency_footer_text,
            "agency_signature": admin.agency_signature,
            "hide_agency_signature": admin.hide_agency_signature,
            "hide_agency_signature_text": admin.hide_agency_signature_text,
            "agency_profile_text": admin.agency_profile_text,
            "default_domain": admin.default_domain,
            "branding_logo": admin.branding_logo,
            "client_self_serve_mode": admin.client_self_serve_mode,
            "show_agency_configs_to_staff": admin.show_agency_configs_to_staff,
            "show_agency_configs_to_clients": admin.show_agency_configs_to_clients,
            "show_reports_to_clients": admin.show_reports_to_clients,
            "media_vault_file_size_limit_mb": admin.media_vault_file_size_limit_mb,
            "media_vault_total_size_limit_mb": admin.media_vault_total_size_limit_mb,
            "smtp_host": admin.smtp_host,
            "smtp_port": admin.smtp_port,
            "smtp_user": admin.smtp_user,
            "smtp_password": admin.smtp_password,
            "smtp_from_email": admin.smtp_from_email,
            "whatsapp_access_token": admin.whatsapp_access_token,
            "whatsapp_phone_number_id": admin.whatsapp_phone_number_id,
            "can_see_agency_configs": True
        }
    
    can_see = False
    if current_user.role == UserRole.STAFF and admin.show_agency_configs_to_staff:
        can_see = True
    elif current_user.role == UserRole.CLIENT and admin.show_agency_configs_to_clients:
        can_see = True
        
    is_staff = current_user.role == UserRole.STAFF
    can_see_branding = can_see or is_staff
        
    return {
        "client_self_serve_mode": admin.client_self_serve_mode,
        "show_reports_to_clients": admin.show_reports_to_clients,
        "media_vault_file_size_limit_mb": admin.media_vault_file_size_limit_mb,
        "media_vault_total_size_limit_mb": admin.media_vault_total_size_limit_mb,
        "agency_name": admin.agency_name if can_see_branding else None,
        "agency_address": admin.agency_address if can_see_branding else None,
        "agency_email": admin.agency_email if can_see_branding else None,
        "agency_contact_no": admin.agency_contact_no if can_see_branding else None,
        "agency_website": admin.agency_website if can_see_branding else None,
        "hide_agency_address": admin.hide_agency_address,
        "hide_agency_email": admin.hide_agency_email,
        "hide_agency_contact_no": admin.hide_agency_contact_no,
        "hide_agency_website": admin.hide_agency_website,
        "agency_footer_text": admin.agency_footer_text if can_see_branding else None,
        "hide_agency_footer_text": admin.hide_agency_footer_text,
        "agency_signature": admin.agency_signature if can_see_branding else None,
        "hide_agency_signature": admin.hide_agency_signature,
        "hide_agency_signature_text": admin.hide_agency_signature_text,
        "agency_profile_text": admin.agency_profile_text if can_see_branding else None,
        "branding_logo": admin.branding_logo if can_see_branding else None,
        "default_domain": admin.default_domain if can_see else None,
        "can_see_agency_configs": can_see
    }

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Staff can only see their assigned clients (either as primary manager or squad member)
    if current_user.role == UserRole.STAFF:
        from app.models.client_service import ClientService
        assigned_services = db.query(ClientService.client_id).filter(ClientService.staff_id == current_user.id).subquery()
        users = db.query(User).filter(
            User.role == UserRole.CLIENT,
            (User.manager_id == current_user.id) | (User.id.in_(assigned_services))
        ).all()
    else:
        users = db.query(User).all()
    return users


@router.get("/staff", response_model=List[UserResponse])
def get_staff_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all STAFF members. Used for handover dropdowns. Admin only."""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    staff = db.query(User).filter(User.role == UserRole.STAFF).all()
    return staff

@router.get("/handover-requests/pending")
def get_all_pending_handover_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all pending handover requests across all clients. Admin only."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can view all pending handover requests")

    from app.models.handover_request import HandoverRequest as HRModel, HandoverStatus
    reqs = db.query(HRModel).filter(HRModel.status == HandoverStatus.PENDING).all()

    result = []
    for r in reqs:
        client = db.query(User).filter(User.id == r.client_id).first()
        requester = db.query(User).filter(User.id == r.requested_by_id).first()
        new_mgr = db.query(User).filter(User.id == r.new_manager_id).first()
        result.append({
            "id": str(r.id),
            "client_id": str(r.client_id),
            "client_name": f"{client.first_name or ''} {client.last_name or ''}".strip() or client.email if client else "Unknown",
            "requested_by_id": str(r.requested_by_id),
            "requested_by_name": f"{requester.first_name or ''} {requester.last_name or ''}".strip() or requester.email if requester else "Unknown",
            "new_manager_id": str(r.new_manager_id),
            "new_manager_name": f"{new_mgr.first_name or ''} {new_mgr.last_name or ''}".strip() or new_mgr.email if new_mgr else "Unknown",
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return result

@router.post("/", response_model=UserResponse)
def create_user(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Staff checks
    if current_user.role == UserRole.STAFF:
        if not current_user.can_manage_users:
            raise HTTPException(status_code=403, detail="You do not have permission to manage users")
        if user_in.role != UserRole.CLIENT:
            raise HTTPException(status_code=403, detail="Staff can only create clients")

    if user_in.role in [UserRole.ADMIN, UserRole.STAFF]:
        if not user_in.email or not user_in.password:
            raise HTTPException(status_code=400, detail="Email and password are required for ADMIN and STAFF roles.")

    if user_in.email:
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(status_code=400, detail="Email already registered")

    # Auto-assign manager if staff is creating the client
    manager_id = user_in.manager_id
    if current_user.role == UserRole.STAFF and user_in.role == UserRole.CLIENT:
        manager_id = current_user.id

    hashed_pw = get_password_hash(user_in.password) if user_in.password else None

    new_user = User(
        email=user_in.email if user_in.email else None,
        hashed_password=hashed_pw,
        role=user_in.role,
        manager_id=manager_id,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        company_name=user_in.company_name,
        phone_number=user_in.phone_number,
        can_manage_users=user_in.can_manage_users if current_user.role == UserRole.ADMIN else False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="CREATE_USER",
        entity_type="USER",
        entity_id=str(new_user.id),
        details=f"Created {new_user.role} user {new_user.email}"
    )

    if manager_id and str(manager_id) != str(current_user.id):
        from app.models.notification import Notification
        db.add(Notification(
            user_id=manager_id,
            type="CLIENT_ASSIGNED",
            message=f"You have been assigned as the Account Manager for new client {new_user.first_name or new_user.email}.",
            reference_id=str(new_user.id)
        ))
        db.commit()

    return new_user

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: UUID, user_in: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Let users update themselves; otherwise check permissions
    if str(current_user.id) != str(user_id):
        if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        
        if current_user.role == UserRole.STAFF and not current_user.can_manage_users:
            raise HTTPException(status_code=403, detail="You do not have permission to manage users")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if current_user.role == UserRole.STAFF:
            from app.models.client_service import ClientService
            is_manager = user.manager_id == current_user.id
            is_squad = db.query(ClientService).filter(
                ClientService.client_id == user.id,
                ClientService.staff_id == current_user.id
            ).first() is not None
            
            if not is_manager and not is_squad:
                raise HTTPException(status_code=403, detail="You can only edit your assigned clients")
    else:
        user = current_user
        
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)
    
    old_manager_id = user.manager_id
    manager_changed = False
    
    if "manager_id" in user_in.model_fields_set and current_user.role == UserRole.ADMIN:
        if user.manager_id != user_in.manager_id:
            manager_changed = True
        user.manager_id = user_in.manager_id  # Can be None (to unassign)
        
    update_data = user_in.model_dump(exclude_unset=True, exclude={"password", "manager_id"})
    for field, value in update_data.items():
        if field == "can_manage_users" and current_user.role != UserRole.ADMIN:
            continue # Only admins can grant this permission
        setattr(user, field, value)
        
    db.commit()
    db.refresh(user)

    if manager_changed and user.manager_id and str(user.manager_id) != str(current_user.id):
        from app.models.notification import Notification
        db.add(Notification(
            user_id=user.manager_id,
            type="CLIENT_ASSIGNED",
            message=f"You have been assigned as the Account Manager for {user.first_name or user.email}.",
            reference_id=str(user.id)
        ))
        db.commit()

    log_activity(
        db=db,
        user_id=current_user.id,
        action="UPDATE_USER",
        entity_type="USER",
        entity_id=str(user.id),
        details=f"Updated profile for {user.email}"
    )

    return user

@router.delete("/{user_id}")
def delete_user(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    db.delete(user)
    db.commit()

    log_activity(
        db=db,
        user_id=current_user.id,
        action="DELETE_USER",
        entity_type="USER",
        entity_id=str(user_id),
        details=f"Deleted user {user.email}"
    )

    return {"message": "User deleted"}


@router.post("/{user_id}/handover")
def handover_client(
    user_id: UUID,
    body: HandoverRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Handover a client to a different staff member.
    - ADMIN: immediate reassignment, no approval needed.
    - STAFF: creates a PENDING handover request; admin must approve.
    """
    from app.models.client_note import ClientNote
    from app.models.notification import Notification
    from app.models.handover_request import HandoverRequest as HandoverRequestModel, HandoverStatus

    client = db.query(User).filter(User.id == user_id, User.role == UserRole.CLIENT).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if current_user.role == UserRole.STAFF and client.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only hand over your own clients")
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    new_manager = db.query(User).filter(User.id == body.new_manager_id, User.role == UserRole.STAFF).first()
    if not new_manager:
        raise HTTPException(status_code=404, detail="New manager must be an active staff member")

    if new_manager.id == client.manager_id:
        raise HTTPException(status_code=400, detail="Client is already assigned to this staff member")

    # ── ADMIN: direct, immediate handover ──────────────────────────────
    if current_user.role == UserRole.ADMIN:
        old_manager = db.query(User).filter(User.id == client.manager_id).first() if client.manager_id else None
        client.manager_id = new_manager.id
        db.commit()
        db.refresh(client)

        old_name = f"{old_manager.first_name or ''} {old_manager.last_name or ''}".strip() if old_manager else "Unassigned"
        new_name = f"{new_manager.first_name or ''} {new_manager.last_name or ''}".strip() or new_manager.email
        handover_by = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email

        note_lines = [
            f"🔄 Client handover by {handover_by} (Admin — immediate)",
            f"From: {(old_manager.email if old_manager else None) or old_name or 'Unassigned'}",
            f"To: {new_name}",
        ]
        if body.reason:
            note_lines.append(f"Reason: {body.reason}")

        db.add(ClientNote(content="\n".join(note_lines), client_id=client.id, author_id=current_user.id, is_internal=True))

        notify_users = set()
        if old_manager:
            notify_users.add(old_manager.id)
        notify_users.add(new_manager.id)
        for admin in db.query(User).filter(User.role == UserRole.ADMIN).all():
            notify_users.add(admin.id)
        notify_users.discard(current_user.id)

        for uid in notify_users:
            if uid == new_manager.id:
                msg = f"You have been assigned as manager for {client.first_name or client.email} by Admin {handover_by}."
            elif old_manager and uid == old_manager.id:
                msg = f"Your client {client.first_name or client.email} was reassigned to {new_name} by Admin {handover_by}."
            else:
                msg = f"Client {client.first_name or client.email} was handed over from {old_name} to {new_name} by {handover_by}."
            db.add(Notification(user_id=uid, type="HANDOVER", message=msg, reference_id=str(client.id)))

        log_activity(
            db=db,
            user_id=current_user.id,
            action="HANDOVER_COMPLETED",
            entity_type="USER",
            entity_id=str(client.id),
            details=f"Admin immediately handed over client {client.email} to {new_name}"
        )

        db.commit()
        return {"status": "completed", "message": "Handover completed immediately."}

    # ── STAFF: create a pending request, notify admins ─────────────────
    # Cancel any existing pending request for this client by this staff
    existing = db.query(HandoverRequestModel).filter(
        HandoverRequestModel.client_id == client.id,
        HandoverRequestModel.requested_by_id == current_user.id,
        HandoverRequestModel.status == HandoverStatus.PENDING,
    ).first()
    if existing:
        db.delete(existing)

    handover_req = HandoverRequestModel(
        client_id=client.id,
        requested_by_id=current_user.id,
        new_manager_id=new_manager.id,
        reason=body.reason,
        status=HandoverStatus.PENDING,
    )
    db.add(handover_req)
    db.commit()
    db.refresh(handover_req)

    requester_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
    new_name = f"{new_manager.first_name or ''} {new_manager.last_name or ''}".strip() or new_manager.email

    # Notify all admins
    for admin in db.query(User).filter(User.role == UserRole.ADMIN).all():
        db.add(Notification(
            user_id=admin.id,
            type="HANDOVER_REQUEST",
            message=f"{requester_name} requested to hand over client {client.first_name or client.email} to {new_name}. Awaiting your approval.",
            reference_id=str(client.id),
        ))

    log_activity(
        db=db,
        user_id=current_user.id,
        action="HANDOVER_REQUESTED",
        entity_type="HANDOVER_REQUEST",
        entity_id=str(handover_req.id),
        details=f"Requested handover of client {client.email} to {new_name}"
    )

    db.commit()
    return {"status": "pending", "message": "Handover request submitted. Awaiting admin approval.", "request_id": str(handover_req.id)}


@router.get("/{user_id}/handover-requests")
def get_client_handover_requests(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get pending handover requests for a specific client. Admin only."""
    if current_user.role != UserRole.ADMIN:
        # Staff can see their own pending requests for this client
        from app.models.handover_request import HandoverRequest as HRModel, HandoverStatus
        reqs = db.query(HRModel).filter(
            HRModel.client_id == user_id,
            HRModel.requested_by_id == current_user.id,
            HRModel.status == HandoverStatus.PENDING,
        ).all()
    else:
        from app.models.handover_request import HandoverRequest as HRModel
        reqs = db.query(HRModel).filter(HRModel.client_id == user_id).all()

    result = []
    for r in reqs:
        requester = db.query(User).filter(User.id == r.requested_by_id).first()
        new_mgr = db.query(User).filter(User.id == r.new_manager_id).first()
        result.append({
            "id": str(r.id),
            "client_id": str(r.client_id),
            "requested_by_id": str(r.requested_by_id),
            "requested_by_name": f"{requester.first_name or ''} {requester.last_name or ''}".strip() or requester.email if requester else "Unknown",
            "new_manager_id": str(r.new_manager_id),
            "new_manager_name": f"{new_mgr.first_name or ''} {new_mgr.last_name or ''}".strip() or new_mgr.email if new_mgr else "Unknown",
            "reason": r.reason,
            "status": r.status,
            "admin_note": r.admin_note,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return result


@router.post("/handover-requests/{request_id}/approve")
def approve_handover_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin approves a pending handover request."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can approve handover requests")

    from app.models.handover_request import HandoverRequest as HRModel, HandoverStatus
    from app.models.client_note import ClientNote
    from app.models.notification import Notification

    req = db.query(HRModel).filter(HRModel.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Handover request not found")
    if req.status != HandoverStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    client = db.query(User).filter(User.id == req.client_id).first()
    old_manager = db.query(User).filter(User.id == client.manager_id).first() if client and client.manager_id else None
    new_manager = db.query(User).filter(User.id == req.new_manager_id).first()
    requester = db.query(User).filter(User.id == req.requested_by_id).first()

    if not client or not new_manager:
        raise HTTPException(status_code=404, detail="Client or new manager no longer exists")

    # Perform reassignment
    client.manager_id = new_manager.id
    req.status = HandoverStatus.APPROVED
    db.commit()

    old_name = f"{old_manager.first_name or ''} {old_manager.last_name or ''}".strip() if old_manager else "Unassigned"
    new_name = f"{new_manager.first_name or ''} {new_manager.last_name or ''}".strip() or new_manager.email
    requester_name = f"{requester.first_name or ''} {requester.last_name or ''}".strip() or requester.email if requester else "Unknown"
    admin_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email

    # Audit note
    note_lines = [
        f"✅ Handover approved by Admin {admin_name}",
        f"Requested by: {requester_name}",
        f"From: {old_name}",
        f"To: {new_name}",
    ]
    if req.reason:
        note_lines.append(f"Reason: {req.reason}")
    db.add(ClientNote(content="\n".join(note_lines), client_id=client.id, author_id=current_user.id, is_internal=True))

    # Notifications
    notify = set()
    notify.add(new_manager.id)
    if old_manager:
        notify.add(old_manager.id)
    if requester:
        notify.add(requester.id)
    notify.discard(current_user.id)

    for uid in notify:
        if uid == requester.id if requester else False:
            msg = f"Your handover request for {client.first_name or client.email} has been approved. Client is now assigned to {new_name}."
        elif uid == new_manager.id:
            msg = f"You have been assigned as manager for {client.first_name or client.email}."
        else:
            msg = f"Client {client.first_name or client.email} has been reassigned to {new_name} (handover approved)."
        db.add(Notification(user_id=uid, type="HANDOVER_APPROVED", message=msg, reference_id=str(client.id)))

    log_activity(
        db=db,
        user_id=current_user.id,
        action="HANDOVER_APPROVED",
        entity_type="HANDOVER_REQUEST",
        entity_id=str(req.id),
        details=f"Approved handover of client {client.first_name or client.email} to {new_name}"
    )

    db.commit()
    return {"status": "approved", "message": f"Handover approved. {client.first_name or client.email} is now managed by {new_name}."}


@router.post("/handover-requests/{request_id}/reject")
def reject_handover_request(
    request_id: UUID,
    admin_note: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin rejects a pending handover request."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can reject handover requests")

    from app.models.handover_request import HandoverRequest as HRModel, HandoverStatus
    from app.models.notification import Notification

    req = db.query(HRModel).filter(HRModel.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Handover request not found")
    if req.status != HandoverStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    req.status = HandoverStatus.REJECTED
    req.admin_note = admin_note
    db.commit()

    client = db.query(User).filter(User.id == req.client_id).first()
    requester = db.query(User).filter(User.id == req.requested_by_id).first()
    new_mgr = db.query(User).filter(User.id == req.new_manager_id).first()
    admin_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
    new_name = f"{new_mgr.first_name or ''} {new_mgr.last_name or ''}".strip() or new_mgr.email if new_mgr else "Unknown"

    if requester:
        msg = f"Your handover request for {client.first_name or client.email} (to {new_name}) was rejected by Admin {admin_name}."
        if admin_note:
            msg += f" Reason: {admin_note}"
        db.add(Notification(user_id=requester.id, type="HANDOVER_REJECTED", message=msg, reference_id=str(client.id)))

    log_activity(
        db=db,
        user_id=current_user.id,
        action="HANDOVER_REJECTED",
        entity_type="HANDOVER_REQUEST",
        entity_id=str(req.id),
        details=f"Rejected handover of client {client.first_name or client.email} to {new_name}"
    )

    db.commit()
    return {"status": "rejected", "message": "Handover request rejected."}


