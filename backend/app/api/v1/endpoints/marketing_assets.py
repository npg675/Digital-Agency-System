from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.marketing_asset import MarketingSequence, MarketingAsset
from app.schemas.marketing_asset import MarketingSequenceResponse, MarketingAssetResponse

router = APIRouter()

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
