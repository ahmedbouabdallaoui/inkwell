from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.book import Book
from app.schemas.book import BookResponse, BookListResponse

router = APIRouter(prefix="/api/v1/books", tags=["books"])


@router.get("")
async def list_books(
    page: int = Query(0, ge=0),
    per_page: int = Query(8, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookListResponse:
    total_result = await db.execute(select(func.count(Book.id)).where(Book.user_id == user.id))
    total = total_result.scalar() or 0
    result = await db.execute(
        select(Book)
        .where(Book.user_id == user.id)
        .order_by(Book.created_at.desc())
        .offset(page * per_page)
        .limit(per_page)
    )
    books = result.scalars().all()
    return BookListResponse(
        books=[BookResponse.model_validate(b) for b in books],
        total=total,
    )


@router.get("/{book_id}")
async def get_book(
    book_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookResponse:
    result = await db.execute(select(Book).where(Book.id == book_id, Book.user_id == user.id))
    book = result.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return BookResponse.model_validate(book)
