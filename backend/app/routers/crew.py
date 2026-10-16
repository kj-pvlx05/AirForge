"""AEROSYNC — Crew & Personnel Endpoints."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status
from app.models import Crew
from app.services import crew_service

router = APIRouter(prefix="/api/crew", tags=["Crew"])


@router.get("", response_model=list[Crew], status_code=status.HTTP_200_OK)
async def list_crew(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by availability status"),
    role: Optional[str] = Query(None, description="Filter by operational role"),
    base_airport_id: Optional[UUID] = Query(None, description="Filter by home air station"),
) -> list[Crew]:
    """Retrieve operational crew roster with optional filtering."""
    return crew_service.list_crew(status=status_filter, role=role, base_airport_id=base_airport_id)


@router.get("/{crew_id}", response_model=Crew, status_code=status.HTTP_200_OK)
async def get_crew(crew_id: UUID) -> Crew:
    """Retrieve a specific crew member by their unique identifier."""
    c = crew_service.get_crew(crew_id)
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crew member with ID '{crew_id}' not found.",
        )
    return c
