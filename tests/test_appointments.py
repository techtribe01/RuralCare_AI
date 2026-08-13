from __future__ import annotations

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.config.settings import Settings
from app.main import app
from app.services.agent_service import AgentService, AgentServiceError, get_agent_service
from app.services.appointment_service import AppointmentService, AppointmentValidationError
from app.services.llm_service import LLMService


def build_service() -> AgentService:
    return AgentService.create(llm_service=LLMService(settings=Settings(openai_api_key=None)))


# ---------------------------------------------------------------------------
# TEST 1 — Hospital search
# ---------------------------------------------------------------------------
def test_hospital_search_returns_valid_demo_hospitals(client: TestClient) -> None:
    response = client.get("/appointments/hospitals", params={"specialty": "General Medicine"})
    assert response.status_code == 200
    hospitals = response.json()
    assert len(hospitals) >= 1
    hospital = hospitals[0]
    assert "hospital_id" in hospital
    assert "name" in hospital
    assert "location" in hospital
    assert "specialties" in hospital
    assert "languages" in hospital
    assert hospital["is_demo_data"] is True


def test_hospital_search_filters_by_location(client: TestClient) -> None:
    response = client.get("/appointments/hospitals", params={"location": "Tirupati"})
    assert response.status_code == 200
    hospitals = response.json()
    assert all("Tirupati" in h["location"] for h in hospitals)


# ---------------------------------------------------------------------------
# TEST 2 — Doctor search
# ---------------------------------------------------------------------------
def test_doctor_search_belongs_to_hospital_and_specialty(client: TestClient) -> None:
    hospitals = client.get("/appointments/hospitals", params={"specialty": "General Medicine"}).json()
    hospital_id = hospitals[0]["hospital_id"]

    response = client.get(
        "/appointments/doctors",
        params={"specialty": "General Medicine", "hospital_id": hospital_id},
    )
    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) >= 1
    for doctor in doctors:
        assert doctor["hospital_id"] == hospital_id
        assert doctor["specialty"] == "General Medicine"


# ---------------------------------------------------------------------------
# TEST 3 — Slot search
# ---------------------------------------------------------------------------
def test_slot_search_returns_only_available_slots(client: TestClient) -> None:
    doctors = client.get("/appointments/doctors", params={"specialty": "General Medicine"}).json()
    doctor_id = doctors[0]["doctor_id"]

    response = client.get("/appointments/slots", params={"doctor_id": doctor_id})
    assert response.status_code == 200
    slots = response.json()
    assert len(slots) >= 1
    for slot in slots:
        assert slot["status"] == "AVAILABLE"
        assert slot["doctor_id"] == doctor_id


