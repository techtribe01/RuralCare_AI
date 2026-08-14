from __future__ import annotations

from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config.settings import get_settings


class Base(DeclarativeBase):
    """Declarative base for all Stage 4 care-navigation ORM models."""


def _default_sqlite_path() -> Path:
    root = Path(__file__).resolve().parents[3]
    data_dir = root / "data" / "care_navigation"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / "ruralcare_demo.db"


def get_database_url() -> str:
    settings = get_settings()
    if settings.database_url:
        url = settings.database_url.strip()
        # Guard against misconfigured REST/API URLs being pasted into DATABASE_URL.
        if url.startswith(("postgresql://", "postgresql+psycopg2://", "postgresql+psycopg://", "sqlite://")):
            # Normalize the plain "postgresql://" scheme (what Supabase's dashboard
            # gives you) to the psycopg3 driver SQLAlchemy actually loads.
            if url.startswith("postgresql://"):
                url = "postgresql+psycopg://" + url[len("postgresql://") :]
            return url
    return f"sqlite:///{_default_sqlite_path().as_posix()}"


def create_session_factory(database_url: str | None = None) -> tuple[Engine, sessionmaker[Session]]:
    """Build an isolated engine + session factory for a given database URL.

    Used by the default app engine and independently by tests/scripts that need a
    throwaway database rather than the shared demo SQLite file.
    """
    url = database_url or get_database_url()
    is_sqlite = url.startswith("sqlite")
    connect_args = {"check_same_thread": False} if is_sqlite else {}
    engine_kwargs: dict = {"connect_args": connect_args, "future": True}
    if is_sqlite and ":memory:" in url:
        # In-memory SQLite is per-connection: FastAPI runs sync endpoints in a worker
        # thread, so without a shared connection the request thread sees an empty
        # database even though the test/setup thread already created and seeded it.
        engine_kwargs["poolclass"] = StaticPool
    if not is_sqlite:
        # Supabase's pooled connection string (port 6543) runs pgbouncer in
        # transaction mode, which is incompatible with server-side prepared
        # statements -- disable them on the psycopg3 driver. pool_pre_ping avoids
        # handing out dead connections after the pooler recycles them.
        engine_kwargs["pool_pre_ping"] = True
        engine_kwargs["connect_args"] = {"prepare_threshold": None}
    engine = create_engine(url, **engine_kwargs)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)
    return engine, factory


engine, SessionLocal = create_session_factory()


def init_db(bind: Engine | None = None) -> None:
    from app.db import models  # noqa: F401  ensure models are registered on Base.metadata

    Base.metadata.create_all(bind=bind or engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
