"""AEROSYNC — System Event Log Pydantic Models."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID
from pydantic import BaseModel, Field


EventType = Literal["info", "warning", "critical", "optimization", "simulation"]
EventCategory = Literal["weather", "fleet", "crew", "mission", "system"]


class EventBase(BaseModel):
    type: EventType = "info"
    category: EventCategory = "system"
    title: str = Field(..., max_length=200)
    description: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class EventCreate(EventBase):
    pass


from app.models.common import now_utc

class Event(EventBase):
    id: UUID
    created_at: datetime = Field(default_factory=now_utc)

    model_config = {"from_attributes": True}
