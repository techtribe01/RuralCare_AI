from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user_optional
from app.db.models import AppUser
from app.models.schemas import ChatRequest, ChatResponse
from app.services.agent_service import AgentService, AgentServiceError, get_agent_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat_message(
    payload: ChatRequest,
    service: AgentService = Depends(get_agent_service),
    current_user: AppUser | None = Depends(get_current_user_optional),
) -> ChatResponse:
    try:
        return service.handle_chat(payload, current_user=current_user)
    except AgentServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
