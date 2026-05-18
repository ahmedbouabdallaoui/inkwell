import pytest


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_books_empty(client):
    response = await client.get("/api/v1/books")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["books"] == []
