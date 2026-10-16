"""AEROSYNC — Mission & Task Pydantic Models."""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field


MissionType = Literal[
    "disaster-relief",
    "medevac",
    "transport",
    "search-and-rescue",
    "training",
    "standby",
]

MissionPriority = Literal["critical", "high", "medium", "low"]

MissionStatus = Literal[
    "scheduled",
    "active",
    "completed",
    "cancelled",
    "reassigned",
]


class MissionBase(BaseModel):
    code: str = Field(..., max_length=32, description="Mission code, e.g. MSN-2026-01")
    title: str = Field(..., max_length=200)
    type: MissionType
    priority: MissionPriority = "medium"
    status: MissionStatus = "scheduled"
    origin_airport_id: UUID
    destination_airport_id: UUID
    sector_id: Optional[UUID] = None
    assigned_aircraft_id: Optional[UUID] = None
    required_aircraft_model: Optional[str] = None
    required_crew_composition: dict[str, int] = Field(default_factory=dict)
    passenger_count: int = Field(default=0, ge=0)
    cargo_weight_kg: float = Field(default=0.0, ge=0.0)
    urgency_score: int = Field(default=50, ge=1, le=100)
    scheduled_start: datetime
    scheduled_end: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    notes: Optional[str] = None


class MissionCreate(MissionBase):
    pass


class MissionUpdate(BaseModel):
    status: Optional[MissionStatus] = None
    assigned_aircraft_id: Optional[UUID] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    notes: Optional[str] = None


from app.models.common import now_utc

class Mission(MissionBase):
    id: UUID
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}


class MissionCrewAssignment(BaseModel):
    id: UUID
    mission_id: UUID
    crew_id: UUID
    role_on_mission: str
    assigned_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}
