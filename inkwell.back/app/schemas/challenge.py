from datetime import date
from pydantic import BaseModel, ConfigDict, Field


class ChallengeResponse(BaseModel):
    id: str
    prompt: str
    date: date
    streak_count: int = Field(serialization_alias="streakCount")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
