"""AEROSYNC — Readiness Report Pydantic Models."""

from datetime import datetime
from pydantic import BaseModel, Field


class FleetReadiness(BaseModel):
    total: int = Field(..., ge=0)
    available: int = Field(..., ge=0)
    in_mission: int = Field(default=0, ge=0)
    maintenance: int = Field(default=0, ge=0)
    grounded: int = Field(default=0, ge=0)
    availability_pct: float = Field(..., ge=0.0, le=100.0)


class CrewReadiness(BaseModel):
    total: int = Field(..., ge=0)
    available: int = Field(..., ge=0)
    on_mission: int = Field(default=0, ge=0)
    off_duty: int = Field(default=0, ge=0)
    medical: int = Field(default=0, ge=0)
    availability_pct: float = Field(..., ge=0.0, le=100.0)


class MissionReadiness(BaseModel):
    total: int = Field(..., ge=0)
    active: int = Field(default=0, ge=0)
    scheduled: int = Field(default=0, ge=0)
    critical: int = Field(default=0, ge=0)
    high: int = Field(default=0, ge=0)


from app.models.common import now_utc

class ReadinessReport(BaseModel):
    operational_readiness_pct: int = Field(..., ge=0, le=100)
    status_level: str = "nominal"  # nominal | caution | degraded
    fleet: FleetReadiness
    crew: CrewReadiness
    missions: MissionReadiness
    generated_at: datetime = Field(default_factory=now_utc)
