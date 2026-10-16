"""AEROSYNC — Aircraft Fleet Pydantic Models."""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field


AircraftModel = Literal[
    "AeroLift M1",
    "AeroLift H2",
    "AeroTransport T1",
    "AeroUtility U1",
]

AircraftType = Literal[
    "Medium utility helicopter",
    "Heavy transport helicopter",
    "Fixed-wing transport",
    "Light utility helicopter",
]

AircraftRole = Literal[
    "transport",
    "medevac",
    "search-and-rescue",
    "disaster-relief",
    "training",
    "standby",
]

AircraftStatus = Literal[
    "available",
    "in-mission",
    "maintenance",
    "grounded",
]


class AircraftBase(BaseModel):
    tail_number: str = Field(..., max_length=24, description="Unique tail number, e.g. AS-LM01")
    model: AircraftModel
    type: AircraftType
    role: AircraftRole
    base_airport_id: Optional[UUID] = None
    current_airport_id: Optional[UUID] = None
    status: AircraftStatus = "available"
    max_range_km: int = Field(..., gt=0)
    max_payload_kg: int = Field(..., gt=0)
    max_passengers: int = Field(..., ge=0)
    cruise_speed_kmh: int = Field(..., gt=0)
    fuel_capacity_liters: int = Field(..., gt=0)
    fuel_level_percent: int = Field(default=100, ge=0, le=100)
    flight_hours: float = Field(default=0.0, ge=0.0)
    last_maintenance_date: Optional[datetime] = None
    next_maintenance_due: Optional[datetime] = None


class AircraftCreate(AircraftBase):
    pass


class AircraftUpdate(BaseModel):
    status: Optional[AircraftStatus] = None
    current_airport_id: Optional[UUID] = None
    fuel_level_percent: Optional[int] = Field(None, ge=0, le=100)
    flight_hours: Optional[float] = Field(None, ge=0.0)
    next_maintenance_due: Optional[datetime] = None


from app.models.common import now_utc

class Aircraft(AircraftBase):
    id: UUID
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}
