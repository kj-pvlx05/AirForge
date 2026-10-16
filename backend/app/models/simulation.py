"""AEROSYNC — Simulation Event & State Mutation Models (Phase 6)."""

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, model_validator
from app.models.common import now_utc


ScenarioType = Literal[
    "weather_deterioration",
    "aircraft_unavailable",
    "crew_unavailable",
    "airspace_restriction",
    "new_high_priority_task",
    "maintenance_delay",
]

SimulationStatus = Literal["pending", "processing", "completed", "failed", "applied"]


class OperationalSnapshot(BaseModel):
    aircraft_total: int = 0
    aircraft_available: int = 0
    crew_total: int = 0
    crew_available: int = 0
    missions_active: int = 0
    readiness_score: float = Field(default=0.0, ge=0.0, le=1.0)
    details: dict[str, Any] = Field(default_factory=dict)


class SimulationScenarioRequest(BaseModel):
    scenario: str = "weather_deterioration"
    target_id: str = "SEC-B"
    parameters: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def handle_field_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "scenario_type" in data and "scenario" not in data:
                data["scenario"] = data["scenario_type"]
            if "target" in data and "target_id" not in data:
                data["target_id"] = data["target"]
        return data


# --- Detailed Impact Models ---

class ImpactedSector(BaseModel):
    id: UUID
    code: str
    name: str
    risk_before: str
    risk_after: str
    weather_condition_before: str
    weather_condition_after: str
    ceiling_ft_before: int
    ceiling_ft_after: int
    visibility_km_before: float
    visibility_km_after: float
    wind_kts_before: int
    wind_kts_after: int


class ImpactedAircraft(BaseModel):
    id: UUID
    tail_number: str
    model: str
    status_before: str
    status_after: str
    reason: str


class ImpactedMission(BaseModel):
    id: UUID
    code: str
    title: str
    priority: str
    assigned_aircraft_id: Optional[UUID] = None
    assigned_aircraft_tail: Optional[str] = None
    origin_code: str
    destination_code: str
    impact_reason: str


class ImpactedRoute(BaseModel):
    mission_code: str
    origin_code: str
    destination_code: str
    sector_code: str
    status: str


class SimulationImpact(BaseModel):
    affected_sectors: list[ImpactedSector] = Field(default_factory=list)
    affected_aircraft: list[ImpactedAircraft] = Field(default_factory=list)
    affected_missions: list[ImpactedMission] = Field(default_factory=list)
    affected_routes: list[ImpactedRoute] = Field(default_factory=list)
    summary: dict[str, Any] = Field(default_factory=dict)


class SimulationEventBase(BaseModel):
    scenario_type: ScenarioType
    title: str = Field(..., max_length=200)
    description: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    state_before: OperationalSnapshot = Field(default_factory=OperationalSnapshot)
    state_after: OperationalSnapshot = Field(default_factory=OperationalSnapshot)
    affected_aircraft_ids: list[UUID] = Field(default_factory=list)
    affected_crew_ids: list[UUID] = Field(default_factory=list)
    affected_mission_ids: list[UUID] = Field(default_factory=list)
    status: SimulationStatus = "completed"


class SimulationEventCreate(BaseModel):
    scenario_type: ScenarioType
    title: Optional[str] = None
    parameters: dict[str, Any] = Field(default_factory=dict)


class SimulationEvent(SimulationEventBase):
    id: UUID = Field(default_factory=uuid4)
    triggered_at: datetime = Field(default_factory=now_utc)
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}


class SimulationResult(BaseModel):
    event_id: UUID
    scenario: str
    target: str
    status: str = "applied"
    state_before: dict[str, Any]
    event: dict[str, Any]
    state_after: dict[str, Any]
    impact: SimulationImpact
    created_at: datetime = Field(default_factory=now_utc)
