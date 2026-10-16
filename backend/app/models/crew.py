"""AEROSYNC — Crew & Personnel Pydantic Models."""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field


CrewRole = Literal[
    "pilot",
    "co-pilot",
    "flight-engineer",
    "flight-medic",
    "loadmaster",
    "operations-observer",
]

CrewStatus = Literal[
    "available",
    "on-mission",
    "off-duty",
    "medical",
]


class CrewBase(BaseModel):
    code: str = Field(..., max_length=24, description="Unique personnel code, e.g. CRW-P01")
    name: str = Field(..., max_length=100)
    role: CrewRole
    rank: str = Field(..., max_length=32)
    base_airport_id: Optional[UUID] = None
    status: CrewStatus = "available"
    qualifications: list[str] = Field(default_factory=list)
    max_duty_hours: float = Field(default=12.0, gt=0.0)
    current_duty_hours: float = Field(default=0.0, ge=0.0)
    rest_period_hours: float = Field(default=10.0, ge=0.0)


class CrewCreate(CrewBase):
    pass


class CrewUpdate(BaseModel):
    status: Optional[CrewStatus] = None
    base_airport_id: Optional[UUID] = None
    current_duty_hours: Optional[float] = Field(None, ge=0.0)
    qualifications: Optional[list[str]] = None


from app.models.common import now_utc

class Crew(CrewBase):
    id: UUID
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}
