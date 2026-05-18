import json
from unittest.mock import patch, MagicMock
import pytest


@pytest.mark.asyncio
@patch("app.routes.internal.boto3.client")
async def test_seed_challenge(mock_boto3_client, client, db_session):
    mock_bedrock = MagicMock()
    mock_body = MagicMock()
    mock_body.read.return_value = json.dumps({
        "output": {"message": {"content": [{"text": "Write about a dragon"}]}},
    }).encode()
    mock_bedrock.invoke_model.return_value = {"body": mock_body}
    mock_boto3_client.return_value = mock_bedrock

    response = await client.post("/api/v1/internal/challenge-seed")
    assert response.status_code == 200
    data = response.json()
    assert data["prompt"] == "Write about a dragon"
    assert "id" in data
    assert "date" in data
