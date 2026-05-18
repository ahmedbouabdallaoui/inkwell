from datetime import date
from pydantic import BaseModel, ConfigDict


class ChallengeResponse(BaseModel):
    id: str
    prompt: str
    date: date
    streakCount: int

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
