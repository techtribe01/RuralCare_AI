from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock

from app.models.schemas import ConversationTurn, IntentLabel, LanguageCode, AgentEvent


@dataclass(slots=True)
class ConversationSession:
    session_id: str
    conversation_history: list[ConversationTurn] = field(default_factory=list)
    language: LanguageCode = LanguageCode.EN
    last_intent: IntentLabel = IntentLabel.GENERAL_INFORMATION
    last_response: str = ""
    last_agent_events: list[AgentEvent] = field(default_factory=list)
    # Persists in-progress appointment flow state (specialty, selected doctor/slot,
    # presented options, confirmation step) across chat/voice/SMS turns, since each
    # LangGraph invocation is stateless apart from what is threaded back in here.
    care_context: dict = field(default_factory=dict)


class ConversationStore:
    def __init__(self) -> None:
        self._sessions: dict[str, ConversationSession] = {}
        self._lock = Lock()

    def get_or_create(self, session_id: str, default_language: LanguageCode = LanguageCode.EN) -> ConversationSession:
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                session = ConversationSession(session_id=session_id, language=default_language)
                self._sessions[session_id] = session
            return session

    def save(self, session: ConversationSession) -> None:
        with self._lock:
            self._sessions[session.session_id] = session

