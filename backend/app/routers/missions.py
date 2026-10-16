"""AEROSYNC — Mission & Task Endpoints."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status
from app.models import Mission
from app.services import mission_service

router = APIRouter(prefix="/api/missions", tags=["Missions"])


@router.get("", response_model=list[Mission], status_code=status.HTTP_200_OK)
async def list_missions(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by mission status"),
    priority: Optional[str] = Query(None, description="Filter by priority level"),
    mission_type: Optional[str] = Query(None, alias="type", description="Filter by mission type"),
) -> list[Mission]:
    """Retrieve operational mission tasks with optional filtering."""
    return mission_service.list_missions(status=status_filter, priority=priority, mission_type=mission_type)


@router.get("/{mission_id}", response_model=Mission, status_code=status.HTTP_200_OK)
async def get_mission(mission_id: UUID) -> Mission:
    """Retrieve a specific operational mission by its unique identifier."""
    m = mission_service.get_mission(mission_id)
    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission with ID '{mission_id}' not found.",
        )
    return m
