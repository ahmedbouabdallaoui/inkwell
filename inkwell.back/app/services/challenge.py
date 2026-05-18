from datetime import date, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.challenge import Challenge
from app.models.user import User


async def get_today_challenge(db: AsyncSession) -> Challenge | None:
    today = date.today()
    result = await db.execute(select(Challenge).where(Challenge.date == today))
    return result.scalar_one_or_none()


async def update_streak(db: AsyncSession, user: User) -> int:
    today = date.today()
    if user.last_challenge_date == today:
        return user.streak_count
    if user.last_challenge_date:
        from datetime import timedelta
        if user.last_challenge_date == today - timedelta(days=1):
            user.streak_count += 1
        else:
            user.streak_count = 1
    else:
        user.streak_count = 1
    user.last_challenge_date = today
    await db.flush()
    return user.streak_count
