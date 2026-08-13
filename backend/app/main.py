from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, chat, appointments, voice, sms
from app.config.settings import get_settings
from app.db.session import init_db


def _configure_observability() -> None:
    """Enable LangSmith tracing when configured — no secrets are logged."""
    if os.getenv("LANGSMITH_API_KEY"):
        os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
        os.environ.setdefault("LANGCHAIN_PROJECT", os.getenv("LANGCHAIN_PROJECT", "ruralcare-ai"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    _configure_observability()
    # Creates the care-navigation tables if they do not exist yet. Demo data itself is
    # only ever populated by scripts/seed_demo_data.py, never implicitly at startup.
    init_db()
    yield


app = FastAPI(title="RuralCare AI API", version="0.4.0", lifespan=lifespan)

# Browsers reject credentialed requests (cookies/Authorization) against a wildcard
# origin, so allow_credentials=True requires an explicit origin allowlist rather than
# "*". The showcase frontend runs on Vite's default dev port; additional origins (e.g.
# a deployed preview URL) can be added via CORS_ALLOWED_ORIGINS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(appointments.router)
app.include_router(voice.router)
app.include_router(sms.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "RuralCare AI API", "stage": 4}
