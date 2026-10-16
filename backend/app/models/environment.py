"""AEROSYNC — Weather Conditions & Airspace Restrictions Pydantic Models."""

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field


WeatherConditionType = Literal[
    "clear",
    "scattered-clouds",
    "overcast",
    "light-rain",
    "heavy-rain",
    "thunderstorm",
    "fog",
]

WeatherSeverity = Literal["none", "moderate", "severe"]


from app.models.common import now_utc


class WeatherConditionBase(BaseModel):
    region: str = Field(..., max_length=60)
    sector_id: Optional[UUID] = None
    airport_id: Optional[UUID] = None
    condition: WeatherConditionType
    severity: WeatherSeverity = "none"
    visibility_km: float = Field(..., ge=0.0)
    wind_speed_kts: int = Field(..., ge=0)
    wind_direction_deg: int = Field(..., ge=0, le=360)
    ceiling_ft: int = Field(..., ge=0)
    temperature_c: float
    is_vfr: bool = True
    valid_from: datetime = Field(default_factory=now_utc)
    valid_until: datetime


class WeatherCondition(WeatherConditionBase):
    id: UUID
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}


AirspaceRestrictionType = Literal[
    "weather-hazard",
    "relief-corridor",
    "search-grid",
    "civil-protection-zone",
]

AirspaceRestrictionStatus = Literal[
    "active",
    "pending",
    "expired",
    "lifted",
]


class AirspaceRestrictionBase(BaseModel):
    identifier: str = Field(..., max_length=32, description="NOTAM code, e.g. NOTAM-SEC-D-01")
    name: str = Field(..., max_length=140)
    type: AirspaceRestrictionType
    sector_id: Optional[UUID] = None
    boundary: Optional[dict[str, Any]] = None
    altitude_floor_ft: int = Field(default=0, ge=0)
    altitude_ceiling_ft: int = Field(default=15000, ge=0)
    status: AirspaceRestrictionStatus = "active"
    reason: str
    active_from: datetime = Field(default_factory=now_utc)
    active_until: datetime


class AirspaceRestriction(AirspaceRestrictionBase):
    id: UUID
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}
