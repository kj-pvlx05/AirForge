"""AEROSYNC — Supabase Database Client Factory.

Security Boundary:
  - `get_service_client()`: Uses the service-role key to execute backend-owned mutations.
    This client is NEVER exposed to the frontend browser.
  - `get_anon_client()`: Uses the public anonymous key (read-only queries).
"""

from typing import Any, Optional
from app.config import settings

_service_client: Optional[Any] = None
_anon_client: Optional[Any] = None


def is_supabase_configured() -> bool:
    """Check if Supabase connection credentials are present in settings."""
    return bool(settings.supabase_url and (settings.supabase_service_role_key or settings.supabase_anon_key))


def get_service_client() -> Optional[Any]:
    """Get or initialize the privileged Supabase service-role client (Backend mutations)."""
    global _service_client
    if not is_supabase_configured():
        return None

    if _service_client is None:
        try:
            from supabase import create_client
            key = settings.supabase_service_role_key or settings.supabase_anon_key
            _service_client = create_client(settings.supabase_url, key)
        except ImportError:
            return None
    return _service_client


def get_anon_client() -> Optional[Any]:
    """Get or initialize the public read client."""
    global _anon_client
    if not is_supabase_configured():
        return None

    if _anon_client is None:
        try:
            from supabase import create_client
            key = settings.supabase_anon_key or settings.supabase_service_role_key
            _anon_client = create_client(settings.supabase_url, key)
        except ImportError:
            return None
    return _anon_client
