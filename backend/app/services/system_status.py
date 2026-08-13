from __future__ import annotations

import os
from pathlib import Path

from app.config.settings import Settings, get_settings
from app.db.session import get_database_url
from app.services.llm_service import LLMService
from app.services.rag_service import RAGService


def build_service_status(settings: Settings | None = None) -> dict:
    settings = settings or get_settings()
    db_url = get_database_url()
    db_backend = "postgresql" if db_url.startswith("postgresql") else "sqlite"

    rag = RAGService()
    doc_count = len(rag.store.get_all())

    qdrant_cloud = bool(os.getenv("QDRANT_URL") and os.getenv("QDRANT_API_KEY"))
    langsmith = bool(os.getenv("LANGSMITH_API_KEY"))

    return {
        "llm": {
            "status": "configured" if settings.openai_api_key else "offline_heuristics",
            "provider": "nvidia_nim" if (settings.openai_base_url or "").find("nvidia.com") >= 0 else "openai_compatible",
            "model": settings.openai_model,
        },
        "database": {
            "status": "configured",
            "backend": db_backend,
            "supabase_project": settings.supabase_project_id if settings.supabase_configured else None,
        },
        "rag": {
            "status": "ready" if doc_count else "empty",
            "mode": "local_vector_index",
            "document_chunks": doc_count,
            "qdrant_cloud_configured": qdrant_cloud,
        },
        "langsmith": {
            "status": "configured" if langsmith else "not_configured",
            "tracing_enabled": os.getenv("LANGCHAIN_TRACING_V2", "").lower() in {"1", "true", "yes"},
        },
        "twilio": {
            "status": "configured" if settings.twilio_configured else "demo_mode",
        },
        "cors": {
            "status": "configured",
            "origins": list(settings.cors_allowed_origins),
        },
    }


def llm_reachable(settings: Settings | None = None) -> bool:
    settings = settings or get_settings()
    service = LLMService(settings=settings)
    if not service.available:
        return False
    try:
        reply = service.generate(instructions="Reply with exactly: OK", input_text="ping", temperature=0.0)
        return bool(reply.strip())
    except Exception:
        return False
