"""AEROSYNC — Aircraft Service.

Business and query coordination for fleet resources.
"""

from typing import Optional
from uuid import UUID
from app.db.repository import repository
from app.models import Aircraft


class AircraftService:
    def __init__(self, repo=repository):
        self.repo = repo

    def list_aircraft(
        self,
        status: Optional[str] = None,
        role: Optional[str] = None,
        base_airport_id: Optional[UUID] = None,
    ) -> list[Aircraft]:
        return self.repo.get_aircraft(status=status, role=role, base_airport_id=base_airport_id)

    def get_aircraft(self, aircraft_id: UUID) -> Optional[Aircraft]:
        return self.repo.get_aircraft_by_id(aircraft_id)


aircraft_service = AircraftService()
