from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class PlayerPositionSchema(BaseModel):
    x: float
    y: float
    z: float


class GameSaveCreate(BaseModel):
    save_name: str = Field("SECTOR_00_CHECKPOINT", max_length=100)
    slot_index: int = Field(1, ge=1, le=10)
    sector: str = "SECTOR_00"
    corruption_level: int = Field(21, ge=0, le=100)
    player_integrity: int = Field(100, ge=0, le=100)
    current_objective: str = "ACCESS SECURITY DOOR"
    world_state_data: Dict[str, Any] = Field(default_factory=dict)


class GameSaveResponse(BaseModel):
    id: str
    user_id: str
    save_name: str
    slot_index: int
    sector: str
    corruption_level: int
    player_integrity: int
    current_objective: str
    world_state_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorldStateSync(BaseModel):
    sector_name: str = "SECTOR_CORE_00"
    current_objective: str = "ACCESS SECURITY DOOR"
    door_01_permission: str = "USER"
    door_01_locked: bool = True
    terminal_01_active: bool = False
    corruption_level: int = 21
    player_integrity: int = 100
    player_position: Optional[PlayerPositionSchema] = None
    world_entities: Dict[str, Any] = Field(default_factory=dict)
