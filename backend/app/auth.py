"""AEROSYNC — Server-Side Authentication & Operator Authorization Layer.

Enforces role boundaries and guards privileged operational mutations:
  - Simulation execution & resets
  - OR-Tools CP-SAT optimization execution
  - Apply-to-Fleet reallocations
  - AI situation analysis triggering

In production mode or when AUTH_REQUIRED=true, requests without valid
authorization credentials are rejected with 401 Unauthorized / 403 Forbidden.
In local development / demo mode, unauthenticated access defaults to a demo
operator principal with audit logging.
"""

import logging
from typing import Optional
from fastapi import Header, HTTPException, Request, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.config import settings
from app.db.supabase import get_anon_client, get_service_client, is_supabase_configured

logger = logging.getLogger("aerosync.auth")

security_bearer = HTTPBearer(auto_error=False)


class OperatorPrincipal(BaseModel):
    """Authenticated operator context passed to router handlers."""
    subject: str
    role: str
    authenticated: bool
    auth_method: str  # "api_key" | "supabase_jwt" | "demo_mode"


async def get_current_operator(
    request: Request,
    bearer_creds: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> OperatorPrincipal:
    """Verify bearer token or operator API key for operational access."""
    # 1. Check Operator API Key (Server-to-server or privileged console)
    if x_api_key:
        if settings.operator_api_key and x_api_key == settings.operator_api_key:
            return OperatorPrincipal(
                subject="api_key_operator",
                role="operator",
                authenticated=True,
                auth_method="api_key",
            )
        # If API key was supplied but didn't match
        if settings.is_auth_enforced or settings.operator_api_key:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "INVALID_API_KEY", "message": "Supplied operational API key is invalid."},
            )

    # 2. Check Supabase / JWT Bearer Token
    if bearer_creds and bearer_creds.credentials:
        token = bearer_creds.credentials.strip()

        # Check against operator key convenience match
        if settings.operator_api_key and token == settings.operator_api_key:
            return OperatorPrincipal(
                subject="token_operator",
                role="operator",
                authenticated=True,
                auth_method="api_key",
            )

        # Validate with Supabase Auth if client is configured
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    user_resp = client.auth.get_user(token)
                    if user_resp and getattr(user_resp, "user", None):
                        user = user_resp.user
                        # Authoritative role extraction:
                        # Privileged operational roles MUST ONLY originate from server-controlled app_metadata.
                        # user_metadata is user-editable via client SDKs and MUST NEVER be trusted for authorization.
                        app_meta = getattr(user, "app_metadata", {}) or {}
                        role = app_meta.get("role") or getattr(user, "role", "authenticated") or "authenticated"
                        return OperatorPrincipal(
                            subject=str(getattr(user, "id", "authenticated_user")),
                            role=role,
                            authenticated=True,
                            auth_method="supabase_jwt",
                        )
                except Exception as exc:
                    logger.warning("Supabase token validation failed: %s", str(exc))
                    if settings.is_auth_enforced:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail={"error": "INVALID_TOKEN", "message": "Bearer authentication token is invalid or expired."},
                        )

        if settings.is_auth_enforced:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "INVALID_TOKEN", "message": "Bearer authentication token could not be verified."},
            )

    # 3. Handle unauthenticated request
    if settings.is_auth_enforced:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "AUTHENTICATION_REQUIRED",
                "message": "Privileged operational action requires valid authorization credentials (Bearer token or X-API-Key).",
            },
        )

    # Development / Demo mode fallback
    return OperatorPrincipal(
        subject="demo_operator",
        role="demo_operator",
        authenticated=False,
        auth_method="demo_mode",
    )


AUTHORIZED_OPERATOR_ROLES = {"operator", "admin", "commander", "dispatcher"}


async def require_privileged_operator(
    operator: OperatorPrincipal = Security(get_current_operator),
) -> OperatorPrincipal:
    """Dependency for state-mutating endpoints requiring operational authority."""
    if settings.is_auth_enforced:
        if operator.auth_method == "supabase_jwt" and operator.role not in AUTHORIZED_OPERATOR_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "INSUFFICIENT_ROLE",
                    "message": f"User role '{operator.role}' lacks authorization to execute operational mutations. Required roles: {', '.join(sorted(AUTHORIZED_OPERATOR_ROLES))}.",
                },
            )
    return operator


async def verify_simulation_reset_allowed(
    operator: OperatorPrincipal = Security(get_current_operator),
) -> OperatorPrincipal:
    """Special safeguard preventing simulation state wipes in production."""
    if settings.is_production and not settings.allow_demo_reset:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "RESET_FORBIDDEN_IN_PRODUCTION",
                "message": "Simulation reset is permanently disabled in production environments.",
            },
        )
    return operator
