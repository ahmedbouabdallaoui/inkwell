from unittest.mock import patch, MagicMock
import pytest
from app.models.book import Book
from app.models.pdf_job import PdfJob


@pytest.mark.asyncio
async def test_export_pdf_not_found(client):
    response = await client.post("/api/v1/pdf/export", json={"bookId": "nonexistent"})
    assert response.status_code == 404


@pytest.mark.asyncio
@patch("app.services.pdf.boto3.client")
async def test_export_pdf_success(mock_boto3_client, client, db_session, test_user):
    mock_sqs = MagicMock()
    mock_boto3_client.return_value = mock_sqs

    book = Book(
        user_id=test_user.id,
        title="PDF Book",
        genre="Fantasy",
        characters="Hero",
        setting="World",
        pages=["Page 1"],
    )
    db_session.add(book)
    await db_session.flush()

    response = await client.post("/api/v1/pdf/export", json={"bookId": book.id})
    assert response.status_code == 202
    data = response.json()
    assert data["jobId"] is not None
    assert data["status"] == "pending"
    mock_boto3_client.assert_called_once_with("sqs", region_name="us-east-1")
    mock_sqs.send_message.assert_called_once()


@pytest.mark.asyncio
async def test_get_pdf_pending(client, db_session, test_user):
    book = Book(
        user_id=test_user.id,
        title="PDF Book",
        genre="Fantasy",
        characters="Hero",
        setting="World",
        pages=["Page 1"],
    )
    db_session.add(book)
    await db_session.flush()

    job = PdfJob(book_id=book.id, user_id=test_user.id, status="pending")
    db_session.add(job)
    await db_session.flush()

    response = await client.get(f"/api/v1/pdf/{job.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["jobId"] == job.id
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_get_pdf_completed(client, db_session, test_user):
    book = Book(
        user_id=test_user.id,
        title="PDF Book",
        genre="Fantasy",
        characters="Hero",
        setting="World",
        pages=["Page 1"],
    )
    db_session.add(book)
    await db_session.flush()

    job = PdfJob(
        book_id=book.id,
        user_id=test_user.id,
        status="complete",
        download_url="https://example.com/test.pdf",
    )
    db_session.add(job)
    await db_session.flush()

    response = await client.get(f"/api/v1/pdf/{job.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["jobId"] == job.id
    assert data["status"] == "complete"
    assert data["downloadUrl"] == "https://example.com/test.pdf"


@pytest.mark.asyncio
async def test_get_pdf_failed(client, db_session, test_user):
    book = Book(
        user_id=test_user.id,
        title="PDF Book",
        genre="Fantasy",
        characters="Hero",
        setting="World",
        pages=["Page 1"],
    )
    db_session.add(book)
    await db_session.flush()

    job = PdfJob(
        book_id=book.id,
        user_id=test_user.id,
        status="failed",
        error="PDF generation failed",
    )
    db_session.add(job)
    await db_session.flush()

    response = await client.get(f"/api/v1/pdf/{job.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["jobId"] == job.id
    assert data["status"] == "failed"
    assert data["error"] == "PDF generation failed"


@pytest.mark.asyncio
async def test_get_pdf_not_found(client):
    response = await client.get("/api/v1/pdf/nonexistent-id")
    assert response.status_code == 404
