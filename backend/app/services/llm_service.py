from __future__ import annotations

from functools import cached_property
import json
import re
from typing import Any, TypeVar

from openai import OpenAI
from pydantic import BaseModel, ValidationError

from app.config.settings import Settings, get_settings
from app.models.schemas import AgentResponse, IntentClassification, IntentLabel, LanguageCode, LanguageDetection

TModel = TypeVar("TModel", bound=BaseModel)


class LLMServiceError(RuntimeError):
    pass


class LLMService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    @cached_property
    def _client(self) -> OpenAI | None:
        if not self.settings.openai_api_key:
            return None
        kwargs: dict[str, Any] = {"api_key": self.settings.openai_api_key, "timeout": 15.0}
        if self.settings.openai_base_url:
            kwargs["base_url"] = self.settings.openai_base_url
        return OpenAI(**kwargs)

    @property
    def available(self) -> bool:
        return self._client is not None

    def generate(
        self,
        *,
        instructions: str,
        input_text: str,
        model: str | None = None,
        temperature: float = 0.2,
    ) -> str:
        if self._client is None:
            return self._offline_generate(instructions=instructions, input_text=input_text)

        try:
            response = self._client.chat.completions.create(
                model=model or self.settings.openai_model,
                messages=[
                    {"role": "system", "content": instructions},
                    {"role": "user", "content": input_text},
                ],
                temperature=temperature,
                top_p=self.settings.openai_top_p,
                max_tokens=self.settings.openai_max_tokens,
            )
        except Exception as exc:  # pragma: no cover - network/client errors
            raise LLMServiceError("The language model request failed.") from exc

        text = (response.choices[0].message.content or "").strip()
        if not text:
            raise LLMServiceError("The language model returned an empty response.")
        return text

    def generate_structured(
        self,
        model_type: type[TModel],
        *,
        instructions: str,
        input_text: str,
        model: str | None = None,
        temperature: float = 0.0,
    ) -> TModel:
        if self._client is None:
            return self._offline_structured(model_type, input_text=input_text)

        schema = model_type.model_json_schema()
        structured_instructions = (
            f"{instructions}\n"
            "Return ONLY valid JSON that matches the schema below. "
            "Do not include markdown fences or any extra commentary.\n"
            f"{json.dumps(schema, ensure_ascii=False)}"
        )
        try:
            response = self._client.chat.completions.create(
                model=model or self.settings.openai_model,
                messages=[
                    {"role": "system", "content": structured_instructions},
                    {"role": "user", "content": input_text},
                ],
                temperature=temperature,
                top_p=self.settings.openai_top_p,
                max_tokens=self.settings.openai_max_tokens,
            )
            payload = _extract_json_payload(response.choices[0].message.content or "")
            if not payload:
                raise LLMServiceError("The language model returned empty structured output.")
            return model_type.model_validate_json(payload)
        except ValidationError as exc:
            raise LLMServiceError("The language model returned invalid structured output.") from exc
        except LLMServiceError:
            raise
        except Exception as exc:  # pragma: no cover - network/client errors
            raise LLMServiceError("The language model request failed.") from exc

    def _offline_generate(self, *, instructions: str, input_text: str) -> str:
        return self._fallback_response(instructions=instructions, input_text=input_text).message

    def _offline_structured(self, model_type: type[TModel], *, input_text: str) -> TModel:
        payload: dict[str, Any]
        if model_type is LanguageDetection:
            payload = self._detect_language_payload(input_text)
        elif model_type is IntentClassification:
            payload = self._classify_intent_payload(input_text)
        elif model_type is AgentResponse:
            payload = self._agent_response_payload(input_text)
        else:
            payload = {}
        return model_type.model_validate(payload)

    def _fallback_response(self, *, instructions: str, input_text: str) -> AgentResponse:
        payload = self._agent_response_payload(f"{instructions}\n{input_text}")
        return AgentResponse.model_validate(payload)

    def _detect_language_payload(self, input_text: str) -> dict[str, Any]:
        if re.search(r"[\u0C00-\u0C7F]", input_text):
            return {"language": LanguageCode.TE, "confidence": 0.99}
        return {"language": LanguageCode.EN, "confidence": 0.92}

    def _classify_intent_payload(self, input_text: str) -> dict[str, Any]:
        lowered = input_text.lower()
        intent = IntentLabel.GENERAL_INFORMATION
        confidence = 0.7
        # "hospital" is checked first: an explicit ask about hospitals (e.g. "Which
        # hospitals have cardiologists?") should route to hospital search even though it
        # also mentions a specialty, matching the PRD's hospital-search scenario.
        if "hospital" in lowered or "ఆసుపత్రి" in input_text:
            intent = IntentLabel.HOSPITAL_SEARCH
            confidence = 0.95
        elif any(
            keyword in lowered
            for keyword in (
                "book", "booking", "appointment", "doctor", "doctor visit", "slot", "physician", "specialist",
                "consult", "consultation", "checkup", "check-up", "pediatrician", "paediatrician",
                "cardiologist", "dermatologist", "gynecologist", "gynaecologist", "orthopedic",
                "orthopaedic", "see a doctor",
            )
        ) or any(
            keyword in input_text
            for keyword in (
                "వైద్యుడు", "డాక్టర్", "డాక్టరు", "అపాయింట్‌మెంట్", "పీడియాట్రిషియన్",
                "శిశువైద్యుడు", "కార్డియాలజిస్ట్", "గైనకాలజిస్ట్",
            )
        ):
            intent = IntentLabel.APPOINTMENT_BOOKING
            confidence = 0.96
        elif any(keyword in lowered for keyword in ("emergency", "ambulance", "unconscious", "cannot breathe", "can't breathe", "chest pain")):
            intent = IntentLabel.EMERGENCY
            confidence = 0.98
        elif any(keyword in lowered for keyword in ("human", "agent", "person", "escalate")):
            intent = IntentLabel.HUMAN_ESCALATION
            confidence = 0.9
        elif any(keyword in lowered for keyword in ("fever", "cough", "pain", "weak", "symptom", "nausea", "headache", "problem")):
            intent = IntentLabel.SYMPTOM_GUIDANCE
            confidence = 0.88
        elif any(keyword in lowered for keyword in ("what is", "tell me", "information", "health", "cause")):
            intent = IntentLabel.HEALTH_INFORMATION
            confidence = 0.84
        return {"intent": intent, "confidence": confidence}

    def _agent_response_payload(self, input_text: str) -> dict[str, Any]:
        lowered = input_text.lower()
        language = LanguageCode.TE if re.search(r"[\u0C00-\u0C7F]", input_text) else LanguageCode.EN
        if "appointment_booking" in lowered:
            if language == LanguageCode.TE:
                return {
                    "message": "ఈ ఫీచర్ అపాయింట్‌మెంట్ దశలో అందుబాటులో ఉంటుంది.",
                    "next_action": "appointment_booking_unavailable",
                    "requires_followup": False,
                }
            return {
                "message": "This feature will be available in the appointment stage.",
                "next_action": "appointment_booking_unavailable",
                "requires_followup": False,
            }
        if "doctor_search" in lowered or "hospital_search" in lowered:
            if language == LanguageCode.TE:
                return {
                    "message": "ఈ శోధన సామర్థ్యం తరువాతి దశలో అందుబాటులో ఉంటుంది.",
                    "next_action": "search_unavailable",
                    "requires_followup": False,
                }
            return {
                "message": "This search capability will be available in a later stage.",
                "next_action": "search_unavailable",
                "requires_followup": False,
            }
        if "emergency" in lowered:
            if language == LanguageCode.TE:
                return {
                    "message": "ఇది అత్యవసర పరిస్థితి అని అనుకుంటే, దయచేసి వెంటనే స్థానిక అత్యవసర సేవలను సంప్రదించండి.",
                    "next_action": "escalate_to_local_emergency_services",
                    "requires_followup": False,
                }
            return {
                "message": "If this is a medical emergency, contact local emergency services or seek urgent care immediately.",
                "next_action": "escalate_to_local_emergency_services",
                "requires_followup": False,
            }
        if "human_escalation" in lowered:
            if language == LanguageCode.TE:
                return {
                    "message": "మానవ సహాయ మార్గం తరువాతి దశలో అందుబాటులో ఉంటుంది.",
                    "next_action": "human_escalation_unavailable",
                    "requires_followup": False,
                }
            return {
                "message": "A human escalation path will be available in a later stage.",
                "next_action": "human_escalation_unavailable",
                "requires_followup": False,
            }

        if language == LanguageCode.TE:
            return {
                "message": "ధన్యవాదాలు. మీ లక్షణాలను కొంచెం వివరంగా చెప్పండి, నేను తదుపరి సరైన దిశను సూచిస్తాను.",
                "next_action": "collect_more_context",
                "requires_followup": True,
            }
        return {
            "message": "Thanks. Tell me a little more about your symptoms and I will help with the next appropriate step.",
            "next_action": "collect_more_context",
            "requires_followup": True,
        }


def _extract_json_payload(text: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        return cleaned

    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned, flags=re.IGNORECASE)
    if fenced:
        cleaned = fenced.group(1).strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        return cleaned[start : end + 1]
    return cleaned
