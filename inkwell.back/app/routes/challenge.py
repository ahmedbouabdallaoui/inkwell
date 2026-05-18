from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.challenge import ChallengeResponse
from app.services.challenge import get_today_challenge, update_streak

router = APIRouter(prefix="/api/v1", tags=["challenge"])


@router.get("/challenge")
async def get_challenge(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChallengeResponse:
    challenge = await get_today_challenge(db)
    streak = await update_streak(db, user)
    return ChallengeResponse(
        id=challenge.id if challenge else "",
        prompt=challenge.prompt if challenge else "No challenge today",
        date=challenge.date if challenge else None,
        streak_count=streak,
    )
