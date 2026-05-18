from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class BookResponse(BaseModel):
    id: str
    title: str
    genre: str
    characters: str
    setting: str
    cover_image_url: str | None = Field(None, serialization_alias="coverImageUrl")
    pages: list[str]
    created_at: datetime = Field(serialization_alias="createdAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class BookListResponse(BaseModel):
    books: list[BookResponse]
    total: int
