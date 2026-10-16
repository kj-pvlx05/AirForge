"""AEROSYNC — Optimization Run, Result & Allocation Pydantic Models (Phase 7: OR-Tools CP-SAT)."""

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field
from app.models.common import now_utc


SolverStatus = Literal[
    "OPTIMAL",
    "FEASIBLE",
    "INFEASIBLE",
    "MODEL_INVALID",
    "UNKNOWN",
]

RecommendationActionType = Literal[
    "reallocate_aircraft",
    "reroute_mission",
    "standby_deployment",
    "delay_task",
]

RecommendationStatus = Literal[
    "pending_review",
    "approved",
    "dismissed",
    "applied",
]


class Allocation(BaseModel):
    """Structured feasible allocation of aircraft and crew to an operational mission."""
    mission_id: UUID
    mission_code: str
    aircraft_id: UUID
    aircraft_tail: str
    crew_ids: list[UUID] = Field(default_factory=list)
    crew_codes: list[str] = Field(default_factory=list)
    reason: str
    origin_airport_id: Optional[UUID] = None
    destination_airport_id: Optional[UUID] = None
    corridor: Optional[str] = "Direct Track"
    action_type: str = "reallocate_aircraft"
    score: float = 1.0
    notes: Optional[str] = None


# Backwards compatibility alias
MissionAllocation = Allocation


class UnresolvedMission(BaseModel):
    """Operational mission that could not be feasibly assigned under current hard constraints."""
    mission_id: UUID
    mission_code: str
    priority: str
    reason: str
    unmet_constraints: list[str] = Field(default_factory=list)


class ConstraintSummary(BaseModel):
    """Auditable constraint verification summary for deterministic solver transparency."""
    hard_constraints_satisfied: bool = True
    violations: list[str] = Field(default_factory=list)
    constraints_enforced: list[str] = Field(default_factory=list)
    soft_objectives_optimized: list[str] = Field(default_factory=list)


class OptimizationMetrics(BaseModel):
    """Quantitative performance and fleet impact metrics for an optimization solve."""
    missions_total: int = Field(default=0, ge=0)
    missions_affected: int = Field(default=0, ge=0)
    missions_covered: int = Field(default=0, ge=0)
    missions_unresolved: int = Field(default=0, ge=0)
    aircraft_reassigned: int = Field(default=0, ge=0)
    missions_rerouted: int = Field(default=0, ge=0)
    resource_utilization_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    solve_time_ms: int = Field(default=0, ge=0)


class ReassignmentDetail(BaseModel):
    """Detailed comparison between previous and recommended airframe allocation."""
    mission_id: UUID
    mission_code: str
    mission_title: str
    priority: str
    origin_code: str
    destination_code: str
    previous_aircraft_id: Optional[UUID] = None
    previous_aircraft_tail: Optional[str] = None
    previous_aircraft_model: Optional[str] = None
    recommended_aircraft_id: UUID
    recommended_aircraft_tail: str
    recommended_aircraft_model: str
    original_corridor: str
    recommended_corridor: str
    action_type: str = "reallocate_aircraft"
    reason: str


class OptimizationRequest(BaseModel):
    """Input payload for triggering OR-Tools CP-SAT optimization engine."""
    mission_ids: Optional[list[UUID]] = None
    scenario_event_id: Optional[UUID] = None
    event_id: Optional[UUID] = None  # Alias for scenario_event_id
    trigger_reason: str = "operational_state_optimization"
    force_recompute: bool = False
    allow_rerouting: bool = True
    max_solve_time_seconds: float = 2.0


# Backwards compatibility alias
OptimizationSolveRequest = OptimizationRequest


class OptimizationRunBase(BaseModel):
    simulation_event_id: Optional[UUID] = None
    trigger_reason: str
    solver_status: SolverStatus = "UNKNOWN"
    objective_value: Optional[float] = None
    solve_time_ms: int = Field(default=0, ge=0)
    total_missions: int = Field(default=0, ge=0)
    assigned_missions: int = Field(default=0, ge=0)
    unassigned_missions: int = Field(default=0, ge=0)
    constraints_applied: list[str] = Field(default_factory=list)
    constraint_violations_avoided: list[str] = Field(default_factory=list)
    raw_result: dict[str, Any] = Field(default_factory=dict)


class OptimizationRunCreate(BaseModel):
    simulation_event_id: Optional[UUID] = None
    trigger_reason: str
    excluded_aircraft_ids: list[UUID] = Field(default_factory=list)
    excluded_sector_ids: list[UUID] = Field(default_factory=list)
    excluded_crew_ids: list[UUID] = Field(default_factory=list)


class OptimizationRun(OptimizationRunBase):
    id: UUID
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}


class RecommendationBase(BaseModel):
    optimization_run_id: UUID
    simulation_event_id: Optional[UUID] = None
    title: str = Field(..., max_length=200)
    summary: str
    action_type: RecommendationActionType
    allocations: list[Allocation] = Field(default_factory=list)
    impact_summary: dict[str, Any] = Field(default_factory=dict)
    ai_explanation: Optional[str] = None
    status: RecommendationStatus = "pending_review"


class Recommendation(RecommendationBase):
    id: UUID
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}


class OptimizationResult(BaseModel):
    """Complete, immutable output from the OR-Tools CP-SAT optimization engine."""
    run_id: UUID
    recommendation_id: Optional[UUID] = None
    status: str = "optimal"
    solver_status: SolverStatus = "OPTIMAL"
    objective_score: float = 0.0
    objective_value: float = 0.0
    solve_time_ms: int = 0
    total_missions: int = 0
    assigned_missions: int = 0
    unassigned_missions: int = 0
    reassignments_count: int = 0
    rerouted_count: int = 0
    allocations: list[Allocation] = Field(default_factory=list)
    unresolved_missions: list[UnresolvedMission] = Field(default_factory=list)
    metrics: OptimizationMetrics
    constraints: ConstraintSummary
    reassignments: list[ReassignmentDetail] = Field(default_factory=list)
    recommendation: Optional[Recommendation] = None
    created_at: datetime = Field(default_factory=now_utc)


# Backwards compatibility alias
OptimizationSolveResponse = OptimizationResult


class ApplyRecommendationResponse(BaseModel):
    status: str
    message: str
    recommendation_id: UUID
    applied_allocations_count: int
    updated_missions: list[str] = Field(default_factory=list)
    applied_at: datetime = Field(default_factory=now_utc)
