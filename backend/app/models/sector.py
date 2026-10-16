"""AEROSYNC — Operational Sector Pydantic Models."""

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field


from app.models.common import now_utc

SectorStatus = Literal["active", "restricted", "closed"]
SectorRiskLevel = Literal["low", "medium", "high", "critical"]


class SectorBase(BaseModel):
    code: str = Field(..., max_length=16, description="Identifier, e.g. SEC-A")
    name: str = Field(..., max_length=80)
    boundary: dict[str, Any] = Field(..., description="GeoJSON Polygon")
    status: SectorStatus = "active"
    risk_level: SectorRiskLevel = "low"
    notes: Optional[str] = None


class SectorCreate(SectorBase):
    pass


class Sector(SectorBase):
    id: UUID
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}
