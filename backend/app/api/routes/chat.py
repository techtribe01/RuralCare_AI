from fastapi import APIRouter, Depends, HTTPException

from app.models.schemas import ChatRequest, ChatResponse
from app.services.agent_service import AgentService, AgentServiceError, get_agent_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat_message(payload: ChatRequest, service: AgentService = Depends(get_agent_service)) -> ChatResponse:
    try:
        return service.handle_chat(payload)
    except AgentServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
