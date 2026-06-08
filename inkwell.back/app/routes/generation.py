from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.generation_job import GenerationJob
from app.models.book import Book
from app.schemas.generation import GenerateRequest, GenerationJobResponse
from app.tasks.generate import run_generation
from app.schemas.book import BookResponse

router = APIRouter(prefix="/api/v1", tags=["generation"])


@router.post("/generate", status_code=202)
async def create_generation(
    body: GenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationJobResponse:
    job = GenerationJob(
        user_id=user.id,
        genre=body.genre,
        characters=body.characters,
        setting=body.setting,
    )
    db.add(job)
    await db.flush()
    job_id = job.id

    import asyncio
    await db.commit()
    asyncio.create_task(run_generation(job_id))

    return GenerationJobResponse(job_id=job_id, status="pending")


@router.get("/generate/{job_id}")
async def get_generation_job(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationJobResponse:
    result = await db.execute(
        select(GenerationJob).where(GenerationJob.id == job_id, GenerationJob.user_id == user.id)
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Generation job not found")

    resp = GenerationJobResponse(job_id=job.id, status=job.status, error=job.error)
    if job.result_book_id:
        book_result = await db.execute(
            select(Book).where(Book.id == job.result_book_id)
        )
        book = book_result.scalar_one_or_none()
        if book:
            resp.book = BookResponse.model_validate(book)
    return resp
