from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import asyncio

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.campaign import Campaign
from app.models.marketing_asset import MarketingAsset, MarketingAssetType, MarketingSequence, MarketingSequenceStep, StepType
from app.models.social_post import SocialPost
from app.api.v1.endpoints.ai import generate_ai_text
from app.api.v1.endpoints.marketing_assets import mock_video_generation

router = APIRouter()

class BundleRequest(BaseModel):
    campaign_name: str
    industry: str
    topic: str
    tone: str
    target_audience: Optional[str] = None
    video_provider: str = "heygen"
    target_language: str = "English"

class BundleResponse(BaseModel):
    campaign_id: str
    video_asset_id: str
    blog_asset_id: str
    sequence_id: str
    social_post_count: int

async def generate_video_script(admin: User, req: BundleRequest) -> str:
    brand_voice = getattr(admin, "brand_voice_profile", "")
    prompt = f"""You are an expert video marketer. Write a highly converting video script for the {req.industry} industry.
Topic/Offer: {req.topic}
Tone: {req.tone}
Target Audience: {req.target_audience or "General"}
Brand Voice Guidelines: {brand_voice}
Target Language: {req.target_language}

IMPORTANT: The output MUST be written natively in {req.target_language}.

Format the output strictly as a Video Script with sections:
[HOOK]
[VISUAL/B-ROLL]
[BODY/VOICEOVER]
[CTA]
"""
    # use generate_ai_text (it's synchronous, so we run it in executor if we want true async, but since fastapi handles threadpools for sync endpoints... wait, generate_ai_text is sync and could block the async event loop if we use it inside an async function directly.
    # To run it properly:
    return generate_ai_text(admin, prompt, max_tokens=600)

def _generate_blog_post(admin: User, req: BundleRequest, script: str) -> str:
    brand_voice = getattr(admin, "brand_voice_profile", "")
    prompt = f"""You are an expert SEO copywriter. Write a highly engaging blog post based on this video script.
Industry: {req.industry}
Tone: {req.tone}
Brand Voice: {brand_voice}
Target Language: {req.target_language}

Video Script:
{script}

IMPORTANT: The blog post MUST be written natively in {req.target_language}.
Output the blog post formatted in Markdown with proper headings (H1, H2) and a strong CTA at the end.
"""
    return generate_ai_text(admin, prompt, max_tokens=1200)

def _generate_email_sequence(admin: User, req: BundleRequest, script: str) -> List[dict]:
    brand_voice = getattr(admin, "brand_voice_profile", "")
    prompt = f"""You are an expert email marketer. Write a 3-part email drip sequence based on this video script.
Industry: {req.industry}
Tone: {req.tone}
Brand Voice: {brand_voice}
Target Language: {req.target_language}

Video Script:
{script}

IMPORTANT: The emails MUST be written natively in {req.target_language}.

Format your output exactly as follows for 3 emails, separating them by "|||":
Subject: [Subject Line 1]
Body:
[Email 1 Body]
|||
Subject: [Subject Line 2]
Body:
[Email 2 Body]
|||
Subject: [Subject Line 3]
Body:
[Email 3 Body]
"""
    response = generate_ai_text(admin, prompt, max_tokens=1200)
    parts = response.split("|||")
    emails = []
    for part in parts:
        part = part.strip()
        if not part: continue
        lines = part.split("\n", 1)
        if len(lines) == 2:
            subject = lines[0].replace("Subject:", "").strip()
            body = lines[1].replace("Body:", "").strip()
            emails.append({"subject": subject, "body": body})
    return emails

def _generate_social_posts(admin: User, req: BundleRequest, script: str) -> List[str]:
    brand_voice = getattr(admin, "brand_voice_profile", "")
    prompt = f"""You are an expert social media manager. Write 5 different social media captions based on this video script.
Industry: {req.industry}
Tone: {req.tone}
Brand Voice: {brand_voice}
Target Language: {req.target_language}

Video Script:
{script}

IMPORTANT: The social media captions MUST be written natively in {req.target_language}.

Vary the platforms implicitly (e.g. one for LinkedIn, one short one for Twitter, one for Instagram). Include emojis and hashtags.
Separate each post strictly by "|||".
"""
    response = generate_ai_text(admin, prompt, max_tokens=1000)
    posts = [p.strip() for p in response.split("|||") if p.strip()]
    return posts[:5]

@router.post("/", response_model=BundleResponse)
async def bundle_campaign(
    request: BundleRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "ADMIN" and not getattr(current_user, "client_can_generate_ads", False):
        raise HTTPException(status_code=403, detail="Permission denied")

    admin = db.query(User).filter(User.role == "ADMIN").first()

    # Create Campaign
    campaign = Campaign(
        name=request.campaign_name,
        description=f"Generated via Magic Bundle for {request.topic}",
        client_id=current_user.id if current_user.role == "CLIENT" else None
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # 1. Generate Script
    loop = asyncio.get_running_loop()
    script = await loop.run_in_executor(None, generate_ai_text, admin, f"Write a video script for {request.industry} about {request.topic} with tone {request.tone}. Brand Voice: {getattr(admin, 'brand_voice_profile', '')}. Target Language: {request.target_language}. MUST BE NATIVELY WRITTEN IN {request.target_language}. Format: [HOOK], [VISUAL/B-ROLL], [BODY/VOICEOVER], [CTA]", 600)
    
    # Run the other generations concurrently based on the script
    results = await asyncio.gather(
        loop.run_in_executor(None, _generate_blog_post, admin, request, script),
        loop.run_in_executor(None, _generate_email_sequence, admin, request, script),
        loop.run_in_executor(None, _generate_social_posts, admin, request, script)
    )
    blog_content = results[0]
    emails = results[1]
    social_captions = results[2]

    # Save Video Asset
    video_asset = MarketingAsset(
        asset_type=MarketingAssetType.AD_COPY,
        industry_category=request.industry,
        title=f"Video Script - {request.campaign_name}",
        content=script,
        video_provider=request.video_provider,
        video_status="PROCESSING"
    )
    db.add(video_asset)
    
    # Save Blog Asset
    blog_asset = MarketingAsset(
        asset_type=MarketingAssetType.LANDING_PAGE_COPY, # Closest fit for blog
        industry_category=request.industry,
        title=f"SEO Blog - {request.campaign_name}",
        content=blog_content
    )
    db.add(blog_asset)

    # Save Email Sequence
    sequence = MarketingSequence(
        name=f"Email Drip - {request.campaign_name}",
        industry_category=request.industry,
        objective="Lead Nurturing"
    )
    db.add(sequence)
    db.commit() # Commit to get sequence ID

    for idx, em in enumerate(emails):
        step = MarketingSequenceStep(
            sequence_id=sequence.id,
            day_offset=idx * 2,
            step_type=StepType.EMAIL,
            subject_line=em["subject"],
            body_content=em["body"]
        )
        db.add(step)

    # Save Social Posts
    for cap in social_captions:
        post = SocialPost(
            content=cap,
            status="DRAFT",
            platform="linkedin", # default, user can change later
            user_id=current_user.id
        )
        db.add(post)

    db.commit()
    db.refresh(video_asset)
    db.refresh(blog_asset)

    # Start the video generation
    background_tasks.add_task(mock_video_generation, str(video_asset.id), db)

    return BundleResponse(
        campaign_id=str(campaign.id),
        video_asset_id=str(video_asset.id),
        blog_asset_id=str(blog_asset.id),
        sequence_id=str(sequence.id),
        social_post_count=len(social_captions)
    )
