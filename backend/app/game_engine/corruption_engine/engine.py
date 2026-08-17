from typing import Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.game_session import GameSession
from app.models.player_profile import PlayerProfile
from app.models.game_event import GameEvent
from app.websocket.connection_manager import ws_manager
from app.game_engine.corruption_engine.events import (
    CorruptionEventType,
    CorruptionSeverity,
    NullCorruptionPayload,
)
from app.utils.logger import logger


class CorruptionEngine:
    """
    Authoritative Server-Side NULL Corruption Engine.
    Manages deterministic corruption progression, persistent profile/session synchronization,
    and real-time event broadcasting.
    """

    INITIAL_CORRUPTION_LEVEL: int = 20
    ROOT_CORRUPTION_LEVEL: int = 74

    @staticmethod
    async def set_session_corruption(
        db: AsyncSession,
        session: GameSession,
        new_level: int,
    ) -> int:
        """
        Updates corruption level on the active GameSession and linked PlayerProfile.
        """
        clamped_level = max(0, min(100, new_level))
        session.corruption_level = clamped_level

        # Also update linked PlayerProfile if present
        if session.user_id:
            profile_stmt = select(PlayerProfile).where(
                PlayerProfile.user_id == session.user_id
            )
            profile_res = await db.execute(profile_stmt)
            profile = profile_res.scalars().first()
            if profile:
                profile.corruption_level = clamped_level

        return clamped_level

    @staticmethod
    async def trigger_event(
        db: AsyncSession,
        session: GameSession,
        event_type: CorruptionEventType,
        payload_data: Dict[str, Any],
        new_level: Optional[int] = None,
    ) -> GameEvent:
        """
        Generic trigger for extensible corruption events (e.g. LIGHT_FLICKER, OBJECT_MUTATION, etc.).
        """
        prev_level = session.corruption_level
        if new_level is not None:
            await CorruptionEngine.set_session_corruption(db, session, new_level)

        event = GameEvent(
            session_id=session.id,
            event_type=event_type.value,
            payload_json=payload_data,
        )
        db.add(event)
        await db.commit()

        # Broadcast via WebSocket
        try:
            await ws_manager.broadcast_to_session(
                session.id,
                event_type=event_type.value,
                payload=payload_data,
            )
        except Exception as e:
            logger.warning(f"Failed to broadcast corruption event '{event_type}': {e}")

        return event

    @staticmethod
    async def trigger_door_root_corruption(
        db: AsyncSession,
        session: GameSession,
    ) -> Dict[str, Any]:
        """
        Specific authoritative trigger executed when the player successfully rewrites door_01 to ROOT.
        Elevates corruption level from 20 -> 74, persists to DB, and broadcasts NULL_CORRUPTION event.
        """
        prev_level = session.corruption_level
        new_level = CorruptionEngine.ROOT_CORRUPTION_LEVEL

        # 1. Update GameSession and PlayerProfile
        await CorruptionEngine.set_session_corruption(db, session, new_level)

        # 2. Construct Payload
        payload = NullCorruptionPayload(
            previous_level=prev_level,
            new_level=new_level,
            severity=CorruptionSeverity.HIGH,
            message="Unknown process detected",
            extra_telemetry={
                "trigger": "door_01_root_override",
                "sector": session.current_sector,
            },
        ).model_dump()

        # 3. Create persistent GameEvent
        event = GameEvent(
            session_id=session.id,
            event_type=CorruptionEventType.NULL_CORRUPTION.value,
            payload_json=payload,
        )
        db.add(event)
        await db.commit()

        logger.info(
            f"[NULL_CORRUPTION] Session '{session.id}': Corruption level surged {prev_level}% -> {new_level}%"
        )

        # 4. Broadcast via WebSocket
        try:
            await ws_manager.broadcast_to_session(
                session.id,
                event_type=CorruptionEventType.NULL_CORRUPTION.value,
                payload=payload,
            )
        except Exception as e:
            logger.warning(f"WebSocket broadcast error for NULL_CORRUPTION: {e}")

        # 5. Authoritatively spawn NULL_FRAGMENT enemy
        try:
            from app.game_engine.enemy_engine import enemy_engine
            await enemy_engine.spawn_enemy(
                db,
                session_id=session.id,
                enemy_id="null_fragment_01",
                enemy_type="NULL_FRAGMENT",
                sector=session.current_sector,
                position=[0.0, 0.8, -4.0],
                state="AGGRESSIVE",
            )
        except Exception as e:
            logger.warning(f"Error triggering enemy spawn on corruption: {e}")

        return payload


corruption_engine = CorruptionEngine()
