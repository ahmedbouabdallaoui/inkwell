import base64
import json

import boto3

from app.core.config import settings


def generate_story_sync(genre: str, characters: str, setting: str) -> tuple[list[str], bytes]:
    bedrock = boto3.client("bedrock-runtime", region_name=settings.bedrock_region)

    prompt = f"""Write a 400-500 word short story in the {genre} genre.
Characters: {characters}
Setting: {setting}

Return the story split into paragraphs separated by "---". Each paragraph is one page."""

    response = bedrock.invoke_model(
        modelId="amazon.nova-lite-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "maxTokens": 1500,
        }),
    )
    body = json.loads(response["body"].read())
    text = body["output"]["message"]["content"][0]["text"]
    pages = [p.strip() for p in text.split("---") if p.strip()]

    # Generate cover image
    image_prompt = f"A beautiful book cover for a {genre} story: {setting}, featuring {characters}"
    image_response = bedrock.invoke_model(
        modelId="amazon.nova-canvas-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "taskType": "TEXT_IMAGE",
            "textToImageParams": {"text": image_prompt},
            "imageGenerationConfig": {"width": 1024, "height": 1024, "numberOfImages": 1},
        }),
    )
    image_body = json.loads(image_response["body"].read())
    image_bytes = base64.b64decode(image_body["images"][0])

    return pages, image_bytes


def upload_cover_sync(image_bytes: bytes, book_id: str) -> str:
    s3 = boto3.client("s3", region_name=settings.aws_default_region)
    key = f"covers/{book_id}.png"
    s3.put_object(Bucket=settings.s3_covers_bucket, Key=key, Body=image_bytes, ContentType="image/png")
    return f"https://{settings.s3_covers_bucket}.s3.{settings.aws_default_region}.amazonaws.com/{key}"
