from __future__ import annotations

from dataclasses import dataclass
from typing import Any
import logging
import uuid

from app.config.settings import get_settings
from app.db.models import AppUser
from app.models.schemas import AgentEvent, AgentEventStatus, AgentResponse, ChatRequest, ChatResponse, ConversationRole, ConversationTurn, IntentLabel, LanguageCode, RiskLevel, SourceReference
from app.models.state import AgentState
from app.services.agent_graph import AgentGraphFactory
from app.services.intent_service import IntentService
from app.services.language_service import LanguageService
from app.services.llm_service import LLMService, LLMServiceError
from app.services.session_store import ConversationSession, ConversationStore


logger = logging.getLogger(__name__)


class AgentServiceError(RuntimeError):
    pass


@dataclass(slots=True)
class AgentService:
    llm_service: LLMService
    language_service: LanguageService
    intent_service: IntentService
    store: ConversationStore
    graph: Any

    @classmethod
    def create(
        cls,
        llm_service: LLMService | None = None,
        store: ConversationStore | None = None,
    ) -> "AgentService":
        llm_service = llm_service or LLMService()
        language_service = LanguageService(llm_service)
        intent_service = IntentService(llm_service)
        graph = AgentGraphFactory(llm_service, language_service, intent_service).build()
        return cls(
            llm_service=llm_service,
            language_service=language_service,
            intent_service=intent_service,
            store=store or ConversationStore(),
            graph=graph,
        )

    def handle_chat(self, request: ChatRequest, channel: str = "chat", current_user: AppUser | None = None) -> ChatResponse:
        """channel identifies which surface originated the turn (chat/voice/sms). It is
        the ONLY thing that differs by channel -- the LangGraph, tools, and services are
        identical, so a booking made over SMS is validated exactly like one made in the
        Assistant UI (PRD Phase 4.11/4.12: never a separate per-channel agent)."""
        message = request.message.strip()
        if not message:
            raise AgentServiceError("Message cannot be empty.")

        session_id = request.session_id or self._new_session_id()
        session = self.store.get_or_create(session_id, default_language=request.language or LanguageCode.EN)
        history = list(session.conversation_history)

        initial_events = [
            AgentEvent(
                node="input_received",
                status=AgentEventStatus.COMPLETED,
                detail="User message received.",
            )
        ]

        state: AgentState = {
            "user_id": session.session_id,
            "session_id": session.session_id,
            "channel": channel,
            "language": request.language.value if request.language else session.language.value,
            "user_message": message,
            "conversation_history": history,
            "current_step": "input_received",
            "agent_events": initial_events,
            "care_context": dict(session.care_context or {}),
            "selected_hospital_id": getattr(request, "selected_hospital_id", None),
            "selected_doctor_id": getattr(request, "selected_doctor_id", None),
            "selected_slot_id": getattr(request, "selected_slot_id", None),
            "confirm_booking": bool(getattr(request, "confirm_booking", False)),
            "authenticated_user_id": current_user.id if current_user else None,
        }

        try:
            result = self.graph.invoke(state)
        except LLMServiceError as exc:
            logger.exception("LLM service failure for session %s", session_id)
            raise AgentServiceError("The assistant is temporarily unavailable.") from exc
        except Exception as exc:  # pragma: no cover - graph/runtime error path
            logger.exception("Unhandled graph failure for session %s", session_id)
            raise AgentServiceError("The assistant could not complete the request.") from exc

        response = result.get("response")
        if not isinstance(response, AgentResponse):
            raise AgentServiceError("The assistant returned an invalid response.")

        events = list(result.get("agent_events", []))
        events.append(
            AgentEvent(
                node="response_returned",
                status=AgentEventStatus.COMPLETED,
                detail="Response returned to the frontend.",
            )
        )

        language = LanguageCode(result.get("language", session.language.value))
        intent = IntentLabel(result.get("intent", IntentLabel.GENERAL_INFORMATION.value))
        risk_level = RiskLevel(result.get("risk_level", RiskLevel.LOW.value))
        human_escalation_required = bool(result.get("human_escalation_required", False))
        sources = [
            SourceReference.model_validate(item)
            for item in (result.get("sources", []) or [])
        ]

        session.language = language
        session.last_intent = intent
        session.last_response = response.message
        session.last_agent_events = events
        session.care_context = dict(result.get("care_context") or {})
        session.conversation_history.append(ConversationTurn(role=ConversationRole.USER, message=message))
        session.conversation_history.append(ConversationTurn(role=ConversationRole.ASSISTANT, message=response.message))
        self.store.save(session)

        return ChatResponse(
            session_id=session.session_id,
            message=response.message,
            language=language,
            intent=intent,
            risk_level=risk_level,
            safety_reason_code=result.get("safety_reason_code"),
            human_escalation_required=human_escalation_required,
            sources=sources or response.sources,
            appointment=response.appointment_payload,
            agent_events=events,
        )

    def _new_session_id(self) -> str:
        return uuid.uuid4().hex


_DEFAULT_AGENT_SERVICE: AgentService | None = None


def get_agent_service() -> AgentService:
    global _DEFAULT_AGENT_SERVICE
    if _DEFAULT_AGENT_SERVICE is None:
        _DEFAULT_AGENT_SERVICE = AgentService.create()
    return _DEFAULT_AGENT_SERVICE
