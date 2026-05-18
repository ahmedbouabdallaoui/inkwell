from pydantic import BaseModel, ConfigDict, Field


class PdfExportRequest(BaseModel):
    book_id: str = Field(serialization_alias="bookId")


class PdfJobResponse(BaseModel):
    job_id: str = Field(serialization_alias="jobId")
    status: str
    download_url: str | None = Field(None, serialization_alias="downloadUrl")
    error: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
