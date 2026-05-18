from pydantic import BaseModel, ConfigDict


class PdfExportRequest(BaseModel):
    bookId: str


class PdfJobResponse(BaseModel):
    jobId: str
    status: str
    downloadUrl: str | None = None
    error: str | None = None

    model_config = ConfigDict(from_attributes=True)
