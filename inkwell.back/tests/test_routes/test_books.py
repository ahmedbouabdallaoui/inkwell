import pytest
from app.models.book import Book


@pytest.mark.asyncio
async def test_create_and_list_books(client, db_session, test_user):
    book = Book(
        user_id=test_user.id,
        title="Test Book",
        genre="Fantasy",
        characters="Hero",
        setting="World",
        pages=["Page 1", "Page 2"],
    )
    db_session.add(book)
    await db_session.flush()

    response = await client.get("/api/v1/books")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["books"][0]["title"] == "Test Book"
    assert data["books"][0]["pages"] == ["Page 1", "Page 2"]


@pytest.mark.asyncio
async def test_get_single_book(client, db_session, test_user):
    book = Book(
        user_id=test_user.id,
        title="Single Book",
        genre="Sci-Fi",
        characters="Alien",
        setting="Mars",
        pages=["Only page"],
    )
    db_session.add(book)
    await db_session.flush()

    response = await client.get(f"/api/v1/books/{book.id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Single Book"


@pytest.mark.asyncio
async def test_get_nonexistent_book(client):
    response = await client.get("/api/v1/books/nonexistent-id")
    assert response.status_code == 404
