from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class CorruptionEventType(str, Enum):
    NULL_CORRUPTION = "NULL_CORRUPTION"
    LIGHT_FLICKER = "LIGHT_FLICKER"
    UI_GLITCH = "UI_GLITCH"
    OBJECT_MUTATION = "OBJECT_MUTATION"
    FALSE_SYSTEM_MESSAGE = "FALSE_SYSTEM_MESSAGE"
    ENEMY_SPAWN = "ENEMY_SPAWN"
    DOOR_STATE_CHANGE = "DOOR_STATE_CHANGE"
    AREA_CORRUPTION = "AREA_CORRUPTION"


class CorruptionSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class NullCorruptionPayload(BaseModel):
    previous_level: int = Field(20, ge=0, le=100)
    new_level: int = Field(74, ge=0, le=100)
    severity: CorruptionSeverity = CorruptionSeverity.HIGH
    message: str = "Unknown process detected"
    extra_telemetry: Optional[Dict[str, Any]] = None


class CorruptionEventData(BaseModel):
    event_type: CorruptionEventType
    severity: CorruptionSeverity
    session_id: str
    previous_level: int
    new_level: int
    message: str
    payload: Dict[str, Any] = Field(default_factory=dict)
