import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from starlette.testclient import TestClient
from app.main import app


@pytest.mark.asyncio
async def test_list_memories_and_seed_data():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/memories")
        assert res.status_code == 200
        memories = res.json()
        assert len(memories) >= 3

        keys = [m["memory_key"] for m in memories]
        assert "MEMORY_01.dat" in keys
        assert "MEMORY_07.dat" in keys
        assert "MEMORY_13.dat" in keys

        mem1 = next(m for m in memories if m["memory_key"] == "MEMORY_01.dat")
        assert mem1["title"] == "INITIALIZATION"
        assert mem1["integrity"] == 100.0


@pytest.mark.asyncio
async def test_get_memory_by_key():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test full key
        res = await ac.get("/api/memories/MEMORY_07.dat")
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "DELETION RECORD"
        assert data["integrity"] == 43.0

        # Test normalized alias
        res_alias = await ac.get("/api/memories/memory_13")
        assert res_alias.status_code == 200
        assert res_alias.json()["title"] == "ROOT"
        assert res_alias.json()["integrity"] == 18.0


@pytest.mark.asyncio
async def test_discover_memory_and_websocket_broadcast():
    uid = uuid.uuid4().hex[:8]
    creds = {
        "username": f"mem_hacker_{uid}",
        "email": f"mem_hacker_{uid}@nullroot.net",
        "password": "Password123!",
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Register & Login
        await ac.post("/api/auth/register", json=creds)
        login_res = await ac.post("/api/auth/login", json={"email": creds["email"], "password": creds["password"]})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Discover memory_01
        disc_res = await ac.post("/api/memories/MEMORY_01.dat/discover", headers=headers)
        assert disc_res.status_code == 200
        disc_data = disc_res.json()
        assert disc_data["success"] is True
        assert disc_data["memory"]["title"] == "INITIALIZATION"
        assert "The system was never designed" in disc_data["memory"]["content"]

        # 3. Discover memory_13
        disc_13_res = await ac.post("/api/memories/memory_13/discover", headers=headers)
        assert disc_13_res.status_code == 200
        assert disc_13_res.json()["memory"]["title"] == "ROOT"
        assert "User identity does not match" in disc_13_res.json()["memory"]["content"]
