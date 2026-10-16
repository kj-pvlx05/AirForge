"""AEROSYNC — Common Model Utilities."""

from datetime import datetime, timezone


def now_utc() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)
