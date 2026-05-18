import json
from datetime import date

import boto3
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.models.challenge import Challenge

router = APIRouter(prefix="/api/v1/internal", tags=["internal"])


@router.post("/challenge-seed")
async def seed_challenge(db: AsyncSession = Depends(get_db)):
    bedrock = boto3.client("bedrock-runtime", region_name=settings.bedrock_region)
    prompt = "Generate a creative writing prompt for a daily challenge. One sentence, evocative."
    response = bedrock.invoke_model(
        modelId="amazon.nova-lite-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "maxTokens": 100,
        }),
    )
    body = json.loads(response["body"].read())
    text = body["output"]["message"]["content"][0]["text"].strip()

    challenge = Challenge(prompt=text, date=date.today())
    db.add(challenge)
    await db.flush()
    return {"id": challenge.id, "prompt": challenge.prompt, "date": str(challenge.date)}
