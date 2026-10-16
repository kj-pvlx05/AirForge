"""AEROSYNC — Maintenance Record Pydantic Models."""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field


MaintenanceType = Literal[
    "scheduled",
    "unscheduled",
    "avionics-check",
    "airframe-inspection",
    "engine-overhaul",
]

MaintenanceStatus = Literal[
    "scheduled",
    "in-progress",
    "completed",
    "delayed",
]


class MaintenanceRecordBase(BaseModel):
    aircraft_id: UUID
    type: MaintenanceType
    description: str
    status: MaintenanceStatus = "scheduled"
    scheduled_start: datetime
    scheduled_end: datetime
    actual_end: Optional[datetime] = None
    technician_notes: Optional[str] = None


class MaintenanceRecordCreate(MaintenanceRecordBase):
    pass


from app.models.common import now_utc

class MaintenanceRecord(MaintenanceRecordBase):
    id: UUID
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}
