"""AEROSYNC — Simulation Engine Routers (Phase 6).

Endpoints:
- POST /api/simulation/events : Execute scenario and return complete before/after/impact result (Protected)
- GET /api/simulation/events/{id} : Retrieve previously executed simulation result
- GET /api/simulation/events : List simulation history
- POST /api/simulation/reset : Reset operational state back to seed baseline (Protected & Environment Safeguarded)
"""

from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import OperatorPrincipal, require_privileged_operator, verify_simulation_reset_allowed
from app.models import (
    SimulationEvent,
    SimulationScenarioRequest,
    SimulationResult,
)
from app.services import simulation_service

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])


@router.post("/events", response_model=SimulationResult, status_code=status.HTTP_201_CREATED)
async def trigger_simulation_event(
    payload: SimulationScenarioRequest,
    operator: OperatorPrincipal = Depends(require_privileged_operator),
) -> SimulationResult:
    """Execute a deterministic simulation scenario and return structured state transitions."""
    try:
        return simulation_service.execute_scenario(payload)
    except ValueError as err:
        err_msg = str(err)
        if "not found" in err_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)


@router.post("/events/inject", response_model=SimulationResult, status_code=status.HTTP_201_CREATED)
async def inject_simulation_event(
    payload: SimulationScenarioRequest,
    operator: OperatorPrincipal = Depends(require_privileged_operator),
) -> SimulationResult:
    """Execute/inject a deterministic simulation scenario (Alias matching /events)."""
    return await trigger_simulation_event(payload, operator)


@router.get("/events/{event_id}", response_model=SimulationResult, status_code=status.HTTP_200_OK)
async def get_simulation_event(event_id: UUID) -> SimulationResult:
    """Retrieve an executed simulation scenario result by unique identifier."""
    result = simulation_service.get_simulation_result(event_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation event with ID '{event_id}' not found.",
        )
    return result


@router.get("/events", response_model=list[SimulationEvent], status_code=status.HTTP_200_OK)
async def list_simulation_events() -> list[SimulationEvent]:
    """List simulation event history."""
    return simulation_service.list_simulation_events()


@router.post("/reset", status_code=status.HTTP_200_OK)
async def reset_simulation_state(
    operator: OperatorPrincipal = Depends(verify_simulation_reset_allowed),
) -> dict[str, Any]:
    """Reset operational state back to initial synthetic seed baseline (development / demo flow)."""
    return simulation_service.reset_simulation()
