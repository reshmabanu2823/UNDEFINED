# NULL//ROOT Backend Service

Production-quality FastAPI backend service and neural synchronization engine for the **UNDEFINED (NULL//ROOT)** cyberpunk psychological puzzle game.

---

## Tech Stack

- **Runtime**: Python 3.12+ (tested on Python 3.13)
- **Framework**: FastAPI (Async ASGI)
- **Server**: Uvicorn
- **Database / ORM**: SQLAlchemy 2.x (Asyncio Engine)
- **Database Support**: PostgreSQL (Production) / Async SQLite (Development)
- **Migrations**: Alembic
- **Validation**: Pydantic v2 & Pydantic Settings
- **Authentication**: JWT (PyJWT / Cryptography) + Passlib / Bcrypt
- **Real-time Engine**: WebSockets

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py                     # FastAPI app instance, CORS & exception handlers
│   ├── config.py                   # Pydantic Settings & environment variables
│   ├── database.py                 # Async SQLAlchemy 2.0 engine & session dependency
│   ├── models/                     # SQLAlchemy ORM models (User, GameSave, WorldSession)
│   ├── schemas/                    # Pydantic request/response validation schemas
│   ├── routers/                    # Modular API route controllers (health, auth, game, debug, ws)
│   ├── services/                   # Business logic (auth_service, game_service)
│   ├── game_engine/                # Authoritative sector state management
│   ├── debug_engine/               # Safe local debug command executor
│   ├── websocket/                  # Live connection & telemetry manager
│   └── utils/                      # Structured logging & security hashing
├── alembic/                        # Database migration scripts
├── tests/                          # Automated Pytest suite
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment template
├── .env                            # Local configuration
└── README.md
```

---

## Startup Instructions

### 1. Create and Activate a Python Virtual Environment

**Windows (PowerShell)**:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS**:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Development Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## Database Setup & Configuration

The backend is configured out-of-the-box to use an async SQLite database (`null_root.db`) for immediate zero-config local development, and seamlessly switches to PostgreSQL for production.

### Using PostgreSQL

1. Create a database in PostgreSQL:
   ```sql
   CREATE DATABASE null_root;
   ```
2. Update `backend/.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/null_root
   ```
3. Run Alembic migrations:
   ```bash
   alembic upgrade head
   ```

### Creating New Migrations

```bash
alembic revision --autogenerate -m "create_initial_tables"
alembic upgrade head
```

---

## Environment Variables Documentation

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | `string` | `development` | Application environment (`development`, `staging`, `production`) |
| `DEBUG` | `bool` | `True` | Enables Swagger UI (`/docs`) and verbose SQL logging |
| `HOST` | `string` | `0.0.0.0` | Bind host address |
| `PORT` | `int` | `8000` | Port number for Uvicorn |
| `DATABASE_URL` | `string` | `sqlite+aiosqlite:///./null_root.db` | Async connection string (PostgreSQL or SQLite) |
| `JWT_SECRET` | `string` | `null_root_secret_key_...` | Cryptographic secret for signing JWT access tokens |
| `JWT_ALGORITHM` | `string` | `HS256` | Token signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `int` | `1440` | Token expiration duration in minutes (24 hours) |
| `CORS_ORIGINS` | `list[str]` | `["http://localhost:5173", ...]` | Allowed CORS origins for the React/Vite frontend |

---

## API Endpoints Reference

### Health
- `GET /api/health` &rarr; Returns `{"status": "ok", "service": "null-root-backend"}`

### Authentication
- `POST /api/auth/register` &rarr; Create operator credentials
- `POST /api/auth/login` &rarr; Authenticate and receive JWT bearer token
- `GET /api/auth/me` &rarr; Fetch authenticated user profile

### Game & Checkpoint Saves
- `POST /api/game/save` &rarr; Create or update a game checkpoint
- `GET /api/game/saves` &rarr; List all user save slots
- `GET /api/game/saves/{slot_index}` &rarr; Load specific checkpoint slot
- `POST /api/game/sync/{session_id}` &rarr; Synchronize live sector state

### Debug Engine
- `POST /api/debug/execute` &rarr; Execute terminal instructions (`scan door_01`, `rewrite door_01.permission=root`)

### Real-Time Telemetry
- `WS /api/ws/telemetry` &rarr; Real-time WebSocket connection for multiplayer state

---

## Running Tests

```bash
pytest tests/ -v
```
