import asyncio
from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.generation_job import GenerationJob
from app.models.book import Book
from app.services.generation import generate_story_sync, upload_cover_sync


async def run_generation(job_id: str):
    async with async_session_factory() as db:
        result = await db.execute(
            select(GenerationJob).where(GenerationJob.id == job_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            return

        try:
            job.status = "processing"
            await db.flush()

            pages, image_bytes = await asyncio.to_thread(generate_story_sync, job.genre, job.characters, job.setting)

            book = Book(
                user_id=job.user_id,
                title=f"{job.genre} Story",
                genre=job.genre,
                characters=job.characters,
                setting=job.setting,
                pages=pages,
            )
            db.add(book)
            await db.flush()

            cover_url = await asyncio.to_thread(upload_cover_sync, image_bytes, book.id)
            book.cover_image_url = cover_url

            job.status = "complete"
            job.result_book_id = book.id
        except Exception as e:
            job.status = "failed"
            job.error = str(e)

        await db.commit()
