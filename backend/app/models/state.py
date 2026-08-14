from __future__ import annotations

from typing import TypedDict

from .schemas import AgentEvent, AgentResponse, ConversationTurn


class AgentState(TypedDict, total=False):
    user_id: str
    session_id: str
    authenticated_user_id: str | None
    channel: str
    language: str
    language_confidence: float
    user_message: str
    normalized_message: str
    intent: str
    intent_confidence: float
    symptoms: list[str]
    symptom_context: str
    risk_level: str
    safety_reason_code: str
    safety_assessment: dict
    human_escalation_required: bool
    retrieval_decision: str
    retrieved_context: list[str]
    retrieved_evidence: list[dict]
    sources: list[dict]
    selected_doctor: str
    selected_slot: str
    selected_hospital_id: str
    selected_doctor_id: str
    selected_slot_id: str
    confirm_booking: bool
    booking_confirmed: bool
    care_context: dict
    appointment_flow_result: dict
    conversation_history: list[ConversationTurn]
    current_step: str
    response: AgentResponse
    next_action: str
    route_name: str
    agent_events: list[AgentEvent]
    response_hint: str

