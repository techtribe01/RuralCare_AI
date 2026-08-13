from __future__ import annotations

from time import perf_counter
from typing import Callable

from langgraph.graph import END, START, StateGraph

from app.models.schemas import (
    AgentEvent,
    AgentEventStatus,
    AgentResponse,
    IntentLabel,
    RiskLevel,
    SourceReference,
)
from app.db.session import SessionLocal
from app.models.state import AgentState
from app.safety.classifier import classify_risk
from app.services.appointment_flow import ACTIVE_APPOINTMENT_STEPS, AppointmentFlowEngine
from app.services.intent_service import IntentService
from app.services.language_service import LanguageService
from app.services.llm_service import LLMService
from app.services.rag_service import RAGService

_APPOINTMENT_INTENTS = {
    IntentLabel.APPOINTMENT_BOOKING.value,
    IntentLabel.HOSPITAL_SEARCH.value,
    IntentLabel.DOCTOR_SEARCH.value,
}


class AgentGraphFactory:
    def __init__(
        self,
        llm_service: LLMService,
        language_service: LanguageService,
        intent_service: IntentService,
        rag_service: RAGService | None = None,
    ) -> None:
        self.llm_service = llm_service
        self.language_service = language_service
        self.intent_service = intent_service
        self.rag_service = rag_service or RAGService()
        self.appointment_flow_engine = AppointmentFlowEngine()

    def build(self):
        graph = StateGraph(AgentState)
        graph.add_node("input_normalizer", self._input_normalizer)
        graph.add_node("language_detection", self._language_detection)
        graph.add_node("intent_classifier", self._intent_classifier)
        graph.add_node("symptom_extraction", self._symptom_extraction)
        graph.add_node("safety_assessment", self._safety_assessment)
        graph.add_node("appointment_orchestrator", self._appointment_orchestrator)
        graph.add_node("retrieval_decision", self._retrieval_decision)
        graph.add_node("retrieval", self._retrieval)
        graph.add_node("evidence_validation", self._evidence_validation)
        graph.add_node("human_escalation", self._human_escalation)
        graph.add_node("emergency", self._emergency)
        graph.add_node("response_generator", self._response_generator)

        graph.add_edge(START, "input_normalizer")
        graph.add_edge("input_normalizer", "language_detection")
        graph.add_edge("language_detection", "intent_classifier")
        graph.add_edge("intent_classifier", "safety_assessment")
        graph.add_conditional_edges(
            "safety_assessment",
            self._route_after_safety,
            {
                "emergency": "emergency",
                "human_escalation": "human_escalation",
                "appointment": "appointment_orchestrator",
                "symptom_extraction": "symptom_extraction",
            },
        )
        graph.add_edge("symptom_extraction", "retrieval_decision")
        graph.add_conditional_edges(
            "retrieval_decision",
            self._route_after_retrieval,
            {"retrieve": "retrieval", "response": "response_generator"},
        )
        graph.add_edge("retrieval", "evidence_validation")
        graph.add_edge("evidence_validation", "response_generator")
        graph.add_edge("human_escalation", "response_generator")
        graph.add_edge("emergency", "response_generator")
        graph.add_edge("appointment_orchestrator", "response_generator")
        graph.add_edge("response_generator", END)
        return graph.compile()

    def _add_event(self, state: AgentState, node: str, started_at: float, detail: str | None = None) -> list[object]:
        duration_ms = int((perf_counter() - started_at) * 1000)
        events = list(state.get("agent_events", []))
        events.append(
            AgentEvent(
                node=node,
                status=AgentEventStatus.COMPLETED,
                duration_ms=duration_ms,
                detail=detail,
            )
        )
        return events

    def _input_normalizer(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        normalized = (state.get("user_message") or "").strip()
        return {
            "user_message": normalized,
            "normalized_message": normalized,
            "current_step": "language_detection",
            "agent_events": self._add_event(state, "input_normalizer", started_at, detail="User input normalized."),
        }

    def _language_detection(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        history = state.get("conversation_history", [])
        detection = self.language_service.detect(
            state.get("normalized_message", state.get("user_message", "")),
            preferred_language=state.get("language", None),
            history=history,
        )
        return {
            "language": detection.language.value,
            "language_confidence": detection.confidence,
            "current_step": "intent_classifier",
            "agent_events": self._add_event(state, "language_detection", started_at, detail=f"Detected language: {detection.language.value}."),
        }

    def _intent_classifier(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        history = state.get("conversation_history", [])
        classification = self.intent_service.classify(
            state.get("normalized_message", state.get("user_message", "")),
            language=state.get("language", "en"),
            history=history,
        )
        return {
            "intent": classification.intent.value,
            "intent_confidence": classification.confidence,
            "route_name": classification.intent.value,
            "current_step": "safety_assessment",
            "agent_events": self._add_event(state, "intent_classifier", started_at, detail=f"Classified intent: {classification.intent.value}."),
        }

    def _symptom_extraction(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        message = state.get("normalized_message", state.get("user_message", ""))
        keywords = [
            "fever", "headache", "cough", "pain", "nausea", "vomiting", "diarrhea", "fatigue",
            "weakness", "shortness of breath", "dizziness", "confusion", "rash",
        ]
        symptoms = [keyword for keyword in keywords if keyword in message.lower()]
        return {
            "symptoms": symptoms,
            "symptom_context": message,
            "current_step": "retrieval_decision",
            "agent_events": self._add_event(state, "symptom_extraction", started_at, detail=f"Extracted symptoms: {symptoms or 'none detected'}."),
        }

    def _safety_assessment(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        message = state.get("normalized_message", state.get("user_message", ""))
        symptoms = state.get("symptoms", [])
        assessment = classify_risk(message, symptoms=symptoms, context={"notes": []})
        return {
            "risk_level": assessment.risk_level.value,
            "safety_reason_code": assessment.reason_code,
            "human_escalation_required": assessment.requires_escalation,
            "safety_assessment": assessment.model_dump(),
            "current_step": "route_after_safety",
            "agent_events": self._add_event(state, "safety_assessment", started_at, detail=f"Risk classified as {assessment.risk_level.value}."),
        }

    def _appointment_orchestrator(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        db = SessionLocal()
        try:
            result = self.appointment_flow_engine.run(db, state=state)
        finally:
            db.close()

        events = list(state.get("agent_events", []))
        for node_name, detail in result.events:
            events.append(AgentEvent(node=node_name, status=AgentEventStatus.COMPLETED, detail=detail))
        events = self._add_event(
            {**state, "agent_events": events}, "appointment_orchestrator", started_at, detail="Appointment flow step completed."
        )

        return {
            "care_context": result.care_context,
            "next_action": result.next_action,
            "current_step": "response_generator",
            "agent_events": events,
            "appointment_flow_result": {
                "message": result.message,
                "next_action": result.next_action,
                "requires_followup": result.requires_followup,
                "appointment_payload": result.appointment_payload,
            },
        }

    def _retrieval_decision(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        intent = state.get("intent", "general_information")
        message = state.get("normalized_message", state.get("user_message", ""))
        if intent == IntentLabel.HUMAN_ESCALATION.value:
            decision = "response"
        else:
            decision = "retrieve" if self.rag_service.should_retrieve(intent, message) else "response"
        return {
            "retrieval_decision": decision,
            "current_step": decision,
            "agent_events": self._add_event(state, "retrieval_decision", started_at, detail=f"Retrieval decision: {decision}."),
        }

    def _route_after_safety(self, state: AgentState) -> str:
        risk_level = (state.get("risk_level") or RiskLevel.LOW.value).lower()
        if risk_level == RiskLevel.EMERGENCY.value:
            return "emergency"
        if risk_level == RiskLevel.HIGH.value:
            return "human_escalation"

        intent = state.get("intent", IntentLabel.GENERAL_INFORMATION.value)
        care_context = state.get("care_context") or {}
        if intent in _APPOINTMENT_INTENTS or care_context.get("step") in ACTIVE_APPOINTMENT_STEPS:
            return "appointment"
        return "symptom_extraction"

    def _route_after_retrieval(self, state: AgentState) -> str:
        return state.get("retrieval_decision", "response")

    def _retrieval(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        query = state.get("normalized_message", state.get("user_message", ""))
        language = state.get("language", "en")
        results = self.rag_service.retrieve(query, language=language, limit=5)
        valid = self.rag_service.validate_evidence(results, min_score=0.01)
        sources = self.rag_service.build_sources(valid)
        return {
            "retrieved_evidence": valid,
            "sources": [source.model_dump() for source in sources],
            "retrieved_context": [item.get("text", "") for item in valid],
            "current_step": "evidence_validation",
            "agent_events": self._add_event(state, "retrieval", started_at, detail=f"Retrieved {len(valid)} evidence chunks."),
        }

    def _evidence_validation(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        evidence = state.get("retrieved_evidence", [])
        valid = self.rag_service.validate_evidence(evidence, min_score=0.01)
        if not valid:
            return {
                "retrieved_evidence": [],
                "sources": [],
                "current_step": "response_generator",
                "agent_events": self._add_event(state, "evidence_validation", started_at, detail="No evidence met the relevance threshold."),
            }
        return {
            "retrieved_evidence": valid,
            "current_step": "response_generator",
            "agent_events": self._add_event(state, "evidence_validation", started_at, detail="Evidence validated against source and relevance checks."),
        }

    def _human_escalation(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        return {
            "human_escalation_required": True,
            "next_action": "human_review_requested",
            "current_step": "response_generator",
            "agent_events": self._add_event(state, "human_escalation", started_at, detail="Escalation workflow prepared for human review."),
        }

    def _emergency(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        return {
            "human_escalation_required": True,
            "next_action": "urgent_attention_required",
            "current_step": "response_generator",
            "agent_events": self._add_event(state, "emergency", started_at, detail="Emergency pathway activated; normal flow interrupted."),
        }

    def _response_generator(self, state: AgentState) -> AgentState:
        started_at = perf_counter()
        agent_events = list(state.get("agent_events", []))

        appointment_flow_result = state.get("appointment_flow_result")
        if appointment_flow_result:
            sources = state.get("sources", [])
            response = AgentResponse(
                message=appointment_flow_result["message"],
                next_action=appointment_flow_result["next_action"],
                requires_followup=appointment_flow_result["requires_followup"],
                sources=[SourceReference.model_validate(item) for item in sources] if sources else [],
                appointment_payload=appointment_flow_result.get("appointment_payload"),
            )
            response_events = self._add_event(
                {**state, "agent_events": agent_events}, "response_generator", started_at, detail="Generated appointment flow response."
            )
            return {
                "response": response,
                "next_action": response.next_action,
                "current_step": "response_generator",
                "agent_events": response_events,
            }

        language = state.get("language", "en")
        risk_level = str(state.get("risk_level") or RiskLevel.LOW.value).lower()
        evidence = state.get("retrieved_evidence", [])
        sources = state.get("sources", [])

        if risk_level == RiskLevel.EMERGENCY.value:
            response = AgentResponse(
                message=(
                    "This situation may require immediate professional attention. Call emergency or urgent care services right away and avoid delaying help."
                    if language == "en"
                    else "ఈ పరిస్థితి వెంటనే ప్రొఫెషనల్ సహాయం అవసరం కావచ్చు. అత్యవసర సేవలను వెంటనే సంప్రదించండి."
                ),
                next_action="urgent_attention_required",
                requires_followup=False,
                sources=[SourceReference.model_validate(item) for item in sources],
            )
        elif state.get("human_escalation_required"):
            response = AgentResponse(
                message=(
                    "A human review has been requested because the reported information may need a careful clinical assessment."
                    if language == "en"
                    else "మానవ పర్యవేక్షణను అభ్యర్థించాము, ఎందుకంటే సమాచారాన్ని శ్రద్ధతో క్లినికల్ అంచనా అవసరం కావచ్చు."
                ),
                next_action="human_review_requested",
                requires_followup=True,
                sources=[SourceReference.model_validate(item) for item in sources],
            )
        elif evidence:
            excerpts = " ".join(item.get("text", "") for item in evidence[:3])
            response = AgentResponse(
                message=(
                    f"Based on approved health guidance, the most relevant material suggests a careful review of your symptoms. "
                    f"Use this information as a starting point and consider the warning signs: {excerpts[:500]}"
                    if language == "en"
                    else f"అనుమోదించిన ఆరోగ్య మార్గదర్శకాల ఆధారంగా, మీ లక్షణాలపై జాగ్రత్తగా పరిశీలించడం సరైనది. {excerpts[:500]}"
                ),
                next_action="review_guidance",
                requires_followup=True,
                sources=[SourceReference.model_validate(item) for item in sources],
            )
        else:
            fallback_message = (
                "Thanks. Please share a little more detail about your symptoms so I can give the safest next step."
                if language == "en"
                else "ధన్యవాదాలు. మీ లక్షణాల గురించి మరిన్ని వివరాలు చెప్పండి, నేను అత్యంత సురక్షితమైన తదుపరి చర్యను సూచిస్తాను."
            )
            response = AgentResponse(
                message=fallback_message,
                next_action="collect_more_context",
                requires_followup=True,
                sources=[],
            )

        if not response.sources and not sources:
            response.sources = []

        response_events = self._add_event({**state, "agent_events": agent_events}, "response_generator", started_at, detail="Generated grounded response with evidence metadata.")
        return {
            "response": response,
            "next_action": response.next_action,
            "current_step": "response_generator",
            "agent_events": response_events,
        }

