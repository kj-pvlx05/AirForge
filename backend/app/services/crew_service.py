"""AEROSYNC — Crew Service.

Business and query coordination for flight personnel and specialists.
"""

from typing import Optional
from uuid import UUID
from app.db.repository import repository
from app.models import Crew


class CrewService:
    def __init__(self, repo=repository):
        self.repo = repo

    def list_crew(
        self,
        status: Optional[str] = None,
        role: Optional[str] = None,
        base_airport_id: Optional[UUID] = None,
    ) -> list[Crew]:
        return self.repo.get_crew(status=status, role=role, base_airport_id=base_airport_id)

    def get_crew(self, crew_id: UUID) -> Optional[Crew]:
        return self.repo.get_crew_by_id(crew_id)


crew_service = CrewService()
