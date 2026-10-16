"""AEROSYNC — Airport / Air Base Pydantic Models."""

from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field


from app.models.common import now_utc

AirportStatus = Literal["operational", "degraded", "closed"]


class AirportBase(BaseModel):
    code: str = Field(..., max_length=16, description="Identifier, e.g. SYN-ALPHA")
    name: str = Field(..., max_length=120)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    elevation_ft: int = Field(default=0, ge=-1000)
    runway_length_m: int = Field(default=1500, gt=0)
    status: AirportStatus = "operational"
    region: str = Field(..., max_length=60)
    fuel_available: bool = True


class AirportCreate(AirportBase):
    pass


class Airport(AirportBase):
    id: UUID
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}
