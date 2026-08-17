import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


async def create_authenticated_client():
    uid = uuid.uuid4().hex[:8]
    creds = {
        "username": f"session_runner_{uid}",
        "email": f"runner_{uid}@nullroot.net",
        "password": "Password123!",
    }
    transport = ASGITransport(app=app)
    ac = AsyncClient(transport=transport, base_url="http://test")
    # Register
    await ac.post("/api/auth/register", json=creds)
    # Login
    login_res = await ac.post("/api/auth/login", json={"email": creds["email"], "password": creds["password"]})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return ac, headers


@pytest.mark.asyncio
async def test_create_and_reconstruct_game_session():
    ac, headers = await create_authenticated_client()
    try:
        # 1. Create Session
        create_res = await ac.post("/api/game/sessions", headers=headers, json={})
        assert create_res.status_code == 201
        data = create_res.json()

        # Check default values
        assert data["current_chapter"] == 1
        assert data["current_sector"] == "sector_01"
        assert data["system_integrity"] == 100
        assert data["corruption_level"] == 20
        assert data["debug_energy"] == 100
        assert data["is_active"] is True

        # Check initial world objects
        world_objects = data["world_objects"]
        assert "door_01" in world_objects
        assert world_objects["door_01"]["locked"] is True
        assert world_objects["door_01"]["permission"] == "USER"

        assert "terminal_01" in world_objects
        assert world_objects["terminal_01"]["active"] is True

        assert "memory_01" in world_objects
        assert world_objects["memory_01"]["discovered"] is False
        assert world_objects["memory_01"]["integrity"] == 100

        session_id = data["id"]

        # 2. List sessions
        list_res = await ac.get("/api/game/sessions", headers=headers)
        assert list_res.status_code == 200
        session_list = list_res.json()
        assert len(session_list) >= 1
        assert any(s["id"] == session_id for s in session_list)

        # 3. Get single session detail (Authoritative Reconstruct)
        get_res = await ac.get(f"/api/game/sessions/{session_id}", headers=headers)
        assert get_res.status_code == 200
        detail = get_res.json()
        assert detail["id"] == session_id
        assert detail["world_objects"]["door_01"]["locked"] is True

    finally:
        await ac.aclose()


@pytest.mark.asyncio
async def test_save_and_load_session_checkpoint():
    ac, headers = await create_authenticated_client()
    try:
        # 1. Create session
        create_res = await ac.post("/api/game/sessions", headers=headers, json={})
        session_id = create_res.json()["id"]

        # 2. Save session checkpoint in Slot 1
        save_res = await ac.post(
            f"/api/game/sessions/{session_id}/save",
            headers=headers,
            json={
                "save_name": "CHECKPOINT_SECTOR_01_START",
                "slot_number": 1,
            },
        )
        assert save_res.status_code == 200
        save_data = save_res.json()
        assert save_data["slot_number"] == 1
        assert save_data["save_name"] == "CHECKPOINT_SECTOR_01_START"
        assert "world_objects" in save_data["serialized_game_state"]

        # 3. Load checkpoint
        load_res = await ac.post(
            f"/api/game/sessions/{session_id}/load",
            headers=headers,
            json={"slot_number": 1},
        )
        assert load_res.status_code == 200
        loaded_data = load_res.json()
        assert loaded_data["id"] == session_id
        assert loaded_data["current_sector"] == "sector_01"
        assert loaded_data["world_objects"]["door_01"]["permission"] == "USER"

    finally:
        await ac.aclose()


@pytest.mark.asyncio
async def test_delete_game_session():
    ac, headers = await create_authenticated_client()
    try:
        # 1. Create session
        create_res = await ac.post("/api/game/sessions", headers=headers, json={})
        session_id = create_res.json()["id"]

        # 2. Delete session
        del_res = await ac.delete(f"/api/game/sessions/{session_id}", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["status"] == "DELETED"

        # 3. Verify it no longer exists
        get_res = await ac.get(f"/api/game/sessions/{session_id}", headers=headers)
        assert get_res.status_code == 404

    finally:
        await ac.aclose()
