from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.pdf_job import PdfJob
from app.schemas.pdf import PdfExportRequest, PdfJobResponse
from app.services.pdf import enqueue_pdf_export

router = APIRouter(prefix="/api/v1", tags=["pdf"])


@router.post("/pdf/export", status_code=202)
async def export_pdf(
    body: PdfExportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PdfJobResponse:
    try:
        job_id = await enqueue_pdf_export(db, body.bookId, user.id)
        return PdfJobResponse(jobId=job_id, status="pending")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/pdf/{job_id}")
async def get_pdf_job(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PdfJobResponse:
    result = await db.execute(
        select(PdfJob).where(PdfJob.id == job_id, PdfJob.user_id == user.id)
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="PDF job not found")
    return PdfJobResponse(jobId=job.id, status=job.status, downloadUrl=job.download_url, error=job.error)
