"""AEROSYNC — Mission Service.

Business and query coordination for operational taskings.
"""

from typing import Optional
from uuid import UUID
from app.db.repository import repository
from app.models import Mission


class MissionService:
    def __init__(self, repo=repository):
        self.repo = repo

    def list_missions(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        mission_type: Optional[str] = None,
    ) -> list[Mission]:
        return self.repo.get_missions(status=status, priority=priority, mission_type=mission_type)

    def get_mission(self, mission_id: UUID) -> Optional[Mission]:
        return self.repo.get_mission_by_id(mission_id)


mission_service = MissionService()
