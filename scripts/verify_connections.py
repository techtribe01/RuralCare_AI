"""Test external service connectivity without printing secrets.

Usage:
    cd backend
    python ../scripts/verify_connections.py
"""
from __future__ import annotations

import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.config.settings import get_settings
from app.db.session import get_database_url, init_db
from app.services.llm_service import LLMService
from app.services.rag_service import RAGService


def _line(label: str, ok: bool, detail: str = "") -> None:
    status = "PASS" if ok else "FAIL"
    suffix = f" — {detail}" if detail else ""
    print(f"  {label}: {status}{suffix}")


def main() -> int:
    get_settings.cache_clear()
    settings = get_settings()
    failures = 0

    print("RuralCare AI — connection verification\n")

    # LLM
    llm = LLMService(settings=settings)
    if llm.available:
        try:
            reply = llm.generate(instructions="Reply with exactly: OK", input_text="ping", temperature=0.0)
            _line("LLM", bool(reply.strip()), "provider responded")
        except Exception as exc:
            _line("LLM", False, type(exc).__name__)
            failures += 1
    else:
        _line("LLM", False, "no API key — offline heuristics only")
        failures += 1

    # Database
    try:
        init_db()
        url = get_database_url()
        backend = "postgresql" if url.startswith("postgresql") else "sqlite"
        _line("DATABASE", True, backend)
    except Exception as exc:
        _line("DATABASE", False, type(exc).__name__)
        failures += 1

    # RAG (local vector index)
    try:
        rag = RAGService()
        docs = rag.store.get_all()
        hits = rag.retrieve("fever guidance", language="en", limit=1)
        _line("RAG", len(docs) > 0, f"{len(docs)} indexed chunks, retrieval={'ok' if hits else 'empty'}")
    except Exception as exc:
        _line("RAG", False, type(exc).__name__)
        failures += 1

    # Qdrant cloud (env may be set but app uses local file store today)
    if settings and (Path(BACKEND / ".env").exists()):
        import os
        from dotenv import load_dotenv

        load_dotenv(BACKEND / ".env")
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_key = os.getenv("QDRANT_API_KEY")
        if qdrant_url and qdrant_key:
            try:
                import httpx

                resp = httpx.get(f"{qdrant_url.rstrip('/')}/collections", headers={"api-key": qdrant_key}, timeout=10.0)
                _line("QDRANT (cloud)", resp.status_code == 200, "cloud reachable; app RAG uses local index file")
            except Exception as exc:
                _line("QDRANT (cloud)", False, type(exc).__name__)
                failures += 1
        else:
            _line("QDRANT (cloud)", False, "not configured — using local vector_index.json")

    # Supabase
    if settings.supabase_configured:
        try:
            import httpx

            resp = httpx.get(f"{settings.supabase_url.rstrip('/')}/rest/v1/", headers={"apikey": settings.supabase_anon_key or settings.supabase_publishable_key or ""}, timeout=10.0)
            _line("SUPABASE", resp.status_code in {200, 401, 404}, "REST endpoint reachable")
        except Exception as exc:
            _line("SUPABASE", False, type(exc).__name__)
            failures += 1
    else:
        _line("SUPABASE", False, "not fully configured")

    # LangSmith
    import os

    langsmith_key = os.getenv("LANGSMITH_API_KEY")
    if langsmith_key:
        _line("LANGSMITH", True, "API key present (tracing enabled if LANGCHAIN_TRACING_V2=true)")
    else:
        _line("LANGSMITH", False, "not configured")

    # Twilio
    if settings.twilio_configured:
        try:
            from twilio.rest import Client

            client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
            account = client.api.accounts(settings.twilio_account_sid).fetch()
            _line("TWILIO", account.status == "active", f"account {account.status}")
        except Exception as exc:
            _line("TWILIO", False, type(exc).__name__)
            failures += 1
    else:
        _line("TWILIO", False, "not configured — voice/SMS webhooks use demo fallbacks")

    print()
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
