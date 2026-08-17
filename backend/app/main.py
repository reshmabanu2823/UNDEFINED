from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import init_db
from app.utils.logger import logger
from app.routers import (
    health_router,
    auth_router,
    game_router,
    debug_router,
    ws_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Sequence
    logger.info("Initializing NULL//ROOT Core Operating System Kernel...")
    logger.info(f"Environment: {settings.ENVIRONMENT} | Debug: {settings.DEBUG}")
    try:
        await init_db()
        logger.info("Database schema initialized and verified.")
    except Exception as e:
        logger.error(f"Database initialization warning: {e}")
    yield
    # Shutdown Sequence
    logger.info("Terminating NULL//ROOT Backend Process...")


# FastAPI Application instance
app = FastAPI(
    title="NULL//ROOT Game API",
    description="Backend Neural Engine & World State Synchronization API for NULL//ROOT",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS Configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Centralized Exception Handlers (Cyberpunk styled error diagnostics)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"HTTP {exc.status_code} on {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "SYSTEM_EXCEPTION",
            "status_code": exc.status_code,
            "message": exc.detail,
            "path": request.url.path,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Schema Validation Error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "MALFORMED_PACKET_PAYLOAD",
            "status_code": 422,
            "message": "Input validation failed against security schema.",
            "details": exc.errors(),
            "path": request.url.path,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.critical(f"FATAL KERNEL PANIC on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "CRITICAL_KERNEL_PANIC",
            "status_code": 500,
            "message": "An unhandled neural execution failure occurred.",
            "path": request.url.path,
        },
    )


# Include API Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(game_router)
app.include_router(debug_router)
app.include_router(ws_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "system": "NULL//ROOT KERNEL",
        "status": "ONLINE",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else "DISABLED",
    }
