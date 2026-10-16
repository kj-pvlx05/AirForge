"""AEROSYNC — Aircraft Endpoints."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status
from app.models import Aircraft
from app.services import aircraft_service

router = APIRouter(prefix="/api/aircraft", tags=["Aircraft"])


@router.get("", response_model=list[Aircraft], status_code=status.HTTP_200_OK)
async def list_aircraft(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by operational status"),
    role: Optional[str] = Query(None, description="Filter by primary role"),
    base_airport_id: Optional[UUID] = Query(None, description="Filter by home air station"),
) -> list[Aircraft]:
    """Retrieve operational aircraft fleet with optional filtering."""
    return aircraft_service.list_aircraft(status=status_filter, role=role, base_airport_id=base_airport_id)


@router.get("/{aircraft_id}", response_model=Aircraft, status_code=status.HTTP_200_OK)
async def get_aircraft(aircraft_id: UUID) -> Aircraft:
    """Retrieve a specific aircraft by its unique identifier."""
    ac = aircraft_service.get_aircraft(aircraft_id)
    if not ac:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aircraft with ID '{aircraft_id}' not found.",
        )
    return ac
