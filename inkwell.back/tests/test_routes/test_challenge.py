import pytest
from datetime import date
from app.models.challenge import Challenge


@pytest.mark.asyncio
async def test_get_challenge_with_challenge(client, db_session, test_user):
    today = date.today()
    challenge = Challenge(prompt="Write about a dragon", date=today)
    db_session.add(challenge)
    await db_session.flush()

    response = await client.get("/api/v1/challenge")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == challenge.id
    assert data["prompt"] == "Write about a dragon"
    assert data["streakCount"] == 1


@pytest.mark.asyncio
async def test_get_challenge_streak_persists(client, db_session, test_user):
    today = date.today()
    challenge = Challenge(prompt="Write about a dragon", date=today)
    db_session.add(challenge)
    await db_session.flush()

    await client.get("/api/v1/challenge")
    response = await client.get("/api/v1/challenge")
    assert response.status_code == 200
    assert response.json()["streakCount"] == 1


@pytest.mark.asyncio
async def test_get_challenge_no_challenge(client, test_user):
    response = await client.get("/api/v1/challenge")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == ""
    assert data["prompt"] == "No challenge today"
    assert data["streakCount"] == 1
