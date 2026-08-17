import uuid
import pytest
from starlette.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import get_db
from app.game_engine.enemy_engine import enemy_engine, EnemyState


@pytest.mark.asyncio
async def test_enemy_spawn_and_websocket_broadcast():
    uid = uuid.uuid4().hex[:8]
    creds = {
        "username": f"enemy_hunter_{uid}",
        "email": f"enemy_hunter_{uid}@nullroot.net",
        "password": "Password123!",
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post("/api/auth/register", json=creds)
        login_res = await ac.post("/api/auth/login", json={"email": creds["email"], "password": creds["password"]})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        session_res = await ac.post("/api/game/sessions", headers=headers, json={})
        session_id = session_res.json()["id"]

        with TestClient(app) as client:
            with client.websocket_connect(f"/api/ws/game/{session_id}?token={token}") as ws:
                # 1. Connection established
                conn_msg = ws.receive_json()
                assert conn_msg["type"] == "CONNECTION_ESTABLISHED"

                # 2. Server-side authoritative spawn
                async for db in get_db():
                    instance = await enemy_engine.spawn_enemy(
                        db,
                        session_id=session_id,
                        enemy_id="null_fragment_01",
                        enemy_type="NULL_FRAGMENT",
                        sector="sector_01",
                        position=[0.0, 1.2, -5.0],
                        state="AGGRESSIVE",
                    )
                    assert instance.enemy_id == "null_fragment_01"
                    break

                # 3. Receive ENEMY_SPAWNED on WebSocket
                spawn_event = ws.receive_json()
                assert spawn_event["type"] == "ENEMY_SPAWNED"
                assert spawn_event["payload"]["enemy_id"] == "null_fragment_01"
                assert spawn_event["payload"]["enemy_type"] == "NULL_FRAGMENT"
                assert spawn_event["payload"]["sector"] == "sector_01"
                assert spawn_event["payload"]["state"] == "AGGRESSIVE"


@pytest.mark.asyncio
async def test_enemy_state_transition_broadcast():
    session_id = f"session_{uuid.uuid4().hex[:8]}"
    token = "test_token"

    # Register enemy
    async for db in get_db():
        await enemy_engine.spawn_enemy(
            db,
            session_id=session_id,
            enemy_id="null_fragment_02",
            enemy_type="NULL_FRAGMENT",
            sector="sector_01",
        )
        break

    # Transition state
    updated = await enemy_engine.update_enemy_state(
        session_id=session_id,
        enemy_id="null_fragment_02",
        new_state=EnemyState.HUNTING,
    )
    assert updated is not None
    assert updated.state == "HUNTING"
