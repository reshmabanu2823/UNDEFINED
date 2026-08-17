from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class DebugExecuteRequest(BaseModel):
    session_id: str = Field(..., description="Active game session ID")
    command: str = Field(
        ...,
        min_length=1,
        max_length=200,
        json_schema_extra={"example": "rewrite door_01.permission=root"},
    )


class DebugExecuteResponse(BaseModel):
    success: bool
    command: str
    object_id: Optional[str] = None
    property: Optional[str] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    message: str
    error_code: Optional[str] = None
    state_changed: bool = False
    updated_state: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


# Aliases for backward compatibility
CommandRequest = DebugExecuteRequest
CommandResponse = DebugExecuteResponse
