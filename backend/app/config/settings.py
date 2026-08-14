from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os

from dotenv import load_dotenv

# Loaded once at import time so `backend/.env` works regardless of the process's
# current working directory (e.g. running uvicorn from the repo root vs. backend/).
# Real environment variables (e.g. from a deployment platform) still take precedence
# since override=False is the default.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str = "RuralCare AI API"
    app_stage: int = 4
    openai_api_key: str | None = None
    openai_model: str = "meta/llama-3.3-70b-instruct"
    openai_base_url: str | None = "https://integrate.api.nvidia.com/v1"
    openai_top_p: float = 0.7
    openai_max_tokens: int = 1024
    default_language: str = "en"
    supported_languages: tuple[str, ...] = ("en", "te")
    database_url: str | None = None
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_publishable_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_project_id: str | None = None
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_phone_number: str | None = None
    twilio_verify_service_sid: str | None = None
    cors_allowed_origins: tuple[str, ...] = ("http://localhost:5173", "http://127.0.0.1:5173")
    app_env: str = "development"
    session_cookie_name: str = "ruralcare_session"
    session_ttl_hours: int = 168

    @property
    def twilio_configured(self) -> bool:
        return bool(self.twilio_account_sid and self.twilio_auth_token and self.twilio_phone_number)

    @property
    def twilio_verify_configured(self) -> bool:
        return bool(self.twilio_account_sid and self.twilio_auth_token and self.twilio_verify_service_sid)

    @property
    def cookie_secure(self) -> bool:
        return self.app_env != "development"

    @property
    def supabase_configured(self) -> bool:
        return bool(
            self.supabase_url
            and (self.supabase_anon_key or self.supabase_publishable_key or self.supabase_service_role_key)
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    extra_origins = tuple(
        origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if origin.strip()
    )
    return Settings(
        openai_api_key=os.getenv("OPENAI_API_KEY") or None,
        openai_model=os.getenv("OPENAI_MODEL", "meta/llama-3.3-70b-instruct"),
        openai_base_url=os.getenv("OPENAI_BASE_URL", "https://integrate.api.nvidia.com/v1") or None,
        openai_top_p=float(os.getenv("OPENAI_TOP_P", "0.7")),
        openai_max_tokens=int(os.getenv("OPENAI_MAX_TOKENS", "1024")),
        default_language=os.getenv("RURALCARE_DEFAULT_LANGUAGE", "en"),
        database_url=os.getenv("DATABASE_URL") or None,
        supabase_url=os.getenv("SUPABASE_URL") or None,
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY") or None,
        supabase_publishable_key=os.getenv("SUPABASE_PUBLISHABLE_KEY") or None,
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY") or None,
        supabase_project_id=os.getenv("SUPABASE_PROJECT_ID") or None,
        twilio_account_sid=os.getenv("TWILIO_ACCOUNT_SID") or None,
        twilio_auth_token=os.getenv("TWILIO_AUTH_TOKEN") or None,
        twilio_phone_number=os.getenv("TWILIO_PHONE_NUMBER") or None,
        twilio_verify_service_sid=os.getenv("TWILIO_VERIFY_SERVICE_SID") or None,
        cors_allowed_origins=extra_origins or ("http://localhost:5173", "http://127.0.0.1:5173"),
        app_env=os.getenv("APP_ENV", "development"),
        session_cookie_name=os.getenv("SESSION_COOKIE_NAME", "ruralcare_session"),
        session_ttl_hours=int(os.getenv("SESSION_TTL_HOURS", "168")),
    )

