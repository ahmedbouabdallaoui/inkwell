from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.book import BookResponse


class GenerateRequest(BaseModel):
    genre: str
    characters: str
    setting: str


class GenerationJobResponse(BaseModel):
    job_id: str = Field(serialization_alias="jobId")
    status: str
    book: BookResponse | None = None
    error: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
