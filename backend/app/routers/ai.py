"""AEROSYNC — Gemini AI Explanation & Decision-Support Router (Phase 8)."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import OperatorPrincipal, require_privileged_operator
from app.models.ai import (
    AIAnalyzeRequest,
    AIExplanationResponse,
)
from app.services.ai_explanation_service import ai_explanation_service
from app.db.repository import repository

router = APIRouter(prefix="/api/ai", tags=["AI Explanation & Decision-Support"])


@router.post("/analyze", response_model=AIExplanationResponse, status_code=status.HTTP_200_OK)
async def analyze_optimization(
    payload: AIAnalyzeRequest,
    operator: OperatorPrincipal = Depends(require_privileged_operator),
) -> AIExplanationResponse:
    """Generate or retrieve a structured natural-language situation analysis for an optimization run.

    Gemini Flash acts exclusively as an explanation and decision-support layer.
    All allocation decisions originate from the deterministic Phase 7 OR-Tools CP-SAT engine.
    """
    return await ai_explanation_service.generate_explanation(payload)


@router.get("/analysis/{optimization_run_id}", response_model=AIExplanationResponse, status_code=status.HTTP_200_OK)
async def get_analysis_by_run_id(optimization_run_id: str) -> AIExplanationResponse:
    """Retrieve the persisted AI situation analysis for a specific optimization run, or generate one if missing."""
    try:
        run_uuid = UUID(optimization_run_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "OPTIMIZATION_RUN_NOT_FOUND",
                "message": f"Optimization run '{optimization_run_id}' has an invalid UUID format.",
            },
        )

    # Check for existing persisted analysis
    persisted = repository.get_ai_analysis_by_run_id(run_uuid)
    if persisted:
        return AIExplanationResponse(
            optimization_run_id=str(persisted.optimization_run_id),
            provider=persisted.provider,
            model=persisted.model,
            generated_at=persisted.generated_at,
            source="optimization_result",
            explanation=persisted.explanation,
            fallback_used=persisted.fallback_used,
            error_code=persisted.error_code,
            prompt_version=persisted.prompt_version,
        )

    # If no analysis exists yet, verify the optimization run exists and generate
    opt_result = repository.get_optimization_result(run_uuid)
    if not opt_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "OPTIMIZATION_RUN_NOT_FOUND",
                "message": f"Optimization run '{optimization_run_id}' not found.",
            },
        )

    req = AIAnalyzeRequest(optimization_run_id=str(run_uuid))
    return await ai_explanation_service.generate_explanation(req)


@router.post("/chat", status_code=status.HTTP_200_OK)
async def chat_with_ai(payload: dict) -> dict:
    """Operational query endpoint (Decision support disabled; informational telemetry only)."""
    msg = payload.get("message", "")
    return {
        "response": f"AEROSYNC Operational telemetry query acknowledged: '{msg}'. Deterministic optimizer is active.",
        "sources": ["operational_store"],
    }

