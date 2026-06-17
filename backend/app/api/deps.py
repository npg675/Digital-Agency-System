from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.token import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    import uuid
    if not token_data.sub:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    user = db.query(User).filter(User.id == uuid.UUID(token_data.sub)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found or deleted")
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    # If we had an is_active flag, we'd check it here
    return current_user

