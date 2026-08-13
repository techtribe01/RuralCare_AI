"""Verify RuralCare AI environment configuration without printing secret values.

Usage:
    cd backend
    python ../scripts/verify_environment.py
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from dotenv import load_dotenv

load_dotenv(BACKEND / ".env")


def _status(name: str, value: str | None, *, required: bool = False, pattern: str | None = None) -> dict:
    if not value or not value.strip():
        return {"name": name, "status": "MISSING", "required": required}
    if pattern and not re.search(pattern, value.strip()):
        return {"name": name, "status": "INVALID FORMAT", "required": required}
    return {"name": name, "status": "PRESENT", "required": required}


def main() -> int:
    checks = [
        _status("OPENAI_API_KEY", os.getenv("OPENAI_API_KEY"), required=False, pattern=r"^nvapi-|^sk-"),
        _status("OPENAI_BASE_URL", os.getenv("OPENAI_BASE_URL"), pattern=r"^https?://"),
        _status("OPENAI_MODEL", os.getenv("OPENAI_MODEL")),
        _status("QDRANT_URL", os.getenv("QDRANT_URL"), pattern=r"^https?://"),
        _status("QDRANT_API_KEY", os.getenv("QDRANT_API_KEY")),
        _status("DATABASE_URL", os.getenv("DATABASE_URL"), pattern=r"^(postgresql|sqlite)"),
        _status("SUPABASE_URL", os.getenv("SUPABASE_URL"), pattern=r"^https://.*\.supabase\.co"),
        _status("SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY")),
        _status("SUPABASE_PUBLISHABLE_KEY", os.getenv("SUPABASE_PUBLISHABLE_KEY"), pattern=r"^sb_publishable_"),
        _status("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_SERVICE_ROLE_KEY")),
        _status("SUPABASE_PROJECT_ID", os.getenv("SUPABASE_PROJECT_ID")),
        _status("LANGSMITH_API_KEY", os.getenv("LANGSMITH_API_KEY"), pattern=r"^lsv2_"),
        _status("LANGSMITH_TRACING", os.getenv("LANGSMITH_TRACING") or os.getenv("LANGCHAIN_TRACING_V2")),
        _status("TWILIO_ACCOUNT_SID", os.getenv("TWILIO_ACCOUNT_SID"), pattern=r"^AC"),
        _status("TWILIO_AUTH_TOKEN", os.getenv("TWILIO_AUTH_TOKEN")),
        _status("TWILIO_PHONE_NUMBER", os.getenv("TWILIO_PHONE_NUMBER"), pattern=r"^\+"),
        _status("CORS_ALLOWED_ORIGINS", os.getenv("CORS_ALLOWED_ORIGINS")),
    ]

    print("RuralCare AI — environment verification (values hidden)\n")
    for item in checks:
        req = "required" if item["required"] else "optional"
        print(f"  {item['name']}: {item['status']} ({req})")

    missing_required = [c for c in checks if c["required"] and c["status"] != "PRESENT"]
    return 1 if missing_required else 0


if __name__ == "__main__":
    raise SystemExit(main())
