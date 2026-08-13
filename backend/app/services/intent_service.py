from __future__ import annotations

import json
from typing import Any

from app.models.schemas import ConversationTurn, IntentClassification, IntentLabel
from app.services.llm_service import LLMService


class IntentService:
    def __init__(self, llm_service: LLMService) -> None:
        self.llm_service = llm_service

    def classify(
        self,
        message: str,
        *,
        language: str,
        history: list[ConversationTurn] | None = None,
    ) -> IntentClassification:
        if self.llm_service.available:
            prompt = self._build_prompt(message=message, language=language, history=history)
            try:
                return self.llm_service.generate_structured(
                    IntentClassification,
                    instructions=(
                        "Classify the user's intent. Return only structured output. "
                        "Valid intents: health_information, symptom_guidance, appointment_booking, "
                        "hospital_search, doctor_search, general_information, emergency, human_escalation."
                    ),
                    input_text=prompt,
                )
            except Exception:
                pass
        return self._heuristic_classify(message=message, history=history)

    def _heuristic_classify(
        self,
        *,
        message: str,
        history: list[ConversationTurn] | None = None,
    ) -> IntentClassification:
        lowered = message.lower()
        # "hospital" is checked first: an explicit ask about hospitals (e.g. "Which
        # hospitals have cardiologists?") should route to hospital search even though it
        # also mentions a specialty, matching the PRD's hospital-search scenario.
        if "hospital" in lowered or "ఆసుపత్రి" in message:
            return IntentClassification(intent=IntentLabel.HOSPITAL_SEARCH, confidence=0.95)
        if any(
            keyword in lowered
            for keyword in (
                "book", "appointment", "doctor", "slot", "visit", "physician", "specialist",
                "consult", "consultation", "checkup", "check-up", "pediatrician", "paediatrician",
                "cardiologist", "dermatologist", "gynecologist", "gynaecologist", "orthopedic",
                "orthopaedic", "see a doctor",
            )
        ) or any(
            # Telugu keywords -- the heuristic fallback is English-only by default, but
            # these keep the offline (no-OPENAI_API_KEY) path usable for the PRD's
            # required English + Telugu multilingual appointment scenario. When an LLM
            # is configured, generate_structured() understands Telugu natively instead.
            keyword in message
            for keyword in (
                # "వైద్యుడ" is the stem of "వైద్యుడు" (doctor) without the case suffix, so
                # it also matches inflected forms such as "వైద్యుడిని" (to the doctor).
                "వైద్యుడ", "డాక్టర్", "డాక్టరు", "అపాయింట్‌మెంట్", "పీడియాట్రిషియన్", "బుక్",
                "శిశువైద్యుడు", "కార్డియాలజిస్ట్", "గైనకాలజిస్ట్",
            )
        ):
            return IntentClassification(intent=IntentLabel.APPOINTMENT_BOOKING, confidence=0.96)
        if any(keyword in lowered for keyword in ("emergency", "ambulance", "unconscious", "can't breathe", "cannot breathe", "chest pain")):
            return IntentClassification(intent=IntentLabel.EMERGENCY, confidence=0.98)
        if any(keyword in lowered for keyword in ("human", "agent", "person", "escalate")):
            return IntentClassification(intent=IntentLabel.HUMAN_ESCALATION, confidence=0.9)
        if any(keyword in lowered for keyword in ("fever", "cough", "pain", "weak", "symptom", "nausea", "headache")):
            return IntentClassification(intent=IntentLabel.SYMPTOM_GUIDANCE, confidence=0.88)
        if any(keyword in lowered for keyword in ("what is", "tell me", "information", "health", "cause")):
            return IntentClassification(intent=IntentLabel.HEALTH_INFORMATION, confidence=0.84)
        if history and history:
            last_assistant = next((turn for turn in reversed(history) if turn.role.value == "assistant"), None)
            if last_assistant and "symptom" in last_assistant.message.lower():
                return IntentClassification(intent=IntentLabel.SYMPTOM_GUIDANCE, confidence=0.8)
        return IntentClassification(intent=IntentLabel.GENERAL_INFORMATION, confidence=0.7)

    def _build_prompt(
        self,
        *,
        message: str,
        language: str,
        history: list[ConversationTurn] | None,
    ) -> str:
        history_payload: list[dict[str, Any]] = []
        for turn in history or []:
            history_payload.append({"role": turn.role.value, "message": turn.message})
        return json.dumps(
            {
                "message": message,
                "language": language,
                "history": history_payload,
            },
            ensure_ascii=False,
        )

