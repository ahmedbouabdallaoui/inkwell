from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.challenge import seed_todays_challenge_if_missing

router = APIRouter(prefix="/api/v1/internal", tags=["internal"])


@router.post("/challenge-seed")
async def seed_challenge(db: AsyncSession = Depends(get_db)):
    await seed_todays_challenge_if_missing(db)
    return {"status": "ok"}
