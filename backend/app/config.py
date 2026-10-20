"""AEROSYNC Backend — Configuration via environment variables."""

import json
from typing import Any, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- App Environment & Host ---
    app_name: str = "AEROSYNC API"
    app_env: str = "development"  # development | production | staging | test | demo
    debug: bool = False
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # --- Security & Operator Authorization ---
    # When None, auto-enforced if app_env == "production"
    auth_required: Optional[bool] = None
    operator_api_key: str = ""  # Server-side operator key for privileged mutations
    allow_demo_reset: bool = True  # Can be disabled in production

    # --- CORS (Frontend Origins) ---
    cors_origins: Union[list[str], str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://aerosync.vercel.app",
        "https://airforge.vercel.app",
        "https://airops-systems.vercel.app",
    ]
    cors_origin_regex: Optional[str] = r"^https://([a-zA-Z0-9_-]+\.)*vercel\.app$"

    # --- Supabase ---
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""  # Server-side only, never expose

    # --- Gemini ---
    gemini_api_key: str = ""  # Server-side only, never expose
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout_seconds: float = 30.0
    gemini_max_output_tokens: int = 2048

    # --- Optimization ---
    optimizer_time_limit_seconds: float = 5.0

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        defaults = [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "https://aerosync.vercel.app",
            "https://airforge.vercel.app",
            "https://airops-systems.vercel.app",
        ]
        parsed_list: list[str] = []
        if isinstance(v, list):
            parsed_list = [str(item).strip() for item in v if str(item).strip()]
        elif isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    loaded = json.loads(v)
                    if isinstance(loaded, list):
                        parsed_list = [str(item).strip() for item in loaded if str(item).strip()]
                except Exception:
                    pass
            if not parsed_list and v:
                parsed_list = [origin.strip() for origin in v.split(",") if origin.strip()]

        # Combine defaults and parsed, preserving order and removing duplicates
        seen = set()
        merged = []
        for origin in defaults + parsed_list:
            if origin and origin not in seen:
                seen.add(origin)
                merged.append(origin)
        return merged

    @property
    def is_production(self) -> bool:
        """Indicates whether running under strict production rules."""
        return self.app_env.strip().lower() in ("production", "staging")

    @property
    def is_auth_enforced(self) -> bool:
        """Indicates whether privileged mutations require authorization tokens."""
        if self.auth_required is not None:
            return self.auth_required
        return self.is_production

    def validate_production_configuration(self, raise_error: bool = False) -> list[str]:
        """Validate required configuration at startup. Never silently fallback in production."""
        issues: list[str] = []
        if self.is_production:
            if not self.supabase_url or "your-project-id" in self.supabase_url:
                issues.append("SUPABASE_URL is missing or contains default placeholder.")
            if not self.supabase_service_role_key or "your-service-role-key" in self.supabase_service_role_key:
                issues.append("SUPABASE_SERVICE_ROLE_KEY is required for server-side persistence in production.")
            if "*" in self.cors_origins:
                issues.append("Wildcard CORS origin '*' is forbidden when credentials are enabled in production.")

        if issues and raise_error:
            raise RuntimeError(f"Production configuration validation failed: {'; '.join(issues)}")
        return issues

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


settings = Settings()
