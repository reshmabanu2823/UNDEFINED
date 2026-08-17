import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


async def create_session_client():
    uid = uuid.uuid4().hex[:8]
    creds = {
        "username": f"hacker_{uid}",
        "email": f"hacker_{uid}@nullroot.net",
        "password": "Password123!",
    }
    transport = ASGITransport(app=app)
    ac = AsyncClient(transport=transport, base_url="http://test")
    # Register & Login
    await ac.post("/api/auth/register", json=creds)
    login_res = await ac.post("/api/auth/login", json={"email": creds["email"], "password": creds["password"]})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Game Session
    session_res = await ac.post("/api/game/sessions", headers=headers, json={})
    session_id = session_res.json()["id"]

    return ac, headers, session_id


@pytest.mark.asyncio
async def test_scan_existing_and_all_objects():
    ac, headers, session_id = await create_session_client()
    try:
        # 1. Scan specific object
        res = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "scan door_01"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["object_id"] == "door_01"
        assert "TYPE: SECURITY_DOOR" in data["message"]
        assert "PERMISSION: USER" in data["message"]

        # 2. Scan all objects
        res_all = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "scan"},
        )
        assert res_all.status_code == 200
        data_all = res_all.json()
        assert data_all["success"] is True
        assert "DETECTED ENTITIES" in data_all["message"]

        # 3. Scan non-existent object
        res_fake = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "scan matrix_glitch_99"},
        )
        assert res_fake.status_code == 200
        data_fake = res_fake.json()
        assert data_fake["success"] is False
        assert data_fake["error_code"] == "OBJECT_NOT_FOUND"

    finally:
        await ac.aclose()


@pytest.mark.asyncio
async def test_rewrite_door_permission_to_root_and_user():
    ac, headers, session_id = await create_session_client()
    try:
        # 1. Rewrite door_01 to ROOT
        res = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "rewrite door_01.permission=root"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["object_id"] == "door_01"
        assert data["property"] == "permission"
        assert data["old_value"] == "USER"
        assert data["new_value"] == "ROOT"
        assert data["state_changed"] is True
        assert data["updated_state"]["locked"] is False
        assert data["updated_state"]["permission"] == "ROOT"

        # 2. Verify authoritative persistence via session detail endpoint
        detail_res = await ac.get(f"/api/game/sessions/{session_id}", headers=headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["world_objects"]["door_01"]["locked"] is False
        assert detail["world_objects"]["door_01"]["permission"] == "ROOT"
        assert detail["corruption_level"] == 74

        # 3. Rewrite door_01 back to USER
        res_user = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "rewrite door_01.permission=user"},
        )
        assert res_user.status_code == 200
        data_user = res_user.json()
        assert data_user["success"] is True
        assert data_user["new_value"] == "USER"
        assert data_user["updated_state"]["locked"] is True

    finally:
        await ac.aclose()


@pytest.mark.asyncio
async def test_invalid_commands_and_security_restrictions():
    ac, headers, session_id = await create_session_client()
    try:
        # 1. Invalid Property
        res_prop = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "rewrite door_01.color=neon_pink"},
        )
        data_prop = res_prop.json()
        assert data_prop["success"] is False
        assert data_prop["error_code"] == "PROPERTY_NOT_MUTABLE"

        # 2. Invalid Value
        res_val = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "rewrite door_01.permission=overlord"},
        )
        data_val = res_val.json()
        assert data_val["success"] is False
        assert data_val["error_code"] == "INVALID_VALUE"

        # 3. Arbitrary Code Injection Attempts
        res_eval = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "eval('1+1')"},
        )
        assert res_eval.json()["success"] is False
        assert res_eval.json()["error_code"] == "INVALID_COMMAND"

        res_sql = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "DROP TABLE users;--"},
        )
        assert res_sql.json()["success"] is False
        assert res_sql.json()["error_code"] == "INVALID_COMMAND"

        # 4. Unauthorized / Nonexistent session
        res_unauth = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": str(uuid.uuid4()), "command": "scan door_01"},
        )
        assert res_unauth.json()["success"] is False
        assert res_unauth.json()["error_code"] == "SESSION_NOT_FOUND"

    finally:
        await ac.aclose()
