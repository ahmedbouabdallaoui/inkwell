import json
import boto3
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.pdf_job import PdfJob
from app.models.book import Book


async def enqueue_pdf_export(db: AsyncSession, book_id: str, user_id: str) -> str:
    result = await db.execute(select(Book).where(Book.id == book_id, Book.user_id == user_id))
    book = result.scalar_one_or_none()
    if book is None:
        raise ValueError("Book not found")

    job = PdfJob(book_id=book_id, user_id=user_id)
    db.add(job)
    await db.flush()

    sqs = boto3.client("sqs", region_name=settings.aws_default_region)
    sqs.send_message(
        QueueUrl=settings.sqs_pdf_queue_url,
        MessageBody=json.dumps({"job_id": job.id}),
    )
    return job.id
