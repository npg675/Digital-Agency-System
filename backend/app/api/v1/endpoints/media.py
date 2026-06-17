import os
import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.api import deps
from app.models.media import MediaAsset
from app.models.user import User, UserRole
from app.schemas.media import MediaAsset as MediaAssetSchema
from sqlalchemy import func
from app.services.storage import get_storage_service

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=MediaAssetSchema)
async def upload_file(
    file: UploadFile = File(...),
    client_id: Optional[uuid.UUID] = Form(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload a media asset.
    """
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    # We cannot measure file size before uploading to cloud via streams easily without reading it all.
    # Instead we read it into memory or temp, check size, then upload.
    # Or rely on standard read (fine for reasonable sizes, maybe not 1GB videos)
    file_content = await file.read()
    size = len(file_content)
    
    # Check limits BEFORE upload
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin:
        if size > admin.media_vault_file_size_limit_mb * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size of {admin.media_vault_file_size_limit_mb} MB.")
            
        if client_id:
            total_size_query = db.query(func.sum(MediaAsset.size)).filter(MediaAsset.client_id == client_id).scalar() or 0
            if total_size_query + size > admin.media_vault_total_size_limit_mb * 1024 * 1024:
                raise HTTPException(status_code=400, detail=f"Upload would exceed the client's media vault quota of {admin.media_vault_total_size_limit_mb} MB.")

    # Reset file pointer for the upload service
    await file.seek(0)
    
    storage_service = get_storage_service()
    try:
        final_file_path = storage_service.upload(file, unique_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to storage provider: {str(e)}")



    media = MediaAsset(
        filename=file.filename,
        filepath=final_file_path,
        mimetype=file.content_type,
        size=size,
        client_id=client_id,
        uploader_id=current_user.id,
        notes=notes
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    
    return media

@router.get("/", response_model=List[MediaAssetSchema])
def read_media(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve media assets.
    """
    assets = db.query(MediaAsset).offset(skip).limit(limit).all()
    return assets

@router.get("/client/{client_id}", response_model=List[MediaAssetSchema])
def read_client_media(
    client_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve media assets for a specific client.
    """
    assets = db.query(MediaAsset).filter(MediaAsset.client_id == client_id).order_by(MediaAsset.created_at.desc()).all()
    return assets

@router.delete("/{id}")
def delete_media(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete media asset.
    """
    media = db.query(MediaAsset).filter(MediaAsset.id == id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
        
    from app.models.user import UserRole
    if current_user.role == UserRole.CLIENT and media.uploader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    storage_service = get_storage_service()
    storage_service.delete(media.filepath)
        
    db.delete(media)
    db.commit()
    return {"message": "Media deleted"}
