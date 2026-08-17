from typing import Dict, Any, List, Optional
from enum import Enum
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.game_event import GameEvent
from app.websocket.connection_manager import ws_manager
from app.utils.logger import logger


class EnemyType(str, Enum):
    NULL_FRAGMENT = "NULL_FRAGMENT"
    CORRUPTED_SENTINEL = "CORRUPTED_SENTINEL"
    VOID_ECHO = "VOID_ECHO"


class EnemyState(str, Enum):
    SPAWNED = "SPAWNED"
    IDLE = "IDLE"
    HUNTING = "HUNTING"
    AGGRESSIVE = "AGGRESSIVE"
    STUNNED = "STUNNED"
    DESPAWNED = "DESPAWNED"


class EnemyInstance(BaseModel):
    enemy_id: str
    enemy_type: str = Field(default=EnemyType.NULL_FRAGMENT.value)
    sector: str = Field(default="sector_01")
    position: List[float] = Field(default_factory=lambda: [0.0, 0.8, -4.0])
    state: str = Field(default=EnemyState.AGGRESSIVE.value)
    health: float = Field(default=100.0)


class EnemyEngine:
    """
    Authoritative Server-Side Enemy State Management Engine.
    Controls enemy identity, lifecycle spawning, state transitions, and WebSocket dispatch.
    """

    def __init__(self):
        # In-memory registry of active session enemies for fast querying
        self._session_enemies: Dict[str, Dict[str, EnemyInstance]] = {}

    def get_session_enemies(self, session_id: str) -> List[EnemyInstance]:
        return list(self._session_enemies.get(session_id, {}).values())

    async def spawn_enemy(
        self,
        db: AsyncSession,
        session_id: str,
        enemy_id: str = "null_fragment_01",
        enemy_type: str = EnemyType.NULL_FRAGMENT.value,
        sector: str = "sector_01",
        position: Optional[List[float]] = None,
        state: str = EnemyState.AGGRESSIVE.value,
    ) -> EnemyInstance:
        if position is None:
            position = [0.0, 0.8, -4.0]

        instance = EnemyInstance(
            enemy_id=enemy_id,
            enemy_type=enemy_type,
            sector=sector,
            position=position,
            state=state,
        )

        if session_id not in self._session_enemies:
            self._session_enemies[session_id] = {}
        self._session_enemies[session_id][enemy_id] = instance

        payload = {
            "enemy_id": instance.enemy_id,
            "enemy_type": instance.enemy_type,
            "sector": instance.sector,
            "position": instance.position,
            "state": instance.state,
        }

        # 1. Persist GameEvent in DB
        event = GameEvent(
            session_id=session_id,
            event_type="ENEMY_SPAWNED",
            payload_json=payload,
        )
        db.add(event)
        await db.commit()

        # 2. Real-time WebSocket Broadcast
        try:
            await ws_manager.broadcast_to_session(
                session_id,
                event_type="ENEMY_SPAWNED",
                payload=payload,
            )
            logger.info(f"[ENEMY_SPAWNED] Broadcast enemy '{enemy_id}' ({enemy_type}) to session '{session_id}'")
        except Exception as e:
            logger.warning(f"Error broadcasting ENEMY_SPAWNED: {e}")

        return instance

    async def update_enemy_state(
        self,
        session_id: str,
        enemy_id: str,
        new_state: EnemyState,
    ) -> Optional[EnemyInstance]:
        if session_id in self._session_enemies and enemy_id in self._session_enemies[session_id]:
            instance = self._session_enemies[session_id][enemy_id]
            instance.state = new_state.value

            try:
                await ws_manager.broadcast_to_session(
                    session_id,
                    event_type="ENEMY_STATE_CHANGED",
                    payload={
                        "enemy_id": enemy_id,
                        "state": new_state.value,
                    },
                )
            except Exception as e:
                logger.warning(f"Error broadcasting ENEMY_STATE_CHANGED: {e}")

            return instance
        return None


enemy_engine = EnemyEngine()
