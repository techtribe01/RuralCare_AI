from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class LanguageCode(str, Enum):
    EN = "en"
    TE = "te"


class IntentLabel(str, Enum):
    HEALTH_INFORMATION = "health_information"
    SYMPTOM_GUIDANCE = "symptom_guidance"
    APPOINTMENT_BOOKING = "appointment_booking"
    HOSPITAL_SEARCH = "hospital_search"
    DOCTOR_SEARCH = "doctor_search"
    GENERAL_INFORMATION = "general_information"
    EMERGENCY = "emergency"
    HUMAN_ESCALATION = "human_escalation"


class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    EMERGENCY = "emergency"


class AgentEventStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ConversationRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class LanguageDetection(BaseModel):
    language: LanguageCode
    confidence: float = Field(ge=0.0, le=1.0)


class IntentClassification(BaseModel):
    intent: IntentLabel
    confidence: float = Field(ge=0.0, le=1.0)


class SourceReference(BaseModel):
    document_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    source: str = Field(min_length=1)
    version: str = Field(min_length=1)
    topic: str = Field(min_length=1)
    section: str | None = None
    relevance: float = Field(ge=0.0, le=1.0, default=0.0)


class SafetyAssessment(BaseModel):
    risk_level: RiskLevel
    reason_code: str = Field(min_length=1)
    requires_escalation: bool = False
    recommended_action: str = Field(min_length=1)


class AgentResponse(BaseModel):
    message: str = Field(min_length=1)
    next_action: str = Field(min_length=1)
    requires_followup: bool = False
    sources: list[SourceReference] = Field(default_factory=list)
    appointment_payload: dict | None = None


class AgentEvent(BaseModel):
    node: str = Field(min_length=1)
    status: AgentEventStatus
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    duration_ms: int | None = Field(default=None, ge=0)
    detail: str | None = None


class ConversationTurn(BaseModel):
    role: ConversationRole
    message: str = Field(min_length=1)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str = Field(min_length=1)
    language: LanguageCode | None = None
    # Optional structured appointment-flow selections. These let the Assistant UI drive
    # the same LangGraph appointment flow by clicking cards/buttons instead of typing,
    # without ever letting the frontend book directly -- book_appointment() is still
    # only reachable through the graph's confirmation-gated tool call.
    selected_hospital_id: str | None = None
    selected_doctor_id: str | None = None
    selected_slot_id: str | None = None
    confirm_booking: bool = False

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        message = value.strip()
        if not message:
            raise ValueError("message must not be empty")
        return message


class ChatResponse(BaseModel):
    session_id: str
    message: str
    language: LanguageCode
    intent: IntentLabel
    risk_level: RiskLevel | None = None
    safety_reason_code: str | None = None
    human_escalation_required: bool = False
    sources: list[SourceReference] = Field(default_factory=list)
    appointment: dict | None = None
    agent_events: list[AgentEvent]

