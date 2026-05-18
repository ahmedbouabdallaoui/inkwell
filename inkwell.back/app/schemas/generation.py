from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.book import BookResponse


class GenerateRequest(BaseModel):
    genre: str
    characters: str
    setting: str


class GenerationJobResponse(BaseModel):
    jobId: str
    status: str
    book: BookResponse | None = None
    error: str | None = None

    model_config = ConfigDict(from_attributes=True)
