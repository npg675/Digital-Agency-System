import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

# You should set these in your .env or settings
# For development, you can use placeholder values, but they need to be valid for actual sync
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "YOUR_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "YOUR_CLIENT_SECRET")
# The redirect URI should match the one authorized in Google Cloud Console
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/calendar/callback")

SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_google_flow():
    # In production, use client_secrets.json or pass client_config dict
    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    return Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

@router.get("/auth-url")
def get_auth_url(current_user: User = Depends(get_current_active_user)):
    flow = get_google_flow()
    auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline', state=str(current_user.id))
    return {"auth_url": auth_url}

@router.get("/callback")
def calendar_callback(
    code: str,
    db: Session = Depends(get_db),
    # In a real scenario, you'd want to maintain state to know WHICH user is authenticating.
    # Since this is a simple implementation, we assume the user is logged in and sending a token.
    # However, OAuth callbacks from Google don't include auth headers. 
    # A standard way is to pass user_id in the 'state' parameter.
    state: str = Query(None)
):
    if not state:
        raise HTTPException(status_code=400, detail="State parameter missing (user_id expected)")
    
    user = db.query(User).filter(User.id == state).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        flow = get_google_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        user.google_access_token = credentials.token
        user.google_refresh_token = credentials.refresh_token
        # user.google_token_expiry = credentials.expiry # if needed
        db.commit()
        
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}/admin/calendar?sync=success")
    except Exception as e:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}/admin/calendar?sync=error&msg={str(e)}")

# Example sync function that can be used later or in a background job
def sync_appointments_to_google(user: User, appointment_title: str, start_time, end_time):
    if not user.google_refresh_token:
        return None
        
    creds = Credentials(
        token=user.google_access_token,
        refresh_token=user.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
    )
    
    service = build('calendar', 'v3', credentials=creds)
    event = {
        'summary': appointment_title,
        'start': {
            'dateTime': start_time.isoformat() + 'Z',
        },
        'end': {
            'dateTime': end_time.isoformat() + 'Z',
        },
    }
    
    try:
        created_event = service.events().insert(calendarId='primary', body=event).execute()
        return created_event.get('id')
    except Exception as e:
        print(f"Error syncing to Google Calendar: {e}")
        return None
