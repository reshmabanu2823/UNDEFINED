import uuid
import pytest
from starlette.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.utils.security import create_access_token


@pytest.mark.asyncio
async def test_websocket_connection_and_ping():
    session_id = f"session_{uuid.uuid4().hex[:8]}"
    token = create_access_token(subject=str(uuid.uuid4()), email="ws_tester@nullroot.net")

    with TestClient(app) as client:
        with client.websocket_connect(f"/api/ws/game/{session_id}?token={token}") as ws:
            # 1. Verify initial connection event
            initial_msg = ws.receive_json()
            assert initial_msg["type"] == "CONNECTION_ESTABLISHED"
            assert initial_msg["payload"]["session_id"] == session_id
            assert initial_msg["payload"]["authenticated"] is True

            # 2. Test Ping/Pong
            ws.send_json({"type": "PING"})
            pong_msg = ws.receive_json()
            assert pong_msg["type"] == "PONG"


@pytest.mark.asyncio
async def test_websocket_broadcast_on_debug_rewrite():
    uid = uuid.uuid4().hex[:8]
    creds = {
        "username": f"ws_hacker_{uid}",
        "email": f"ws_hacker_{uid}@nullroot.net",
        "password": "Password123!",
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register & Login
        await ac.post("/api/auth/register", json=creds)
        login_res = await ac.post("/api/auth/login", json={"email": creds["email"], "password": creds["password"]})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create session
        session_res = await ac.post("/api/game/sessions", headers=headers, json={})
        session_id = session_res.json()["id"]

        with TestClient(app) as client:
            with client.websocket_connect(f"/api/ws/game/{session_id}?token={token}") as ws:
                # Connection established
                conn_msg = ws.receive_json()
                assert conn_msg["type"] == "CONNECTION_ESTABLISHED"

                # Execute debug rewrite
                rewrite_res = await ac.post(
                    "/api/debug/execute",
                    headers=headers,
                    json={"session_id": session_id, "command": "rewrite door_01.permission=root"},
                )
                assert rewrite_res.status_code == 200

                # Verify WebSocket receives broadcasts
                events = [ws.receive_json(), ws.receive_json()]
                event_types = [e["type"] for e in events]
                assert "NULL_CORRUPTION" in event_types
                assert "WORLD_STATE_CHANGED" in event_types

                world_event = next(e for e in events if e["type"] == "WORLD_STATE_CHANGED")
                assert world_event["payload"]["object_id"] == "door_01"
                assert world_event["payload"]["state"]["permission"] == "ROOT"
                assert world_event["payload"]["state"]["locked"] is False

                corrupt_event = next(e for e in events if e["type"] == "NULL_CORRUPTION")
                assert corrupt_event["payload"]["new_level"] == 74
