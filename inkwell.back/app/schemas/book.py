from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BookResponse(BaseModel):
    id: str
    title: str
    genre: str
    characters: str
    setting: str
    coverImageUrl: str | None = None
    pages: list[str]
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class BookListResponse(BaseModel):
    books: list[BookResponse]
    total: int
