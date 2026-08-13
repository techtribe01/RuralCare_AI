from fastapi import APIRouter, Query

from app.config.settings import get_settings
from app.services.system_status import build_service_status, llm_reachable

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(deep: bool = Query(default=False, description="When true, probe LLM reachability (slower).")):
    settings = get_settings()
    payload: dict = {
        "status": "ok",
        "stage": settings.app_stage,
        "services": build_service_status(settings),
    }
    if deep:
        payload["services"]["llm"]["reachable"] = llm_reachable(settings)
    return payload
