"""AEROSYNC — Environment, Airports & Sectors Endpoints."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status
from app.models import Airport, Sector
from app.services import environment_service, EnvironmentState

router = APIRouter(prefix="/api", tags=["Environment"])


@router.get("/environment", response_model=EnvironmentState, status_code=status.HTTP_200_OK)
async def get_environment_state() -> EnvironmentState:
    """Retrieve aggregated operational environment picture (weather, airspace restrictions, sectors)."""
    return environment_service.get_environment_state()


@router.get("/airports", response_model=list[Airport], status_code=status.HTTP_200_OK)
async def list_airports() -> list[Airport]:
    """Retrieve all operational air stations and forward staging bases."""
    return environment_service.get_airports()


@router.get("/airports/{airport_id}", response_model=Airport, status_code=status.HTTP_200_OK)
async def get_airport(airport_id: UUID) -> Airport:
    """Retrieve a specific air station by unique identifier."""
    airport = environment_service.get_airport(airport_id)
    if not airport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Airport with ID '{airport_id}' not found.",
        )
    return airport


@router.get("/sectors", response_model=list[Sector], status_code=status.HTTP_200_OK)
async def list_sectors() -> list[Sector]:
    """Retrieve all operational airspace sectors with GeoJSON boundaries."""
    return environment_service.get_sectors()


@router.get("/sectors/{sector_id}", response_model=Sector, status_code=status.HTTP_200_OK)
async def get_sector(sector_id: UUID) -> Sector:
    """Retrieve a specific airspace sector by unique identifier."""
    sector = environment_service.get_sector(sector_id)
    if not sector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sector with ID '{sector_id}' not found.",
        )
    return sector
