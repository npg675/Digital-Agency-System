from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.marketing_asset import MarketingSequence, MarketingAsset
from app.schemas.marketing_asset import MarketingSequenceResponse, MarketingAssetResponse, MarketingAssetBase

router = APIRouter()

@router.get("/", response_model=List[MarketingAssetResponse])
@router.get("", response_model=List[MarketingAssetResponse])
def get_all_marketing_assets(db: Session = Depends(get_db)):
    """
    Retrieve all marketing assets (history).
    """
    return db.query(MarketingAsset).order_by(MarketingAsset.created_at.desc()).all()

@router.post("/", response_model=MarketingAssetResponse)
@router.post("", response_model=MarketingAssetResponse)
def create_marketing_asset(asset_in: MarketingAssetBase, db: Session = Depends(get_db)):
    """
    Create a new marketing asset manually.
    """
    new_asset = MarketingAsset(
        asset_type=asset_in.asset_type,
        industry_category=asset_in.industry_category,
        title=asset_in.title,
        content=asset_in.content,
        file_url=asset_in.file_url
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset

from app.schemas.marketing_asset import MarketingAssetUpdate

@router.patch("/{asset_id}", response_model=MarketingAssetResponse)
def update_marketing_asset(asset_id: str, asset_in: MarketingAssetUpdate, db: Session = Depends(get_db)):
    """
    Update an existing marketing asset.
    """
    asset = db.query(MarketingAsset).filter(MarketingAsset.id == asset_id).first()
    if not asset:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset_in.title is not None:
        asset.title = asset_in.title
    if asset_in.content is not None:
        asset.content = asset_in.content
        
    db.commit()
    db.refresh(asset)
    return asset

@router.delete("/{asset_id}")
def delete_marketing_asset(asset_id: str, db: Session = Depends(get_db)):
    """
    Delete a marketing asset.
    """
    asset = db.query(MarketingAsset).filter(MarketingAsset.id == asset_id).first()
    if not asset:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Asset not found")
        
    db.delete(asset)
    db.commit()
    return {"message": "Asset deleted successfully"}


@router.get("/sequences", response_model=List[MarketingSequenceResponse])
def get_marketing_sequences(db: Session = Depends(get_db)):
    """
    Retrieve all automated marketing email/SMS drip sequences.
    """
    # The 'steps' relationship will be eagerly loaded or lazily loaded depending on config.
    # We'll just fetch all.
    return db.query(MarketingSequence).order_by(MarketingSequence.created_at.desc()).all()


@router.get("/ads", response_model=List[MarketingAssetResponse])
def get_marketing_ads(db: Session = Depends(get_db)):
    """
    Retrieve all standalone marketing assets (Ad copy, Lead Magnets, etc).
    """
    return db.query(MarketingAsset).order_by(MarketingAsset.created_at.desc()).all()


@router.get("/videos", response_model=List[MarketingAssetResponse])
def get_video_assets(
    status: str = None,
    provider: str = None,
    approval_status: str = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve all marketing assets that have a video attached (any status).
    Optionally filter by status (COMPLETED, PROCESSING, FAILED), provider, or approval_status.
    """
    query = db.query(MarketingAsset).filter(MarketingAsset.video_status != None)
    if status:
        query = query.filter(MarketingAsset.video_status == status.upper())
    if provider:
        query = query.filter(MarketingAsset.video_provider == provider.lower())
    if approval_status:
        query = query.filter(MarketingAsset.approval_status == approval_status.lower())
    return query.order_by(MarketingAsset.created_at.desc()).all()


from fastapi import HTTPException
from app.api.deps import get_current_user
from app.models.user import User
from app.api.v1.endpoints.ai import generate_ai_text
from app.schemas.marketing_asset import GenerateAdRequest
from app.models.marketing_asset import MarketingAssetType

@router.post("/generate-ad", response_model=MarketingAssetResponse)
def generate_marketing_ad(
    request: GenerateAdRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a new marketing ad copy using AI and save it.
    """
    if current_user.role != "ADMIN" and not current_user.client_can_generate_ads:
        raise HTTPException(status_code=403, detail="You do not have permission to generate AI ads.")

    admin = db.query(User).filter(User.role == "ADMIN").first()
    brand_voice = getattr(admin, "brand_voice_profile", None) if admin else None
    
    extra_instructions = ""
    if brand_voice:
        extra_instructions += f"\nCRITICAL BRAND VOICE INSTRUCTION: You MUST adhere to the following brand voice guidelines strictly: '{brand_voice}'. "
    if request.content_style:
        extra_instructions += f"\nContent Style/Vibe: {request.content_style}. "
    if request.target_pain_points:
        extra_instructions += f"\nFocus heavily on these customer pain points: {request.target_pain_points}. "
    if request.video_length:
        extra_instructions += f"\nThe video script should be approximately {request.video_length} in length. "

    if "Script" in request.platform or request.platform in ["TikTok", "YouTube Shorts", "Instagram Reels"]:
        prompt = (
            f"You are a world-class direct response copywriter and video marketer. "
            f"Write a highly converting video script for the {request.industry_category} industry. "
            f"The platform is {request.platform}. "
            f"The topic/offer is: {request.topic}. {extra_instructions}\n"
            f"Format the output strictly as a Video Script with the following sections:\n"
            f"[HOOK] - The first 3 seconds to grab attention\n"
            f"[VISUAL/B-ROLL] - Suggested visuals or actions\n"
            f"[BODY/VOICEOVER] - The main spoken script\n"
            f"[CTA] - A clear call to action at the end\n"
            f"Do not include any other conversational text."
        )
    else:
        prompt = (
            f"You are a world-class direct response copywriter. "
            f"Write a highly converting ad for the {request.industry_category} industry. "
            f"The platform is {request.platform}. "
            f"The topic/offer is: {request.topic}. {extra_instructions}\n"
            f"Write ONLY the ad copy. Make it punchy, engaging, and include a clear call to action."
        )

    # Use the unified AI generator
    try:
        generated_copy = generate_ai_text(current_user, prompt, max_tokens=600)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Generation failed: {str(e)}")

    title = f"{request.platform} Ad - {request.topic}"
    if len(title) > 60:
        title = title[:57] + "..."

    new_ad = MarketingAsset(
        asset_type=MarketingAssetType.AD_COPY,
        industry_category=request.industry_category,
        title=title,
        content=generated_copy
    )
    
    db.add(new_ad)
    db.commit()
    db.refresh(new_ad)

    return new_ad


from fastapi import BackgroundTasks
import asyncio
import uuid

def mock_video_generation(asset_id: str, db: Session):
    # Simulate API call latency
    pass

@router.post("/{asset_id}/generate-video")
def start_video_generation(
    asset_id: str,
    background_tasks: BackgroundTasks,
    provider: str = "heygen",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset = db.query(MarketingAsset).filter(MarketingAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Mocking the initialization of a 3rd party video generation job
    asset.video_status = "PROCESSING"
    asset.video_provider = provider
    asset.video_job_id = str(uuid.uuid4())
    db.commit()

    # Define the background task
    def process_video_job(asset_id_str: str, job_id: str, provider: str, user_id: str):
        import time
        import requests
        
        # We need a new DB session for the background thread
        from app.database import SessionLocal
        from app.models.user import User
        
        bg_db = SessionLocal()
        try:
            bg_asset = bg_db.query(MarketingAsset).filter(MarketingAsset.id == asset_id_str).first()
            user = bg_db.query(User).filter(User.id == user_id).first()
            
            if not bg_asset or not user:
                return

            # Check if API key exists
            api_key = None
            if provider == "heygen":
                api_key = user.heygen_api_key
            elif provider == "runway":
                api_key = user.runway_api_key
            elif provider == "synthesia":
                api_key = user.synthesia_api_key
            elif provider in ("google", "google_flow"):
                api_key = user.google_video_api_key
                
            if not api_key:
                bg_asset.video_status = "FAILED"
                bg_asset.video_url = "Missing API Key for " + provider
                bg_db.commit()
                return

            if provider == "heygen":
                # 1. Start generation
                headers = {
                    "X-Api-Key": api_key,
                    "Content-Type": "application/json"
                }
                
                # Use a default avatar and voice
                payload = {
                    "video_inputs": [
                        {
                            "character": {
                                "type": "avatar",
                                "avatar_id": "Angela-inTshirt-20220820",
                                "avatar_style": "normal"
                            },
                            "voice": {
                                "type": "text",
                                "input_text": bg_asset.content[:2000] if bg_asset.content else "Hello world!",
                                "voice_id": "1bd001e7e50f421d891986aad5158bc8"
                            }
                        }
                    ],
                    "dimension": { "width": 1280, "height": 720 }
                }
                
                res = requests.post("https://api.heygen.com/v2/video/generate", json=payload, headers=headers)
                if res.status_code != 200:
                    bg_asset.video_status = "FAILED"
                    bg_asset.video_url = f"HeyGen Error: {res.text}"
                    bg_db.commit()
                    return
                
                data = res.json()
                if data.get("error"):
                    bg_asset.video_status = "FAILED"
                    bg_asset.video_url = f"HeyGen Error: {data['error']}"
                    bg_db.commit()
                    return
                    
                video_id = data["data"]["video_id"]
                bg_asset.video_job_id = video_id
                bg_db.commit()
                
                # 2. Poll for completion
                max_retries = 60 # 10 minutes (10s intervals)
                for _ in range(max_retries):
                    time.sleep(10)
                    status_res = requests.get(f"https://api.heygen.com/v1/video_status.get?video_id={video_id}", headers=headers)
                    if status_res.status_code == 200:
                        status_data = status_res.json()
                        state = status_data.get("data", {}).get("status")
                        if state == "completed":
                            bg_asset.video_status = "COMPLETED"
                            bg_asset.video_url = status_data["data"]["video_url"]
                            bg_db.commit()
                            return
                        elif state == "failed":
                            bg_asset.video_status = "FAILED"
                            bg_asset.video_url = "HeyGen rendering failed internally."
                            bg_db.commit()
                            return
                            
                bg_asset.video_status = "FAILED"
                bg_asset.video_url = "Timeout waiting for HeyGen."
                bg_db.commit()
                
            elif provider == "synthesia":
                headers = {
                    "Authorization": api_key,
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "test": False,
                    "title": f"Ad: {bg_asset.title}",
                    "visibility": "private",
                    "input": [
                        {
                            "scriptText": bg_asset.content[:2000] if bg_asset.content else "Hello!",
                            "avatar": "anna_costume1_cameraA",
                            "background": "off_white"
                        }
                    ]
                }
                
                res = requests.post("https://api.synthesia.io/v2/videos", json=payload, headers=headers)
                if res.status_code != 201:
                    bg_asset.video_status = "FAILED"
                    bg_asset.video_url = f"Synthesia Error: {res.text}"
                    bg_db.commit()
                    return
                
                data = res.json()
                video_id = data.get("id")
                bg_asset.video_job_id = video_id
                bg_db.commit()
                
                # Poll
                for _ in range(60):
                    time.sleep(10)
                    status_res = requests.get(f"https://api.synthesia.io/v2/videos/{video_id}", headers=headers)
                    if status_res.status_code == 200:
                        status_data = status_res.json()
                        state = status_data.get("status")
                        if state == "COMPLETE":
                            bg_asset.video_status = "COMPLETED"
                            bg_asset.video_url = status_data.get("download")
                            bg_db.commit()
                            return
                        elif state == "FAILED":
                            bg_asset.video_status = "FAILED"
                            bg_asset.video_url = "Synthesia rendering failed."
                            bg_db.commit()
                            return
                            
                bg_asset.video_status = "FAILED"
                bg_asset.video_url = "Timeout waiting for Synthesia."
                bg_db.commit()

            elif provider == "runway":
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "X-Runway-Version": "2024-09-13",
                    "Content-Type": "application/json"
                }
                
                # We will use the runway text-to-video API logic (taking a snippet of the script as prompt)
                prompt_text = bg_asset.content[:250] if bg_asset.content else "A cinematic marketing video."
                
                payload = {
                    "promptText": prompt_text,
                    "model": "gen3a_turbo"
                }
                
                res = requests.post("https://api.dev.runwayml.com/v1/image_to_video", json=payload, headers=headers)
                if res.status_code not in [200, 201]:
                    # If this fails, it might require image_to_video strictly, we'll gracefully report it
                    bg_asset.video_status = "FAILED"
                    bg_asset.video_url = f"Runway Error: {res.text}"
                    bg_db.commit()
                    return
                
                data = res.json()
                task_id = data.get("id")
                bg_asset.video_job_id = task_id
                bg_db.commit()
                
                # Poll Task
                for _ in range(60):
                    time.sleep(10)
                    status_res = requests.get(f"https://api.dev.runwayml.com/v1/tasks/{task_id}", headers=headers)
                    if status_res.status_code == 200:
                        status_data = status_res.json()
                        state = status_data.get("status")
                        if state == "SUCCEEDED":
                            bg_asset.video_status = "COMPLETED"
                            bg_asset.video_url = status_data.get("output", [""])[0]
                            bg_db.commit()
                            return
                        elif state == "FAILED":
                            bg_asset.video_status = "FAILED"
                            bg_asset.video_url = "Runway rendering failed."
                            bg_db.commit()
                            return
                            
                bg_asset.video_status = "FAILED"
                bg_asset.video_url = "Timeout waiting for Runway."
                bg_db.commit()

            elif provider in ("google", "google_flow"):
                api_key = user.google_video_api_key
                if not api_key:
                    bg_asset.video_status = "FAILED"
                    bg_asset.video_url = "Missing Google AI Studio API Key"
                    bg_db.commit()
                    return

                try:
                    from google import genai
                    from google.genai import types
                    import os

                    client = genai.Client(api_key=api_key)
                    
                    prompt_text = bg_asset.content[:400] if bg_asset.content else "A cinematic marketing advertisement."
                    model_name = "veo-2.0-generate-001"
                    
                    operation = client.models.generate_videos(
                        model=model_name,
                        prompt=prompt_text,
                        config=types.GenerateVideosConfig(
                            aspect_ratio="16:9",
                            person_generation="ALLOW_ADULT"
                        )
                    )
                    
                    bg_asset.video_job_id = operation.name
                    bg_db.commit()
                    
                    # Poll for completion (Google operations can take a few minutes)
                    for _ in range(120): # up to 10 minutes (5s intervals)
                        time.sleep(5)
                        operation = client.operations.get(operation=operation)
                        if operation.done:
                            break
                            
                    if operation.error:
                        bg_asset.video_status = "FAILED"
                        bg_asset.video_url = f"Google Flow/Veo Error: {operation.error.message}"
                        bg_db.commit()
                        return
                        
                    if not operation.response or not hasattr(operation.response, "generated_videos") or not operation.response.generated_videos:
                        bg_asset.video_status = "FAILED"
                        bg_asset.video_url = "Google Veo failed: No video returned."
                        bg_db.commit()
                        return
                        
                    generated_video = operation.response.generated_videos[0]
                    
                    # We download the video bytes using the SDK
                    try:
                        # To actually download the file bytes, we can use the requests library with the uri and API key
                        import requests
                        file_res = requests.get(generated_video.video.uri, headers={"x-goog-api-key": api_key})
                        if file_res.status_code == 200:
                            video_bytes = file_res.content
                        else:
                            print(f"Failed to download video bytes, status: {file_res.status_code}")
                            video_bytes = None
                    except Exception as e:
                        print("Error downloading video bytes, saving URI fallback.", e)
                        video_bytes = None
                        
                    if video_bytes:
                        os.makedirs("uploads/videos", exist_ok=True)
                        filename = f"{uuid.uuid4()}.mp4"
                        filepath = os.path.join("uploads/videos", filename)
                        with open(filepath, "wb") as f:
                            f.write(video_bytes)
                        
                        public_url = f"{os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:8000/api/v1').replace('/api/v1', '')}/uploads/videos/{filename}"
                    else:
                        public_url = generated_video.video.uri
                    
                    bg_asset.video_status = "COMPLETED"
                    bg_asset.video_url = public_url
                    bg_db.commit()
                    
                except Exception as e:
                    bg_asset.video_status = "FAILED"
                    bg_asset.video_url = f"Google Flow/Veo Error: {str(e)}"
                    bg_db.commit()
                return

                
        except Exception as e:
            try:
                bg_asset.video_status = "FAILED"
                bg_asset.video_url = f"Exception: {str(e)}"
                bg_db.commit()
            except:
                pass
        finally:
            bg_db.close()

    background_tasks.add_task(process_video_job, str(asset.id), asset.video_job_id, provider, str(current_user.id))

    return {"message": "Video generation started", "job_id": asset.video_job_id, "status": "PROCESSING"}


@router.get("/{asset_id}/video-status")
def get_video_status(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset = db.query(MarketingAsset).filter(MarketingAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    return {
        "video_status": asset.video_status,
        "video_url": asset.video_url,
        "video_job_id": asset.video_job_id,
        "video_provider": asset.video_provider
    }

from app.schemas.marketing_asset import AssetApprovalUpdate

@router.patch("/{asset_id}/approval", response_model=MarketingAssetResponse)
def update_asset_approval(
    asset_id: str,
    update_data: AssetApprovalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the approval status of a video asset.
    """
    asset = db.query(MarketingAsset).filter(MarketingAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.approval_status = update_data.approval_status.lower()
    if update_data.approval_note is not None:
        asset.approval_note = update_data.approval_note
        
    db.commit()
    db.refresh(asset)
    return asset
