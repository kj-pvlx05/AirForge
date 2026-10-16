"""AEROSYNC — Environment Service.

Aggregates operational weather, airspace restrictions, airports, and sector statuses.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.db.repository import repository
from app.models import (
    Airport,
    Sector,
    WeatherCondition,
    AirspaceRestriction,
)


class EnvironmentState(BaseModel):
    weather: list[WeatherCondition]
    restrictions: list[AirspaceRestriction]
    sectors: list[Sector]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EnvironmentService:
    def __init__(self, repo=repository):
        self.repo = repo

    def get_airports(self) -> list[Airport]:
        return self.repo.get_airports()

    def get_airport(self, airport_id: UUID) -> Optional[Airport]:
        return self.repo.get_airport_by_id(airport_id)

    def get_sectors(self) -> list[Sector]:
        return self.repo.get_sectors()

    def get_sector(self, sector_id: UUID) -> Optional[Sector]:
        return self.repo.get_sector_by_id(sector_id)

    def get_weather(
        self, sector_id: Optional[UUID] = None, airport_id: Optional[UUID] = None
    ) -> list[WeatherCondition]:
        return self.repo.get_weather(sector_id=sector_id, airport_id=airport_id)

    def get_airspace_restrictions(
        self, sector_id: Optional[UUID] = None, status: Optional[str] = None
    ) -> list[AirspaceRestriction]:
        return self.repo.get_airspace_restrictions(sector_id=sector_id, status=status)

    def get_environment_state(self) -> EnvironmentState:
        return EnvironmentState(
            weather=self.repo.get_weather(),
            restrictions=self.repo.get_airspace_restrictions(),
            sectors=self.repo.get_sectors(),
        )


environment_service = EnvironmentService()
