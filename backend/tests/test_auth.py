import uuid
from datetime import timedelta
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.utils.security import create_access_token


def get_unique_credentials():
    uid = uuid.uuid4().hex[:8]
    return {
        "username": f"user_{uid}",
        "email": f"operator_{uid}@nullroot.net",
        "password": "Password123!",
    }


@pytest.mark.asyncio
async def test_registration_success():
    creds = get_unique_credentials()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/register",
            json=creds,
        )

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == creds["username"]
    assert data["email"] == creds["email"]
    assert "password" not in data
    assert "password_hash" not in data
    assert "id" in data


@pytest.mark.asyncio
async def test_registration_duplicate_username():
    creds = get_unique_credentials()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # First registration
        await ac.post(
            "/api/auth/register",
            json=creds,
        )
        # Duplicate username attempt
        response = await ac.post(
            "/api/auth/register",
            json={
                "username": creds["username"],
                "email": f"different_{uuid.uuid4().hex[:6]}@nullroot.net",
                "password": "Password123!",
            },
        )

    assert response.status_code == 400
    assert "USERNAME_TAKEN" in response.json()["message"]


@pytest.mark.asyncio
async def test_registration_duplicate_email():
    creds = get_unique_credentials()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # First registration
        await ac.post(
            "/api/auth/register",
            json=creds,
        )
        # Duplicate email attempt
        response = await ac.post(
            "/api/auth/register",
            json={
                "username": f"different_{uuid.uuid4().hex[:6]}",
                "email": creds["email"],
                "password": "Password123!",
            },
        )

    assert response.status_code == 400
    assert "EMAIL_TAKEN" in response.json()["message"]


@pytest.mark.asyncio
async def test_registration_invalid_password():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/register",
            json={
                "username": f"short_{uuid.uuid4().hex[:6]}",
                "email": f"short_{uuid.uuid4().hex[:6]}@nullroot.net",
                "password": "123",  # Too short
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success():
    creds = get_unique_credentials()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register user
        await ac.post(
            "/api/auth/register",
            json=creds,
        )
        # Login with email
        response = await ac.post(
            "/api/auth/login",
            json={
                "email": creds["email"],
                "password": creds["password"],
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password():
    creds = get_unique_credentials()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register
        await ac.post(
            "/api/auth/register",
            json=creds,
        )
        # Attempt login with wrong password
        response = await ac.post(
            "/api/auth/login",
            json={
                "email": creds["email"],
                "password": "IncorrectPassword999!",
            },
        )

    assert response.status_code == 401
    assert "INVALID_CREDENTIALS" in response.json()["message"]


@pytest.mark.asyncio
async def test_login_nonexistent_user():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/login",
            json={
                "email": f"ghost_{uuid.uuid4().hex[:6]}@nullroot.net",
                "password": "SomePassword123!",
            },
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_with_valid_token():
    creds = get_unique_credentials()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register and login
        await ac.post(
            "/api/auth/register",
            json=creds,
        )
        login_res = await ac.post(
            "/api/auth/login",
            json={
                "email": creds["email"],
                "password": creds["password"],
            },
        )
        token = login_res.json()["access_token"]

        # Call protected route /api/auth/me
        me_res = await ac.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert me_res.status_code == 200
    data = me_res.json()
    assert data["username"] == creds["username"]
    assert data["email"] == creds["email"]
    assert data["profile"]["display_name"] == creds["username"]
    assert data["profile"]["system_integrity"] == 100


@pytest.mark.asyncio
async def test_protected_route_without_token():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/auth/me")

    assert response.status_code == 401
    assert "AUTH_REQUIRED" in response.json()["message"]


@pytest.mark.asyncio
async def test_protected_route_with_invalid_token():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer corrupted_invalid_token_xyz_000"},
        )

    assert response.status_code == 401
    assert "INVALID_TOKEN" in response.json()["message"]


@pytest.mark.asyncio
async def test_protected_route_with_expired_token():
    transport = ASGITransport(app=app)
    # Generate expired token (-1 hour)
    expired_token = create_access_token(
        subject="sample_user_id",
        email="expired@nullroot.net",
        expires_delta=timedelta(hours=-1),
    )

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )

    assert response.status_code == 401
    assert "INVALID_TOKEN" in response.json()["message"]
