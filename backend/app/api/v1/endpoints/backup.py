from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import json

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.models import Base

router = APIRouter()

@router.get("/export")
def export_database(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Only Admins can export the database")
    
    data = {}
    for table in Base.metadata.sorted_tables:
        rows = db.execute(table.select()).mappings().all()
        data[table.name] = jsonable_encoder([dict(row) for row in rows])
        
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": 'attachment; filename="landingforge_backup.json"'}
    )

@router.post("/import")
async def import_database(
    file: UploadFile = File(...),
    preserve_login: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Only Admins can import the database")
        
    try:
        content = await file.read()
        data = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    if preserve_login and 'users' in data:
        for u in data['users']:
            if u.get('role') == 'ADMIN':
                u['email'] = current_user.email
                u['hashed_password'] = current_user.hashed_password

    try:
        # Try to disable foreign key checks temporarily (for SQLite)
        try:
            db.execute(text("PRAGMA foreign_keys=OFF"))
        except:
            pass
            
        # Delete existing data in reverse dependency order
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
            
        # Insert new data in forward dependency order
        for table in Base.metadata.sorted_tables:
            if table.name in data and data[table.name]:
                db.execute(table.insert(), data[table.name])
                
        # Re-enable foreign key checks
        try:
            db.execute(text("PRAGMA foreign_keys=ON"))
        except:
            pass
            
        db.commit()
        return {"message": "Database restored successfully"}
    except Exception as e:
        db.rollback()
        try:
            db.execute(text("PRAGMA foreign_keys=ON"))
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to restore database: {str(e)}")
