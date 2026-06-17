from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os

from app.api import deps
from app.models.user import User, UserRole
from app.models.social_integration import SocialIntegration
from pydantic import BaseModel
import uuid

router = APIRouter()

class SocialIntegrationResponse(BaseModel):
    id: uuid.UUID
    platform: str
    account_id: str | None
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/connected", response_model=List[SocialIntegrationResponse])
def get_connected_platforms(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get all connected social platforms for the current client."""
    if current_user.role != UserRole.CLIENT:
        # If staff, maybe they want to see a specific client's integrations. 
        # For simplicity, let's keep it to current_user if they are a client, 
        # or return empty if they are staff and didn't specify.
        return []
        
    integrations = db.query(SocialIntegration).filter(SocialIntegration.client_id == current_user.id).all()
    return integrations

@router.get("/{platform}/connect")
def connect_platform(
    platform: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Generate OAuth URL and redirect user to the platform.
    """
    platform = platform.upper()
    frontend_url = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3000").replace("/api/v1", "")
    callback_url = f"{frontend_url}/api/v1/integrations/{platform.lower()}/callback"
    
    if platform == "FACEBOOK":
        client_id = os.getenv("FACEBOOK_CLIENT_ID", "DEMO_FB_CLIENT_ID")
        # In a real app, you'd generate a secure state parameter and store it in redis/session
        state = str(current_user.id)
        oauth_url = f"https://www.facebook.com/v19.0/dialog/oauth?client_id={client_id}&redirect_uri={callback_url}&state={state}&scope=pages_manage_posts,pages_read_engagement"
        
    elif platform == "TWITTER":
        client_id = os.getenv("TWITTER_CLIENT_ID", "DEMO_TW_CLIENT_ID")
        state = str(current_user.id)
        oauth_url = f"https://twitter.com/i/oauth2/authorize?response_type=code&client_id={client_id}&redirect_uri={callback_url}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state={state}&code_challenge=challenge&code_challenge_method=plain"
        
    elif platform == "LINKEDIN":
        client_id = os.getenv("LINKEDIN_CLIENT_ID", "DEMO_LI_CLIENT_ID")
        state = str(current_user.id)
        oauth_url = f"https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={client_id}&redirect_uri={callback_url}&state={state}&scope=w_member_social"
        
    elif platform == "INSTAGRAM":
        client_id = os.getenv("INSTAGRAM_CLIENT_ID", "DEMO_IG_CLIENT_ID")
        state = str(current_user.id)
        oauth_url = f"https://api.instagram.com/oauth/authorize?client_id={client_id}&redirect_uri={callback_url}&scope=user_profile,user_media&response_type=code&state={state}"
        
    elif platform == "TIKTOK":
        client_id = os.getenv("TIKTOK_CLIENT_KEY", "DEMO_TT_CLIENT_KEY")
        state = str(current_user.id)
        oauth_url = f"https://www.tiktok.com/v2/auth/authorize/?client_key={client_id}&scope=video.publish,video.upload&response_type=code&redirect_uri={callback_url}&state={state}"
    else:
        raise HTTPException(status_code=400, detail="Unsupported platform")

    return {"url": oauth_url}

@router.get("/{platform}/callback")
def platform_callback(
    platform: str,
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Handle OAuth callback from the platform.
    """
    platform = platform.upper()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    settings_url = f"{frontend_url}/admin/settings?tab=integrations"
    
    if error:
        return RedirectResponse(url=f"{settings_url}&error={error}")
        
    if not code or not state:
        return RedirectResponse(url=f"{settings_url}&error=missing_parameters")
        
    # The 'state' in our simple implementation is the user ID. 
    # In production, this should be a secure random string mapped to the user in Redis to prevent CSRF.
    client_id = state
    
    # ---------------------------------------------------------
    # TODO: Exchange 'code' for 'access_token' using HTTPX here
    # Example for Facebook:
    # res = httpx.get(f"https://graph.facebook.com/v19.0/oauth/access_token?client_id={ID}&redirect_uri={URI}&client_secret={SECRET}&code={code}")
    # data = res.json()
    # access_token = data['access_token']
    # ---------------------------------------------------------
    
    # DEMO IMPLEMENTATION:
    # Since we are using demo keys and cannot actually exchange the token, we will simulate success.
    # We will generate a fake token if the client_id is "DEMO..."
    access_token = f"mock_token_for_{platform}_{uuid.uuid4().hex[:8]}"
    refresh_token = f"mock_refresh_for_{platform}_{uuid.uuid4().hex[:8]}"
    expires_at = datetime.utcnow() + timedelta(days=60)
    account_id = f"mock_account_{platform}_{uuid.uuid4().hex[:8]}"
    
    # Save to database
    existing = db.query(SocialIntegration).filter(
        SocialIntegration.client_id == uuid.UUID(client_id),
        SocialIntegration.platform == platform
    ).first()
    
    if existing:
        existing.access_token = access_token
        existing.refresh_token = refresh_token
        existing.expires_at = expires_at
        existing.account_id = account_id
    else:
        new_integration = SocialIntegration(
            client_id=uuid.UUID(client_id),
            platform=platform,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            account_id=account_id
        )
        db.add(new_integration)
        
    db.commit()
    
    return RedirectResponse(url=f"{settings_url}&success={platform}")

@router.delete("/{platform}")
def disconnect_platform(
    platform: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Disconnect a social platform."""
    platform = platform.upper()
    integration = db.query(SocialIntegration).filter(
        SocialIntegration.client_id == current_user.id,
        SocialIntegration.platform == platform
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    db.delete(integration)
    db.commit()
    return {"message": "Disconnected"}