# ---------------------------------------------------------------------------
# TEST 4 — Booking without confirmation
# ---------------------------------------------------------------------------
def test_booking_without_confirmation_is_rejected(client: TestClient) -> None:
    doctors = client.get("/appointments/doctors", params={"specialty": "General Medicine"}).json()
    doctor = doctors[0]
    slots = client.get("/appointments/slots", params={"doctor_id": doctor["doctor_id"]}).json()
    slot = slots[0]

    response = client.post(
        "/appointments/book",
        json={
            "user_id": "test-user-1",
            "doctor_id": doctor["doctor_id"],
            "hospital_id": doctor["hospital_id"],
            "slot_id": slot["slot_id"],
            "confirmation": False,
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "confirmation_required"


# ---------------------------------------------------------------------------
# TEST 5 — Valid booking
# ---------------------------------------------------------------------------
def test_valid_booking_creates_appointment_and_marks_slot_booked(client: TestClient) -> None:
    doctors = client.get("/appointments/doctors", params={"specialty": "General Medicine"}).json()
    doctor = doctors[0]
    slots = client.get("/appointments/slots", params={"doctor_id": doctor["doctor_id"]}).json()
    slot = slots[0]

    response = client.post(
        "/appointments/book",
        json={
            "user_id": "test-user-book",
            "doctor_id": doctor["doctor_id"],
            "hospital_id": doctor["hospital_id"],
            "slot_id": slot["slot_id"],
            "confirmation": True,
        },
    )
    assert response.status_code == 200
    appointment = response.json()
    assert appointment["status"] == "CONFIRMED"
    assert appointment["booking_id"].startswith("DEMO-")

    slot_check = client.get("/appointments/slots", params={"doctor_id": doctor["doctor_id"]}).json()
    available_ids = {s["slot_id"] for s in slot_check}
    assert slot["slot_id"] not in available_ids


# ---------------------------------------------------------------------------
# TEST 6 — Duplicate booking
# ---------------------------------------------------------------------------
def test_duplicate_booking_is_rejected(client: TestClient) -> None:
    doctors = client.get("/appointments/doctors", params={"specialty": "Cardiology"}).json()
    doctor = doctors[0]
    slots = client.get("/appointments/slots", params={"doctor_id": doctor["doctor_id"]}).json()
    slot = slots[0]

    payload = {
        "user_id": "test-user-dup-1",
        "doctor_id": doctor["doctor_id"],
        "hospital_id": doctor["hospital_id"],
        "slot_id": slot["slot_id"],
        "confirmation": True,
    }
    first = client.post("/appointments/book", json=payload)
    assert first.status_code == 200

    payload["user_id"] = "test-user-dup-2"
    second = client.post("/appointments/book", json=payload)
    assert second.status_code == 409
    assert second.json()["detail"]["code"] == "slot_unavailable"


# ---------------------------------------------------------------------------
# TEST 7 — Cancellation
# ---------------------------------------------------------------------------
def test_cancellation_marks_appointment_cancelled_and_slot_available(client: TestClient) -> None:
    doctors = client.get("/appointments/doctors", params={"specialty": "General Medicine"}).json()
    doctor = doctors[0]
    slots = client.get("/appointments/slots", params={"doctor_id": doctor["doctor_id"]}).json()
    available = [s for s in slots if s["status"] == "AVAILABLE"]
    if not available:
        pytest.skip("No available slots for cancellation test")
    slot = available[0]

    book = client.post(
        "/appointments/book",
        json={
            "user_id": "test-user-cancel",
            "doctor_id": doctor["doctor_id"],
            "hospital_id": doctor["hospital_id"],
            "slot_id": slot["slot_id"],
            "confirmation": True,
        },
    )
    assert book.status_code == 200
    appointment_id = book.json()["appointment_id"]

    cancel = client.post(
        f"/appointments/{appointment_id}/cancel",
        json={"user_id": "test-user-cancel", "confirmation": True},
    )
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "CANCELLED"

    slots_after = client.get("/appointments/slots", params={"doctor_id": doctor["doctor_id"]}).json()
    released = next((s for s in slots_after if s["slot_id"] == slot["slot_id"]), None)
    assert released is not None
    assert released["status"] == "AVAILABLE"


# ---------------------------------------------------------------------------
# TEST 8 — Rescheduling
# ---------------------------------------------------------------------------
def test_rescheduling_releases_old_slot_and_books_new(client: TestClient) -> None:
    doctors = client.get("/appointments/doctors", params={"specialty": "General Medicine"}).json()
    doctor = doctors[0]
    slots = client.get("/appointments/slots", params={"doctor_id": doctor["doctor_id"]}).json()
    available = [s for s in slots if s["status"] == "AVAILABLE"]
    if len(available) < 2:
        pytest.skip("Need at least 2 available slots for reschedule test")
    old_slot, new_slot = available[0], available[1]

    book = client.post(
        "/appointments/book",
        json={
            "user_id": "test-user-reschedule",
            "doctor_id": doctor["doctor_id"],
            "hospital_id": doctor["hospital_id"],
            "slot_id": old_slot["slot_id"],
            "confirmation": True,
        },
    )
    assert book.status_code == 200
    appointment_id = book.json()["appointment_id"]

    reschedule = client.post(
        f"/appointments/{appointment_id}/reschedule",
        json={"user_id": "test-user-reschedule", "new_slot_id": new_slot["slot_id"], "confirmation": True},
    )
    assert reschedule.status_code == 200
    assert reschedule.json()["slot"]["slot_id"] == new_slot["slot_id"]

    slots_after = client.get(
        "/appointments/slots", params={"doctor_id": doctor["doctor_id"], "include_unavailable": True}
    ).json()
    old = next(s for s in slots_after if s["slot_id"] == old_slot["slot_id"])
    new = next(s for s in slots_after if s["slot_id"] == new_slot["slot_id"])
    assert old["status"] == "AVAILABLE"
    assert new["status"] == "BOOKED"


# ---------------------------------------------------------------------------
# TEST 9 — Invalid slot
# ---------------------------------------------------------------------------
def test_invalid_slot_booking_is_rejected_safely(client: TestClient) -> None:
    doctors = client.get("/appointments/doctors", params={"specialty": "General Medicine"}).json()
    doctor = doctors[0]

    response = client.post(
        "/appointments/book",
        json={
            "user_id": "test-user-invalid",
            "doctor_id": doctor["doctor_id"],
            "hospital_id": doctor["hospital_id"],
            "slot_id": "slot-does-not-exist",
            "confirmation": True,
        },
    )
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "slot_not_found"


def test_wrong_doctor_slot_combination_rejected(client: TestClient) -> None:
    doctors = client.get("/appointments/doctors", params={"specialty": "General Medicine"}).json()
    doctor = doctors[0]
    cardio_doctors = client.get("/appointments/doctors", params={"specialty": "Cardiology"}).json()
    cardio_slot = client.get("/appointments/slots", params={"doctor_id": cardio_doctors[0]["doctor_id"]}).json()[0]

    response = client.post(
        "/appointments/book",
        json={
            "user_id": "test-user-mismatch",
            "doctor_id": doctor["doctor_id"],
            "hospital_id": doctor["hospital_id"],
            "slot_id": cardio_slot["slot_id"],
            "confirmation": True,
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_slot_doctor_combination"


# ---------------------------------------------------------------------------
# TEST 10 — SMS
# ---------------------------------------------------------------------------
def test_sms_webhook_resumes_session(client: TestClient) -> None:
    service = build_service()
    app.dependency_overrides[get_agent_service] = lambda: service
    try:
        first = client.post("/sms/webhook", data={"From": "+15551234567", "Body": "BOOK DOCTOR"})
        assert first.status_code == 200
        assert "application/xml" in first.headers["content-type"]
        assert "specialty" in first.text.lower() or "doctor" in first.text.lower()

        second = client.post("/sms/webhook", data={"From": "+15551234567", "Body": "General Medicine"})
        assert second.status_code == 200
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# TEST 11 — Voice failure
# ---------------------------------------------------------------------------
class _BrokenAgentService(AgentService):
    """AgentService is a slots dataclass (no instance __dict__), so a subclass override
    is used here instead of monkeypatching an instance attribute."""

    def handle_chat(self, request, channel="chat"):  # noqa: ANN001
        raise AgentServiceError("Voice unavailable")


def test_voice_failure_provides_fallback(client: TestClient) -> None:
    base = build_service()
    broken = _BrokenAgentService(
        llm_service=base.llm_service,
        language_service=base.language_service,
        intent_service=base.intent_service,
        store=base.store,
        graph=base.graph,
    )
    app.dependency_overrides[get_agent_service] = lambda: broken
    try:
        response = client.post("/sms/webhook", data={"From": "+15559999999", "Body": "hello"})
        assert response.status_code == 200
        assert "unavailable" in response.text.lower() or "demo" in response.text.lower()
    finally:
        app.dependency_overrides.clear()


def test_voice_webhook_returns_twiml(client: TestClient) -> None:
    service = build_service()
    app.dependency_overrides[get_agent_service] = lambda: service
    try:
        response = client.post("/voice/webhook", data={"From": "+15551111111", "CallSid": "CA123"})
        assert response.status_code == 200
        assert "application/xml" in response.headers["content-type"]
        assert "Rural Care" in response.text or "Gather" in response.text
    finally:
        app.dependency_overrides.clear()


def test_voice_processing_with_speech(client: TestClient) -> None:
    service = build_service()
    app.dependency_overrides[get_agent_service] = lambda: service
    try:
        response = client.post(
            "/voice/webhook",
            data={"From": "+15552222222", "CallSid": "CA456", "SpeechResult": "I want a general physician"},
        )
        assert response.status_code == 200
        assert "Say" in response.text or "Gather" in response.text
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# TEST 12 — Multilingual appointment
# ---------------------------------------------------------------------------
def test_multilingual_appointment_uses_same_workflow(client: TestClient) -> None:
    service = build_service()
    app.dependency_overrides[get_agent_service] = lambda: service
    try:
        response = client.post("/chat", json={"session_id": "te-session", "message": "నాకు వైద్యుడిని బుక్ చేయాలి"})
        assert response.status_code == 200
        payload = response.json()
        assert payload["language"] == "te"
        assert payload["intent"] == "appointment_booking"
        assert payload["appointment"] is not None
        assert payload["appointment"]["type"] == "collect_specialty"
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Notification service
# ---------------------------------------------------------------------------
def test_notification_record_created_on_booking(client: TestClient) -> None:
    doctors = client.get("/appointments/doctors", params={"specialty": "Cardiology"}).json()
    doctor = doctors[0]
    slots = client.get("/appointments/slots", params={"doctor_id": doctor["doctor_id"]}).json()
    available = [s for s in slots if s["status"] == "AVAILABLE"]
    if not available:
        pytest.skip("No available slots")
    slot = available[0]

    book = client.post(
        "/appointments/book",
        json={
            "user_id": "test-user-notify",
            "doctor_id": doctor["doctor_id"],
            "hospital_id": doctor["hospital_id"],
            "slot_id": slot["slot_id"],
            "confirmation": True,
        },
    )
    assert book.status_code == 200
    appointment_id = book.json()["appointment_id"]

    notifications = client.get(f"/appointments/{appointment_id}/notifications")
    assert notifications.status_code == 200
    assert len(notifications.json()) >= 1


# ---------------------------------------------------------------------------
# Service-level unit tests
# ---------------------------------------------------------------------------
def test_appointment_service_rejects_unconfirmed_booking(test_db) -> None:
    _, factory, _ = test_db
    db = factory()
    service = AppointmentService()
    with pytest.raises(AppointmentValidationError) as exc:
        service.book_appointment(
            db,
            user_id="u1",
            doctor_id="doc-test-001",
            hospital_id="hosp-test-001",
            slot_id="slot-test-001",
            confirmation=False,
        )
    assert exc.value.code == "confirmation_required"
    db.close()


def test_seed_data_structure(client: TestClient) -> None:
    specialties = client.get("/appointments/specialties").json()
    assert len(specialties) >= 2
    assert all("specialty_id" in s and "name" in s for s in specialties)
