from datetime import datetime
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field, ConfigDict


class WorldObjectState(BaseModel):
    object_id: str
    object_type: str
    state: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class GameSessionCreate(BaseModel):
    custom_name: Optional[str] = Field(None, max_length=100)


class GameSessionSummary(BaseModel):
    id: str
    user_id: str
    current_chapter: int
    current_sector: str
    system_integrity: int
    corruption_level: int
    debug_energy: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GameSessionDetailResponse(BaseModel):
    id: str
    user_id: str
    current_chapter: int
    current_sector: str
    system_integrity: int
    corruption_level: int
    debug_energy: int
    is_active: bool
    world_objects: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SaveSessionRequest(BaseModel):
    save_name: str = Field("CHECKPOINT_MANUAL", max_length=100)
    slot_number: int = Field(1, ge=1, le=10)


class LoadSessionRequest(BaseModel):
    save_id: Optional[str] = None
    slot_number: Optional[int] = Field(None, ge=1, le=10)


class SaveSlotResponse(BaseModel):
    id: str
    user_id: str
    game_session_id: Optional[str]
    save_name: str
    slot_number: int
    serialized_game_state: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlayerPositionSchema(BaseModel):
    x: float
    y: float
    z: float


class WorldStateSync(BaseModel):
    sector_name: str = "sector_01"
    current_objective: str = "ACCESS SECURITY DOOR"
    door_01_permission: str = "USER"
    door_01_locked: bool = True
    terminal_01_active: bool = False
    corruption_level: int = 20
    player_integrity: int = 100
    player_position: Optional[PlayerPositionSchema] = None
    world_entities: Dict[str, Any] = Field(default_factory=dict)
