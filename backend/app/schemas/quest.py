from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class ObjectiveItem(BaseModel):
    id: str
    label: str
    status: str = Field("LOCKED")  # COMPLETED, IN_PROGRESS, LOCKED, CORRUPTED


class QuestResponse(BaseModel):
    id: str
    quest_key: str
    title: str
    description: str
    chapter: str
    status: str = Field("IN_PROGRESS")  # NOT_STARTED, IN_PROGRESS, COMPLETED, FAILED
    current_objective: str
    objectives: List[ObjectiveItem] = Field(default_factory=list)
    progress_percent: float = Field(0.0, ge=0.0, le=100.0)

    model_config = ConfigDict(from_attributes=True)


class QuestProgressUpdateRequest(BaseModel):
    objective_id: str
    status: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
