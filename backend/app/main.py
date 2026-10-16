"""AEROSYNC Backend — FastAPI Application Entry Point.

Intelligence for Dynamic Air Operations — Production-ready decision-support API.
"""

from contextlib import asynccontextmanager
import logging
from typing import Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.supabase import get_anon_client, get_service_client, is_supabase_configured
from app.db.repository import repository
from app.routers import (
    aircraft,
    crew,
    missions,
    environment,
    readiness,
    events,
    simulation,
    optimization,
    ai,
)

logger = logging.getLogger("aerosync.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: validates production configuration at startup."""
    issues = settings.validate_production_configuration(raise_error=settings.is_production)
    if issues:
        logger.warning("Configuration issues detected at startup: %s", issues)
    logger.info(
        "AEROSYNC API initialized | Env: %s | Auth Enforced: %s | Supabase Configured: %s",
        settings.app_env,
        settings.is_auth_enforced,
        is_supabase_configured(),
    )
    yield
    logger.info("AEROSYNC API shutting down.")


app = FastAPI(
    title="AEROSYNC API",
    description="Intelligence for Dynamic Air Operations — Decision Support Backend",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — strict origin matching with credential support
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Operational Routers
app.include_router(aircraft.router)
app.include_router(crew.router)
app.include_router(missions.router)
app.include_router(environment.router)
app.include_router(readiness.router)
app.include_router(events.router)

# Decision Engine Routers
app.include_router(simulation.router)
app.include_router(optimization.router)
app.include_router(ai.router)


@app.get("/", status_code=status.HTTP_200_OK)
async def root() -> dict[str, str]:
    """Basic liveness probe."""
    return {"status": "ok", "service": "aerosync-api", "version": "0.1.0"}


@app.get("/api/health", status_code=status.HTTP_200_OK)
async def health() -> dict[str, Any]:
    """Detailed health, dependency reachability, and telemetry diagnostic."""
    supabase_active = is_supabase_configured()
    db_connected = True
    db_error: str | None = None

    if supabase_active:
        client = get_anon_client() or get_service_client()
        try:
            if client:
                client.table("airports").select("id").limit(1).execute()
        except Exception as exc:
            db_connected = False
            db_error = str(exc)

    config_issues = settings.validate_production_configuration()

    # Determine overall service status
    is_degraded = False
    if settings.is_production:
        if not supabase_active or not db_connected or config_issues:
            is_degraded = True
    elif supabase_active and not db_connected:
        is_degraded = True

    overall_status = "degraded" if is_degraded else "ok"

    try:
        airports_count = len(repository.get_airports())
        aircraft_count = len(repository.get_aircraft())
        crew_count = len(repository.get_crew())
        missions_count = len(repository.get_missions())
    except Exception:
        airports_count = aircraft_count = crew_count = missions_count = 0

    return {
        "status": overall_status,
        "service": "aerosync-api",
        "version": "0.1.0",
        "environment": settings.app_env,
        "auth_enforced": settings.is_auth_enforced,
        "database": {
            "mode": "supabase" if supabase_active else "mock_store",
            "supabase_configured": supabase_active,
            "connected": db_connected,
            "error": db_error,
            "airports_loaded": airports_count,
            "aircraft_loaded": aircraft_count,
            "crew_loaded": crew_count,
            "missions_loaded": missions_count,
        },
        "ai_layer": {
            "provider": "gemini",
            "model": settings.gemini_model,
            "api_key_configured": bool(settings.gemini_api_key),
        },
        "config_issues": config_issues,
    }


@app.get("/api/ready", status_code=status.HTTP_200_OK)
async def readiness_probe() -> dict[str, Any]:
    """Readiness probe for deployment orchestrators."""
    if settings.is_production:
        if not is_supabase_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unconfigured in production environment.",
            )
        client = get_anon_client() or get_service_client()
        try:
            if client:
                client.table("airports").select("id").limit(1).execute()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Database unreachable in production: {str(exc)}",
            )

    return {"ready": True, "environment": settings.app_env, "service": "aerosync-api"}
