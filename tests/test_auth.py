from __future__ import annotations

from fastapi.testclient import TestClient

from app.services.twilio_verify_service import TwilioVerifyService, TwilioVerifyError


# ---------------------------------------------------------------------------
# TEST 1 -- New user enters phone -> OTP sent
# ---------------------------------------------------------------------------
def test_send_otp_returns_verification_sent(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(TwilioVerifyService, "start_verification", lambda self, phone_number: None)

    response = client.post("/api/auth/send-otp", json={"phone_number": "+15550001111"})
    assert response.status_code == 200
    assert response.json() == {"status": "verification_sent"}


def test_send_otp_rejects_non_e164_number(client: TestClient) -> None:
    response = client.post("/api/auth/send-otp", json={"phone_number": "0000000000"})
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_phone"


# ---------------------------------------------------------------------------
# TEST 2 -- Correct OTP -> phone verified
# ---------------------------------------------------------------------------
def test_verify_otp_with_correct_code_succeeds(client: TestClient, login) -> None:
    user_id = login("+15550002222")
    assert user_id

    session_response = client.get("/api/auth/session")
    assert session_response.status_code == 200
    body = session_response.json()
    assert body == {"is_authenticated": True, "user_id": user_id, "phone_verified": True}


def test_verify_otp_sets_httponly_session_cookie(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(TwilioVerifyService, "start_verification", lambda self, phone_number: None)
    monkeypatch.setattr(TwilioVerifyService, "check_verification", lambda self, phone_number, code: True)

    response = client.post("/api/auth/verify-otp", json={"phone_number": "+15550002223", "code": "123456"})
    assert response.status_code == 200
    assert "ruralcare_session" in response.cookies


def test_verify_otp_does_not_duplicate_user_for_same_phone(client: TestClient, login) -> None:
    first_id = login("+15550002224")
    second_id = login("+15550002224")
    assert first_id == second_id


# ---------------------------------------------------------------------------
# TEST 3 -- Incorrect OTP -> verification rejected
# ---------------------------------------------------------------------------
def test_verify_otp_with_incorrect_code_is_rejected(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(TwilioVerifyService, "check_verification", lambda self, phone_number, code: False)

    response = client.post("/api/auth/verify-otp", json={"phone_number": "+15550003333", "code": "000000"})
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_code"
    assert "ruralcare_session" not in response.cookies


# ---------------------------------------------------------------------------
# TEST 4 -- Appointment intent before authentication -> auth flow starts
# ---------------------------------------------------------------------------
def test_unauthenticated_booking_request_returns_401(client: TestClient) -> None:
    doctors = client.get("/appointments/doctors", params={"specialty": "General Medicine"}).json()
    doctor = doctors[0]
    slots = client.get("/appointments/slots", params={"doctor_id": doctor["doctor_id"]}).json()
    slot = slots[0]

    response = client.post(
        "/appointments/book",
        json={
            "doctor_id": doctor["doctor_id"],
            "hospital_id": doctor["hospital_id"],
            "slot_id": slot["slot_id"],
            "confirmation": True,
        },
    )
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "unauthenticated"


def test_appointment_flow_pauses_for_auth_and_resumes_after_verification(test_db) -> None:
    """Exercises the appointment_flow.py gate directly (TEST 4 / TEST 5): a chat booking
    parked at await_confirmation pauses for auth without losing the proposed appointment,
    then completes once an authenticated_user_id is present -- without re-collecting the
    doctor/hospital/slot the user already chose."""
    from app.services.appointment_flow import AppointmentFlowEngine

    _, factory, _ = test_db
    db = factory()
    engine = AppointmentFlowEngine()
    care_context = {
        "specialty": "General Medicine",
        "hospital_id": "hosp-test-001",
        "doctor_id": "doc-test-001",
        "slot_id": "slot-test-001",
        "step": "await_confirmation",
        "proposed_appointment": {"doctor_id": "doc-test-001"},
    }
    base_state = {
        "normalized_message": "confirm",
        "user_message": "confirm",
        "language": "en",
        "channel": "chat",
        "confirm_booking": True,
        "care_context": care_context,
    }

    unauth_result = engine.run(db, state={**base_state, "authenticated_user_id": None})
    assert unauth_result.next_action == "auth_required"
    assert unauth_result.appointment_payload["type"] == "auth_required"
    assert unauth_result.care_context.get("step") == "await_confirmation"
    assert unauth_result.care_context.get("doctor_id") == "doc-test-001"

    auth_result = engine.run(
        db,
        state={**base_state, "care_context": unauth_result.care_context, "authenticated_user_id": "test-verified-user"},
    )
    assert auth_result.next_action == "appointment_confirmed"
    assert auth_result.appointment_payload["type"] == "booked"
    assert auth_result.appointment_payload["appointment"]["user_id"] == "test-verified-user"
    db.close()


def test_appointment_flow_sms_channel_is_not_gated_by_auth(test_db) -> None:
    """SMS/voice already assert identity via Twilio's inbound webhook, so those channels
    keep booking under their existing session id without needing authenticated_user_id."""
    from app.services.appointment_flow import AppointmentFlowEngine

    _, factory, _ = test_db
    db = factory()
    engine = AppointmentFlowEngine()
    care_context = {
        "specialty": "Cardiology",
        "hospital_id": "hosp-test-001",
        "doctor_id": "doc-test-002",
        "slot_id": "slot-test-003",
        "step": "await_confirmation",
        "proposed_appointment": {"doctor_id": "doc-test-002"},
    }
    result = engine.run(
        db,
        state={
            "normalized_message": "yes",
            "user_message": "yes",
            "language": "en",
            "channel": "sms",
            "user_id": "sms:+15550005555",
            "confirm_booking": True,
            "care_context": care_context,
            "authenticated_user_id": None,
        },
    )
    assert result.next_action == "appointment_confirmed"
    assert result.appointment_payload["appointment"]["user_id"] == "sms:+15550005555"
    db.close()


# ---------------------------------------------------------------------------
# TEST 6 -- Authenticated user books appointment -> succeeds if slot available
# ---------------------------------------------------------------------------
def test_authenticated_booking_succeeds(authenticated_client) -> None:
    client, user_id = authenticated_client
    doctors = client.get("/appointments/doctors", params={"specialty": "General Medicine"}).json()
    doctor = doctors[0]
    slots = client.get("/appointments/slots", params={"doctor_id": doctor["doctor_id"]}).json()
    slot = slots[0]

    response = client.post(
        "/appointments/book",
        json={
            "doctor_id": doctor["doctor_id"],
            "hospital_id": doctor["hospital_id"],
            "slot_id": slot["slot_id"],
            "confirmation": True,
        },
    )
    assert response.status_code == 200
    assert response.json()["user_id"] == user_id


# ---------------------------------------------------------------------------
# TEST 8 -- Cross-user cancellation is rejected
# ---------------------------------------------------------------------------
def test_cross_user_cancellation_is_rejected(client: TestClient, login) -> None:
    doctors = client.get("/appointments/doctors", params={"specialty": "Cardiology"}).json()
    doctor = doctors[0]
    slots = client.get("/appointments/slots", params={"doctor_id": doctor["doctor_id"]}).json()
    slot = slots[0]

    login("+15550008881")
    book = client.post(
        "/appointments/book",
        json={
            "doctor_id": doctor["doctor_id"],
            "hospital_id": doctor["hospital_id"],
            "slot_id": slot["slot_id"],
            "confirmation": True,
        },
    )
    assert book.status_code == 200
    appointment_id = book.json()["appointment_id"]

    login("+15550008882")
    cancel = client.post(f"/appointments/{appointment_id}/cancel", json={"confirmation": True})
    assert cancel.status_code == 403
    assert cancel.json()["detail"]["code"] == "forbidden"


# ---------------------------------------------------------------------------
# TEST 9 -- Repeated OTP requests are rate-limited (surfaced from Twilio, not our own limiter)
# ---------------------------------------------------------------------------
def test_repeated_otp_requests_are_rate_limited(client: TestClient, monkeypatch) -> None:
    def _raise_rate_limited(self, phone_number):
        raise TwilioVerifyError("rate_limited", "Too many verification attempts. Please try again later.")

    monkeypatch.setattr(TwilioVerifyService, "start_verification", _raise_rate_limited)

    response = client.post("/api/auth/send-otp", json={"phone_number": "+15550009999"})
    assert response.status_code == 429
    assert response.json()["detail"]["code"] == "rate_limited"


# ---------------------------------------------------------------------------
# TEST 10 -- Expired/invalid OTP is rejected gracefully
# ---------------------------------------------------------------------------
def test_expired_otp_is_rejected_gracefully(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(TwilioVerifyService, "check_verification", lambda self, phone_number, code: False)

    response = client.post("/api/auth/verify-otp", json={"phone_number": "+15550001010", "code": "999999"})
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_code"
    assert "Twilio" not in response.text


def test_logout_revokes_session(client: TestClient, login) -> None:
    login("+15550001212")
    assert client.get("/api/auth/session").json()["is_authenticated"] is True

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 200

    assert client.get("/api/auth/session").json() == {"is_authenticated": False}
