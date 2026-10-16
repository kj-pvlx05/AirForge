"""AEROSYNC — Readiness & Operational Telemetry Endpoints."""

from fastapi import APIRouter, status
from app.models import ReadinessReport
from app.services import readiness_service

router = APIRouter(prefix="/api/readiness", tags=["Readiness"])


@router.get("", response_model=ReadinessReport, status_code=status.HTTP_200_OK)
async def get_readiness_report() -> ReadinessReport:
    """Retrieve aggregated operational readiness KPIs for the dashboard."""
    return readiness_service.calculate_readiness()
