from __future__ import annotations

import pytest

from app.config.settings import Settings
from app.models.schemas import AgentEventStatus, IntentLabel, LanguageCode, LanguageDetection
from app.services.agent_service import AgentService, AgentServiceError
from app.services.intent_service import IntentService
from app.services.language_service import LanguageService
from app.services.llm_service import LLMService, LLMServiceError


def build_service() -> AgentService:
    return AgentService.create(llm_service=LLMService(settings=Settings(openai_api_key=None)))


def test_language_detection_detects_telugu() -> None:
    service = LanguageService(LLMService(settings=Settings(openai_api_key=None)))
    result = service.detect('నాకు జ్వరం ఉంది')
    assert result.language == LanguageCode.TE
    assert result.confidence >= 0.9


def test_intent_classification_detects_booking() -> None:
    service = IntentService(LLMService(settings=Settings(openai_api_key=None)))
    result = service.classify('I want to book a doctor.', language='en')
    assert result.intent == IntentLabel.APPOINTMENT_BOOKING
    assert result.confidence >= 0.9


def test_graph_routes_appointment_booking() -> None:
    service = build_service()
    response = service.handle_chat(type('Request', (), {'session_id': 'session-1', 'message': 'I want to book a doctor.', 'language': None})())
    assert response.intent == IntentLabel.APPOINTMENT_BOOKING
    # Stage 4: the appointment flow is real -- since no specialty was mentioned yet,
    # the agent asks which type of doctor is needed instead of returning a placeholder.
    assert response.appointment is not None
    assert response.appointment['type'] == 'collect_specialty'
    assert any(event.node == 'specialty_prompt' for event in response.agent_events)
    assert response.agent_events[-1].node == 'response_returned'


def test_multi_turn_state_is_preserved() -> None:
    service = build_service()
    first = service.handle_chat(type('Request', (), {'session_id': 'session-2', 'message': 'I have a problem.', 'language': None})())
    second = service.handle_chat(type('Request', (), {'session_id': 'session-2', 'message': 'I have fever.', 'language': None})())
    assert first.session_id == second.session_id == 'session-2'
    assert second.intent == IntentLabel.SYMPTOM_GUIDANCE
    assert len(service.store.get_or_create('session-2').conversation_history) == 4


def test_invalid_input_is_rejected() -> None:
    service = build_service()
    with pytest.raises(AgentServiceError):
        service.handle_chat(type('Request', (), {'session_id': 'session-3', 'message': '   ', 'language': None})())


class BrokenLLMService(LLMService):
    @property
    def available(self) -> bool:  # type: ignore[override]
        return True

    def generate_structured(self, *args, **kwargs):  # type: ignore[override]
        raise LLMServiceError('boom')

    def generate(self, *args, **kwargs):  # type: ignore[override]
        raise LLMServiceError('boom')


def test_llm_failure_handling_falls_back_to_heuristics() -> None:
    service = AgentService.create(llm_service=BrokenLLMService(settings=Settings(openai_api_key='test-key')))
    response = service.handle_chat(type('Request', (), {'session_id': 'session-4', 'message': 'Hello', 'language': None})())
    assert response.intent == IntentLabel.GENERAL_INFORMATION
    assert response.message


def test_structured_output_validation_rejects_invalid_payload() -> None:
    llm_service = LLMService(settings=Settings(openai_api_key='test-key'))

    class FakeCompletions:
        @staticmethod
        def create(**kwargs):
            message = type('Message', (), {'content': '{"language":"en"}'})()
            choice = type('Choice', (), {'message': message})()
            return type('Response', (), {'choices': [choice]})()

    llm_service.__dict__['_client'] = type('Client', (), {'chat': type('Chat', (), {'completions': FakeCompletions()})()})()

    with pytest.raises(LLMServiceError):
        llm_service.generate_structured(LanguageDetection, instructions='detect language', input_text='hello')


def test_agent_event_model_status_values() -> None:
    assert AgentEventStatus.COMPLETED.value == 'completed'
