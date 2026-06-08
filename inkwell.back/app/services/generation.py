import base64

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings

def _bedrock_generate(prompt: str) -> str | None:
    try:
        bedrock = boto3.client("bedrock-runtime", region_name="us-west-2")
        models = [
            "meta.llama3-1-8b-instruct-v1:0",
        ]
        for model_id in models:
            try:
                response = bedrock.converse(
                    modelId=model_id,
                    messages=[{"role": "user", "content": [{"text": prompt}]}],
                    inferenceConfig={"maxTokens": 1500},
                )
                return response["output"]["message"]["content"][0]["text"]
            except (ClientError, Exception):
                continue
    except Exception:
        pass
    return None


def _fallback_text(genre: str, characters: str, setting: str) -> list[str]:
    return [
        f"In the heart of the {setting}, {characters} stood at the threshold of an extraordinary adventure. The air was thick with anticipation, and the horizon glowed with the promise of discovery.",
        f"The journey began at dawn. {characters} moved through the landscape with purpose, each step carrying them deeper into the unknown. The world around them seemed to hold its breath.",
        f"Suddenly, a challenge emerged from the shadows. It tested their courage and resolve, forcing them to confront fears they had long buried. But together, they found strength they didn't know they had.",
        f"As the sun set on their first day, {characters} realized that this {genre} adventure was about more than reaching a destination. It was about the bonds forged along the way.",
        f"The night brought unexpected allies and whispered secrets. Ancient trees spoke of a hidden truth that could change everything. {characters} listened closely, knowing their path was guided by forces beyond their understanding.",
        f"Dawn broke with a revelation. The true purpose of their quest became clear — not to find treasure or power, but to restore balance to a world that had forgotten its own magic.",
        f"In the final confrontation, {characters} drew upon everything they had learned. The culmination of their journey was not a battle of strength, but of heart and wisdom.",
        f"They returned home transformed, carrying with them the lessons of their {genre} adventure. Though the journey had ended, the story would live on — whispered by the wind, echoed in the stars.",
    ]


def _mock_cover() -> bytes:
    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )


def generate_story_sync(genre: str, characters: str, setting: str) -> tuple[list[str], bytes]:
    prompt = f"""Write a 400-500 word short story in the {genre} genre.
Characters: {characters}
Setting: {setting}

Return the story split into paragraphs separated by "---". Each paragraph is one page."""

    text = _bedrock_generate(prompt)

    if text is not None:
        pages = [p.strip() for p in text.split("---") if p.strip()]
        if not pages:
            pages = _fallback_text(genre, characters, setting)
    else:
        pages = _fallback_text(genre, characters, setting)

    return pages, _mock_cover()


def upload_cover_sync(image_bytes: bytes, book_id: str) -> str:
    try:
        s3 = boto3.client("s3", region_name=settings.aws_default_region)
        key = f"covers/{book_id}.png"
        s3.put_object(Bucket=settings.s3_covers_bucket, Key=key, Body=image_bytes, ContentType="image/png")
        return f"https://{settings.s3_covers_bucket}.s3.{settings.aws_default_region}.amazonaws.com/{key}"
    except (ClientError, Exception):
        return ""
