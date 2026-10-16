"""AEROSYNC — Event Service.

Manages query and tracking of system activity and operational audit events.
"""

from typing import Optional
from app.db.repository import repository
from app.models import Event


class EventService:
    def __init__(self, repo=repository):
        self.repo = repo

    def list_events(
        self,
        limit: int = 20,
        category: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> list[Event]:
        return self.repo.get_events(limit=limit, category=category, event_type=event_type)


event_service = EventService()
