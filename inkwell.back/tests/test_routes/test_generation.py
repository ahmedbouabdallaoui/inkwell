import pytest
from app.models.generation_job import GenerationJob
from app.models.book import Book


@pytest.mark.asyncio
async def test_create_generation(client, db_session, test_user):
    response = await client.post("/api/v1/generate", json={
        "genre": "Fantasy",
        "characters": "Hero",
        "setting": "World",
    })
    assert response.status_code == 202
    data = response.json()
    assert data["jobId"] is not None
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_get_generation_pending(client, db_session, test_user):
    job = GenerationJob(
        user_id=test_user.id,
        genre="Fantasy",
        characters="Hero",
        setting="World",
        status="pending",
    )
    db_session.add(job)
    await db_session.flush()

    response = await client.get(f"/api/v1/generate/{job.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["jobId"] == job.id
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_get_generation_completed(client, db_session, test_user):
    book = Book(
        user_id=test_user.id,
        title="Generated Book",
        genre="Fantasy",
        characters="Hero",
        setting="World",
        pages=["Page 1 content", "Page 2 content"],
    )
    db_session.add(book)
    await db_session.flush()

    job = GenerationJob(
        user_id=test_user.id,
        genre="Fantasy",
        characters="Hero",
        setting="World",
        status="complete",
        result_book_id=book.id,
    )
    db_session.add(job)
    await db_session.flush()

    response = await client.get(f"/api/v1/generate/{job.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["jobId"] == job.id
    assert data["status"] == "complete"
    assert data["book"]["id"] == book.id
    assert data["book"]["title"] == "Generated Book"
    assert data["book"]["pages"] == ["Page 1 content", "Page 2 content"]


@pytest.mark.asyncio
async def test_get_generation_failed(client, db_session, test_user):
    job = GenerationJob(
        user_id=test_user.id,
        genre="Fantasy",
        characters="Hero",
        setting="World",
        status="failed",
        error="Bedrock API error",
    )
    db_session.add(job)
    await db_session.flush()

    response = await client.get(f"/api/v1/generate/{job.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["jobId"] == job.id
    assert data["status"] == "failed"
    assert data["error"] == "Bedrock API error"


@pytest.mark.asyncio
async def test_get_generation_not_found(client):
    response = await client.get("/api/v1/generate/nonexistent-id")
    assert response.status_code == 404
