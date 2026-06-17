from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
import uuid

from app.api import deps
from app.models.user import User, UserRole
from app.models.social_post import SocialPost as SocialPostModel
from app.schemas.social_post import SocialPost, SocialPostCreate, SocialPostUpdate, AIAssistRequest
import openai

router = APIRouter()

@router.get("/", response_model=List[SocialPost])
def read_social_posts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
    client_id: str = None,
) -> Any:
    """Retrieve social posts."""
    query = db.query(SocialPostModel)
    
    if current_user.role == UserRole.CLIENT:
        query = query.filter(SocialPostModel.client_id == current_user.id)
    elif current_user.role == UserRole.STAFF:
        managed_clients = db.query(User.id).filter(User.manager_id == current_user.id).all()
        managed_client_ids = [c[0] for c in managed_clients]
        query = query.filter(SocialPostModel.client_id.in_(managed_client_ids))
        
    if client_id and current_user.role != UserRole.CLIENT:
        query = query.filter(SocialPostModel.client_id == uuid.UUID(client_id))
        
    posts = query.order_by(desc(SocialPostModel.scheduled_for)).offset(skip).limit(limit).all()
    return posts

@router.post("/", response_model=SocialPost)
def create_social_post(
    *,
    db: Session = Depends(deps.get_db),
    post_in: SocialPostCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create a new social post schedule."""
    if current_user.role == UserRole.CLIENT:
        # Verify they are creating for themselves
        if post_in.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to post for other clients")
    elif current_user.role == UserRole.STAFF:
        # Verify they manage this client
        client = db.query(User).filter(User.id == post_in.client_id).first()
        if not client or client.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to post for this client")

    post = SocialPostModel(**post_in.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.post("/ai-assist")
def ai_assist_caption(
    request: AIAssistRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """Use AI to rewrite, expand, or add hashtags to a social media caption."""
    # Find the appropriate API key
    api_key = None
    if current_user.openai_key:
        api_key = current_user.openai_key
    else:
        # Fallback to Admin's key if client didn't set one
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if admin and admin.openai_key:
            api_key = admin.openai_key
            
    if not api_key:
        raise HTTPException(status_code=400, detail="OpenAI API key not configured in Brand Vault.")
        
    client = openai.OpenAI(api_key=api_key)
    
    system_prompt = "You are an expert social media manager. Your goal is to optimize captions for social media platforms."
    
    if request.action == "rewrite":
        prompt = f"Rewrite the following social media caption to be more engaging and natural:\n\n{request.content}"
    elif request.action == "hashtags":
        prompt = f"Add 5-8 highly relevant, trending hashtags to the end of this caption:\n\n{request.content}"
    elif request.action == "professional":
        prompt = f"Rewrite this caption to have a very professional, B2B-focused tone:\n\n{request.content}"
    elif request.action == "engaging":
        prompt = f"Rewrite this caption to be highly engaging, enthusiastic, and include a clear call-to-action:\n\n{request.content}"
    else:
        prompt = f"Improve this caption:\n\n{request.content}"
        
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        new_content = response.choices[0].message.content.strip()
        # Remove quotes if AI wraps it in quotes
        if new_content.startswith('"') and new_content.endswith('"'):
            new_content = new_content[1:-1]
            
        return {"content": new_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{id}", response_model=SocialPost)
def update_social_post(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    post_in: SocialPostUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update a scheduled post."""
    post = db.query(SocialPostModel).filter(SocialPostModel.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if current_user.role == UserRole.CLIENT and post.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.STAFF:
        client = db.query(User).filter(User.id == post.client_id).first()
        if not client or client.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    update_data = post_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)
        
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.delete("/{id}")
def delete_social_post(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Delete a scheduled post."""
    post = db.query(SocialPostModel).filter(SocialPostModel.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if current_user.role == UserRole.CLIENT and post.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.STAFF:
        client = db.query(User).filter(User.id == post.client_id).first()
        if not client or client.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}

@router.post("/{id}/publish")
def publish_social_post(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Mock publish a scheduled post to social platforms."""
    post = db.query(SocialPostModel).filter(SocialPostModel.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if current_user.role == UserRole.CLIENT and post.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.STAFF:
        client = db.query(User).filter(User.id == post.client_id).first()
        if not client or client.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    # In a real system, this is where we'd call the OAuth APIs (Facebook, Twitter, LinkedIn)
    # For now, we mock the success and mark it as PUBLISHED
    post.status = "PUBLISHED"
    db.commit()
    db.refresh(post)
    return {"message": "Post successfully published to selected platforms", "post": post}
