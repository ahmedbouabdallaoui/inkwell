import json
from datetime import date, timezone, timedelta

import boto3
from botocore.exceptions import ClientError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.challenge import Challenge
from app.models.user import User
from app.core.config import settings

async def get_today_challenge(db: AsyncSession) -> Challenge | None:
    today = date.today()
    result = await db.execute(select(Challenge).where(Challenge.date == today))
    return result.scalar_one_or_none()


def _bedrock_generate(prompt: str) -> str | None:
    try:
        bedrock = boto3.client("bedrock-runtime", region_name="us-west-2")
        models = [
            "meta.llama3-1-8b-instruct-v1:0",
            "amazon.titan-text-express-v1:0",
        ]
        for model_id in models:
            try:
                response = bedrock.converse(
                    modelId=model_id,
                    messages=[{"role": "user", "content": [{"text": prompt}]}],
                    inferenceConfig={"maxTokens": 100},
                )
                return response["output"]["message"]["content"][0]["text"].strip()
            except (ClientError, Exception):
                continue
    except Exception:
        pass
    return None


async def seed_todays_challenge_if_missing(db: AsyncSession) -> None:
    existing = await get_today_challenge(db)
    if existing:
        return
    prompt = "Generate a creative writing prompt for a daily challenge. One sentence, evocative."
    text = _bedrock_generate(prompt)
    if text is None:
        text = "Write a story about an unexpected discovery in an ordinary place."
    challenge = Challenge(prompt=text, date=date.today())
    db.add(challenge)
    await db.flush()


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
