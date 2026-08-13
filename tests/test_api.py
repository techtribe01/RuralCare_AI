from __future__ import annotations

from fastapi.testclient import TestClient

from app.config.settings import Settings
from app.main import app
from app.services.agent_service import AgentService, get_agent_service
from app.services.llm_service import LLMService


def build_service() -> AgentService:
    return AgentService.create(llm_service=LLMService(settings=Settings(openai_api_key=None)))


def test_health_endpoint() -> None:
    client = TestClient(app)
    response = client.get('/health')
    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] == 'ok'
    assert 'services' in payload
    assert 'llm' in payload['services']


def test_chat_endpoint_returns_response() -> None:
    service = build_service()
    app.dependency_overrides.clear()
    app.dependency_overrides[get_agent_service] = lambda: service

    try:
        client = TestClient(app)
        response = client.post('/chat', json={'session_id': 'api-session', 'message': 'Hello'})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload['session_id'] == 'api-session'
    assert payload['language'] == 'en'
    assert payload['intent'] == 'general_information'
    assert isinstance(payload['agent_events'], list)
    assert payload['agent_events'][0]['node'] == 'input_received'


def test_invalid_input_returns_422() -> None:
    client = TestClient(app)
    response = client.post('/chat', json={'session_id': 'api-session', 'message': '   '})
    assert response.status_code == 422
