from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import os
from app.database import get_db
from app.models.user import User, UserRole
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/browse-directories")
def browse_directories(
    root: str = Query("backend", description="'backend' or 'frontend'"),
    path: str = Query(".", description="Relative path to browse"),
    current_user: User = Depends(get_current_user)
):
    """
    Browse server-side directories to pick upload/export paths.
    root='backend'  → scans relative to FastAPI working dir
    root='frontend' → scans relative to ../frontend/
    """
    if current_user.role != UserRole.ADMIN and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admins only")

    cwd = os.getcwd()  # backend working dir
    if root == "frontend":
        base = os.path.realpath(os.path.join(cwd, "..", "frontend"))
    else:
        base = os.path.realpath(cwd)

    # Security: resolve and ensure no traversal outside base
    target = os.path.realpath(os.path.join(base, path))
    if not target.startswith(base):
        raise HTTPException(status_code=400, detail="Path traversal not allowed")

    SKIP_DIRS = {"__pycache__", "node_modules", ".git", "venv", ".next", ".venv", "dist", "build"}

    try:
        entries = []
        for entry in os.scandir(target):
            if entry.is_dir() and not entry.name.startswith(".") and entry.name not in SKIP_DIRS:
                rel = os.path.relpath(entry.path, base).replace("\\", "/")
                entries.append({"name": entry.name, "path": rel})
        entries.sort(key=lambda x: x["name"])

        current_rel = os.path.relpath(target, base).replace("\\", "/")
        parent_path = os.path.dirname(current_rel) if current_rel != "." else None

        return {
            "root": root,
            "current": current_rel,
            "parent": parent_path if parent_path and parent_path != current_rel else None,
            "entries": entries,
        }
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied reading this directory")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




class VideoStorageSettings(BaseModel):
    video_storage_provider: Optional[str] = "local"   # 'local', 'gdrive', 'dual'
    video_upload_local_path: Optional[str] = "public/uploads"
    video_export_path: Optional[str] = "uploads/videos"
    google_drive_folder_id: Optional[str] = None
    google_drive_credentials: Optional[str] = None   # JSON string


@router.get("/video-storage")
def get_video_storage_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the admin's video upload storage settings."""
    if current_user.role != UserRole.ADMIN and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only admins can view storage settings")

    return {
        "video_storage_provider": current_user.video_storage_provider or "local",
        "video_upload_local_path": current_user.video_upload_local_path or "public/uploads",
        "video_export_path": current_user.video_export_path or "uploads/videos",
        "google_drive_folder_id": current_user.google_drive_folder_id,
        # Never expose credentials — just indicate if they are set
        "google_drive_credentials_set": bool(current_user.google_drive_credentials),
    }


@router.patch("/video-storage")
def update_video_storage_settings(
    settings: VideoStorageSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the admin's video upload storage settings."""
    if current_user.role != UserRole.ADMIN and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only admins can update storage settings")

    if settings.video_storage_provider is not None:
        current_user.video_storage_provider = settings.video_storage_provider

    if settings.video_upload_local_path is not None:
        path = settings.video_upload_local_path.replace("\\", "/").strip("/")
        if ".." in path:
            raise HTTPException(status_code=400, detail="Path must not contain '..'")
        current_user.video_upload_local_path = path

    if settings.video_export_path is not None:
        exp_path = settings.video_export_path.replace("\\", "/").strip("/")
        if ".." in exp_path:
            raise HTTPException(status_code=400, detail="Path must not contain '..'")
        current_user.video_export_path = exp_path

    if settings.google_drive_folder_id is not None:
        current_user.google_drive_folder_id = settings.google_drive_folder_id

    if settings.google_drive_credentials is not None:
        current_user.google_drive_credentials = settings.google_drive_credentials

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Video storage settings updated successfully",
        "video_storage_provider": current_user.video_storage_provider,
        "video_upload_local_path": current_user.video_upload_local_path,
        "video_export_path": current_user.video_export_path,
        "google_drive_folder_id": current_user.google_drive_folder_id,
        "google_drive_credentials_set": bool(current_user.google_drive_credentials),
    }
