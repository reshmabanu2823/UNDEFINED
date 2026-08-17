from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class CommandRequest(BaseModel):
    command: str = Field(
        ...,
        min_length=1,
        max_length=200,
        json_schema_extra={"example": "rewrite door_01.permission=root"},
    )
    session_id: Optional[str] = None


class CommandResponse(BaseModel):
    success: bool = True
    command: str
    output: str
    is_error: bool = False
    is_success: bool = True
    state_changed: bool = False
    updated_state: Optional[Dict[str, Any]] = None
