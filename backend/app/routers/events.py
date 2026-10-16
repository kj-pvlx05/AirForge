"""AEROSYNC — System Events & Activity Log Endpoints."""

from typing import Optional
from fastapi import APIRouter, Query, status
from app.models import Event
from app.services import event_service

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.get("", response_model=list[Event], status_code=status.HTTP_200_OK)
async def list_events(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of events to return"),
    category: Optional[str] = Query(None, description="Filter by event category"),
    event_type: Optional[str] = Query(None, alias="type", description="Filter by event severity/type"),
) -> list[Event]:
    """Retrieve operational event timeline feed."""
    return event_service.list_events(limit=limit, category=category, event_type=event_type)
