"""AEROSYNC — Optimization API Router (Phase 7: OR-Tools CP-SAT).

Provides deterministic constrained resource allocation, recommendation inspection,
and state application endpoints.
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import OperatorPrincipal, require_privileged_operator
from app.models.optimization import (
    OptimizationRequest,
    OptimizationResult,
    OptimizationRun,
    Recommendation,
    ApplyRecommendationResponse,
)
from app.services.optimization_service import optimization_service

router = APIRouter(prefix="/api/optimization", tags=["Optimization"])


@router.post(
    "/run",
    response_model=OptimizationResult,
    status_code=status.HTTP_200_OK,
    summary="Run deterministic OR-Tools CP-SAT optimization engine against current state",
)
def run_optimization(
    payload: Optional[OptimizationRequest] = None,
    operator: OperatorPrincipal = Depends(require_privileged_operator),
) -> OptimizationResult:
    """Executes the deterministic OR-Tools CP-SAT engine.

    Consumes the current operational state (including any weather deterioration
    or grounded airframes from Phase 6 simulation), enforces all 9 core constraints,
    and returns feasible allocations, unresolved missions, and transparent metrics.
    """
    req = payload or OptimizationRequest()
    try:
        return optimization_service.solve(req)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimization solver failed: {str(exc)}",
        )


@router.post(
    "/solve",
    response_model=OptimizationResult,
    status_code=status.HTTP_200_OK,
    summary="Run deterministic OR-Tools CP-SAT resource allocation solver (Alias)",
)
def solve_allocation(
    payload: Optional[OptimizationRequest] = None,
    operator: OperatorPrincipal = Depends(require_privileged_operator),
) -> OptimizationResult:
    """Convenience alias matching /run for client and test backward compatibility."""
    return run_optimization(payload, operator)


@router.get(
    "/runs",
    response_model=list[OptimizationRun],
    summary="List all historical optimization solver runs",
)
def list_optimization_runs() -> list[OptimizationRun]:
    return optimization_service.list_runs()


@router.get(
    "/runs/{run_id}",
    response_model=OptimizationRun,
    summary="Retrieve a specific optimization run record by ID",
)
def get_optimization_run(run_id: UUID) -> OptimizationRun:
    run = optimization_service.get_run(run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Optimization run '{run_id}' not found.",
        )
    return run


@router.get(
    "/results/{run_id}",
    response_model=OptimizationResult,
    summary="Retrieve complete OptimizationResult by run ID",
)
def get_optimization_result(run_id: UUID) -> OptimizationResult:
    result = optimization_service.get_result(run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Optimization result '{run_id}' not found.",
        )
    return result


@router.get(
    "/recommendations/{rec_id}",
    response_model=Recommendation,
    summary="Retrieve an allocation recommendation by ID",
)
def get_recommendation(rec_id: UUID) -> Recommendation:
    rec = optimization_service.get_recommendation(rec_id)
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recommendation '{rec_id}' not found.",
        )
    return rec


@router.post(
    "/apply/{rec_id}",
    response_model=ApplyRecommendationResponse,
    summary="Apply recommended allocations back to operational mission state",
)
def apply_recommendation(
    rec_id: UUID,
    operator: OperatorPrincipal = Depends(require_privileged_operator),
) -> ApplyRecommendationResponse:
    try:
        return optimization_service.apply_recommendation(rec_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply recommendation: {str(exc)}",
        )


@router.post(
    "/apply",
    response_model=ApplyRecommendationResponse,
    summary="Apply recommended allocations back to operational mission state (Body/Query alias)",
)
def apply_recommendation_alias(
    payload: Optional[dict] = None,
    rec_id: Optional[UUID] = None,
    operator: OperatorPrincipal = Depends(require_privileged_operator),
) -> ApplyRecommendationResponse:
    target_id = rec_id
    if not target_id and payload:
        raw_id = payload.get("recommendation_id") or payload.get("rec_id")
        if raw_id:
            try:
                target_id = UUID(str(raw_id))
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid recommendation UUID format: {raw_id}",
                )
    if not target_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing recommendation_id in request body or query parameter.",
        )
    return apply_recommendation(target_id, operator)
