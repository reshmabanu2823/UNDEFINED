import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_list_initial_quest_and_seed_objectives():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/quests")
        assert res.status_code == 200
        quests = res.json()
        assert len(quests) >= 1

        q = next(quest for quest in quests if quest["quest_key"] == "ACCESS_SECTOR_02")
        assert q["title"] == "Access Sector 02"
        assert len(q["objectives"]) == 4

        obj_labels = [o["label"] for o in q["objectives"]]
        assert "Find terminal_01" in obj_labels
        assert "Access door_01" in obj_labels
        assert "Gain ROOT permission" in obj_labels
        assert "Enter Sector 02" in obj_labels


@pytest.mark.asyncio
async def test_get_quest_by_key():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/quests/ACCESS_SECTOR_02")
        assert res.status_code == 200
        data = res.json()
        assert data["quest_key"] == "ACCESS_SECTOR_02"
        assert data["title"] == "Access Sector 02"


@pytest.mark.asyncio
async def test_quest_progression_via_debug_commands_and_events():
    uid = uuid.uuid4().hex[:8]
    creds = {
        "username": f"quest_op_{uid}",
        "email": f"quest_op_{uid}@nullroot.net",
        "password": "Password123!",
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Register & Login
        await ac.post("/api/auth/register", json=creds)
        login_res = await ac.post("/api/auth/login", json={"email": creds["email"], "password": creds["password"]})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create session
        session_res = await ac.post("/api/game/sessions", headers=headers, json={})
        session_id = session_res.json()["id"]

        # 3. Step 1: Scan terminal_01 -> Completes "Find terminal_01"
        scan_term = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "scan terminal_01"},
        )
        assert scan_term.status_code == 200

        q_state_1 = await ac.get("/api/quests/ACCESS_SECTOR_02", headers=headers)
        objs_1 = {o["id"]: o["status"] for o in q_state_1.json()["objectives"]}
        assert objs_1["FIND_TERMINAL_01"] == "COMPLETED"

        # 4. Step 2: Scan door_01 -> Completes "Access door_01"
        scan_door = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "scan door_01"},
        )
        assert scan_door.status_code == 200

        q_state_2 = await ac.get("/api/quests/ACCESS_SECTOR_02", headers=headers)
        objs_2 = {o["id"]: o["status"] for o in q_state_2.json()["objectives"]}
        assert objs_2["ACCESS_DOOR_01"] == "COMPLETED"

        # 5. Step 3: Rewrite door_01 permission to root -> Completes "Gain ROOT permission"
        rewrite_root = await ac.post(
            "/api/debug/execute",
            headers=headers,
            json={"session_id": session_id, "command": "rewrite door_01.permission=root"},
        )
        assert rewrite_root.status_code == 200

        q_state_3 = await ac.get("/api/quests/ACCESS_SECTOR_02", headers=headers)
        objs_3 = {o["id"]: o["status"] for o in q_state_3.json()["objectives"]}
        assert objs_3["GAIN_ROOT_PERMISSION"] == "COMPLETED"
        assert objs_3["ENTER_SECTOR_02"] in ["IN_PROGRESS", "CORRUPTED"]

        # 6. Step 4: Advance "ENTER_SECTOR_02" -> Completes Quest
        advance_res = await ac.post(
            "/api/quests/ACCESS_SECTOR_02/progress",
            headers=headers,
            json={"objective_id": "ENTER_SECTOR_02"},
        )
        assert advance_res.status_code == 200
        assert advance_res.json()["status"] == "COMPLETED"
        assert advance_res.json()["progress_percent"] == 100.0
