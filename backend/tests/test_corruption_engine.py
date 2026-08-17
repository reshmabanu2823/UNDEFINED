import uuid
import pytest
from starlette.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.database import AsyncSessionLocal
from app.models.game_session import GameSession
from app.models.player_profile import PlayerProfile
from app.models.game_event import GameEvent
from app.game_engine.corruption_engine import (
    corruption_engine,
    CorruptionEventType,
    CorruptionSeverity,
)


@pytest.mark.asyncio
async def test_initial_corruption_and_root_trigger():
    uid = uuid.uuid4().hex[:8]
    async with AsyncSessionLocal() as db:
        # 1. Create Profile & Session
        profile = PlayerProfile(
            id=str(uuid.uuid4()),
            user_id=f"user_{uid}",
            display_name=f"operator_{uid}",
            corruption_level=20,
            system_integrity=100,
            debug_energy=100,
        )
        db.add(profile)

        session = GameSession(
            id=str(uuid.uuid4()),
            user_id=f"user_{uid}",
            current_chapter=1,
            current_sector="sector_01",
            corruption_level=20,
            system_integrity=100,
            debug_energy=100,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        assert session.corruption_level == 20

        # 2. Trigger door root corruption event
        payload = await corruption_engine.trigger_door_root_corruption(db, session)
        assert payload["previous_level"] == 20
        assert payload["new_level"] == 74
        assert payload["severity"] == CorruptionSeverity.HIGH
        assert payload["message"] == "Unknown process detected"

        # 3. Verify Database Persistence in GameSession and PlayerProfile
        session_res = await db.execute(
            select(GameSession).where(GameSession.id == session.id)
        )
        updated_session = session_res.scalars().first()
        assert updated_session.corruption_level == 74

        profile_res = await db.execute(
            select(PlayerProfile).where(PlayerProfile.user_id == f"user_{uid}")
        )
        updated_profile = profile_res.scalars().first()
        assert updated_profile.corruption_level == 74

        # 4. Verify GameEvent created in database
        event_res = await db.execute(
            select(GameEvent).where(
                GameEvent.session_id == session.id,
                GameEvent.event_type == CorruptionEventType.NULL_CORRUPTION.value,
            )
        )
        event = event_res.scalars().first()
        assert event is not None
        assert event.payload_json["new_level"] == 74
        assert event.payload_json["message"] == "Unknown process detected"


@pytest.mark.asyncio
async def test_extensible_corruption_events():
    async with AsyncSessionLocal() as db:
        session = GameSession(
            id=str(uuid.uuid4()),
            user_id="operator_test_ext",
            corruption_level=20,
        )
        db.add(session)
        await db.commit()

        # Trigger LIGHT_FLICKER
        event_flicker = await corruption_engine.trigger_event(
            db,
            session,
            CorruptionEventType.LIGHT_FLICKER,
            payload_data={"duration_ms": 800, "sector": "sector_01"},
        )
        assert event_flicker.event_type == "LIGHT_FLICKER"

        # Trigger UI_GLITCH
        event_glitch = await corruption_engine.trigger_event(
            db,
            session,
            CorruptionEventType.UI_GLITCH,
            payload_data={"intensity": 0.85, "shader": "scanline_distort"},
        )
        assert event_glitch.event_type == "UI_GLITCH"


@pytest.mark.asyncio
async def test_corruption_engine_websocket_broadcast_on_rewrite():
    uid = uuid.uuid4().hex[:8]
    creds = {
        "username": f"corrupt_{uid}",
        "email": f"corrupt_{uid}@nullroot.net",
        "password": "Password123!",
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post("/api/auth/register", json=creds)
        login_res = await ac.post("/api/auth/login", json={"email": creds["email"], "password": creds["password"]})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create session
        session_res = await ac.post("/api/game/sessions", headers=headers, json={})
        session_id = session_res.json()["id"]

        with TestClient(app) as client:
            with client.websocket_connect(f"/api/ws/game/{session_id}?token={token}") as ws:
                ws.receive_json()  # connection established

                # Execute rewrite
                await ac.post(
                    "/api/debug/execute",
                    headers=headers,
                    json={"session_id": session_id, "command": "rewrite door_01.permission=root"},
                )

                # Receive broadcast events (NULL_CORRUPTION, ENEMY_SPAWNED, QUEST_UPDATED, WORLD_STATE_CHANGED)
                events = [ws.receive_json(), ws.receive_json(), ws.receive_json(), ws.receive_json()]
                event_types = [e["type"] for e in events]
                assert "NULL_CORRUPTION" in event_types
                assert "WORLD_STATE_CHANGED" in event_types
                assert "ENEMY_SPAWNED" in event_types

                corrupt_event = next(e for e in events if e["type"] == "NULL_CORRUPTION")
                assert corrupt_event["payload"]["previous_level"] == 20
                assert corrupt_event["payload"]["new_level"] == 74
                assert corrupt_event["payload"]["severity"] == "HIGH"
                assert corrupt_event["payload"]["message"] == "Unknown process detected"

                enemy_event = next(e for e in events if e["type"] == "ENEMY_SPAWNED")
                assert enemy_event["payload"]["enemy_id"] == "null_fragment_01"
                assert enemy_event["payload"]["enemy_type"] == "NULL_FRAGMENT"

                world_event = next(e for e in events if e["type"] == "WORLD_STATE_CHANGED")
                assert world_event["payload"]["object_id"] == "door_01"
                assert world_event["payload"]["state"]["permission"] == "ROOT"
                assert world_event["payload"]["state"]["locked"] is False
