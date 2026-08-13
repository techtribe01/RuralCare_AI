from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.config.settings import Settings, get_settings
from app.db.models import Appointment, NotificationRecord
from app.models.care_navigation import NotificationResult
from app.models.care_navigation_enums import NotificationStatus


def _recipient_phone_number(user_id: str) -> str | None:
    """SMS/voice sessions are identified as "sms:<phone>" / "voice:<phone>" (see
    app/api/routes/sms.py::_sms_session_id and voice.py::_voice_session_id), and that
    session_id is stored as Appointment.user_id -- there is no separate phone column, so
    this is the only place the patient's real number can be recovered from for an
    outbound Twilio notification."""
    for prefix in ("sms:", "voice:"):
        if user_id.startswith(prefix):
            return user_id[len(prefix):]
    return None


class NotificationService:
    """Sends appointment notifications and keeps an audit trail. Deliberately kept
    separate from AppointmentService so the notification transport (Twilio today,
    something else tomorrow) can be swapped without touching booking logic, and so
    LangGraph nodes never call Twilio directly."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def send_appointment_confirmation(self, db: Session, appointment: Appointment, *, channel: str) -> NotificationResult:
        message = (
            f"RuralCare AI (Demo): Appointment confirmed with {appointment.doctor.name} "
            f"({appointment.doctor.specialty.name}) at {appointment.hospital.name} on "
            f"{appointment.slot.date} {appointment.slot.start_time}. Booking ID: {appointment.id}."
        )
        return self._dispatch(db, appointment, channel=channel, message=message)

    def send_cancellation(self, db: Session, appointment: Appointment, *, channel: str) -> NotificationResult:
        message = (
            f"RuralCare AI (Demo): Appointment {appointment.id} with {appointment.doctor.name} "
            f"has been cancelled. The time slot is now available to other patients."
        )
        return self._dispatch(db, appointment, channel=channel, message=message)

    def send_reschedule_confirmation(self, db: Session, appointment: Appointment, *, channel: str) -> NotificationResult:
        message = (
            f"RuralCare AI (Demo): Appointment {appointment.id} with {appointment.doctor.name} "
            f"has been rescheduled to {appointment.slot.date} {appointment.slot.start_time}."
        )
        return self._dispatch(db, appointment, channel=channel, message=message)

    def _dispatch(self, db: Session, appointment: Appointment, *, channel: str, message: str) -> NotificationResult:
        status = NotificationStatus.DEMO_MODE
        demo_mode = True

        if channel in {"sms", "voice"} and self.settings.twilio_configured:
            try:
                recipient = _recipient_phone_number(appointment.user_id)
                if recipient is None:
                    raise ValueError(f"No recipient phone number available for user_id={appointment.user_id!r}.")
                self._send_via_twilio(channel=channel, message=message, recipient=recipient)
                status = NotificationStatus.SENT
                demo_mode = False
            except Exception:
                status = NotificationStatus.FAILED
                demo_mode = True
        elif channel == "chat":
            # In-app confirmation is delivered as part of the chat response itself;
            # there is no separate transport, so we record it as sent within the app.
            status = NotificationStatus.SENT
            demo_mode = False

        record = NotificationRecord(
            id=uuid.uuid4().hex,
            appointment_id=appointment.id,
            channel=channel,
            message=message,
            status=status.value,
        )
        db.add(record)
        db.commit()

        return NotificationResult(channel=channel, status=status, message=message, demo_mode=demo_mode)

    def _send_via_twilio(self, *, channel: str, message: str, recipient: str) -> None:  # pragma: no cover - requires live credentials
        from twilio.rest import Client

        client = Client(self.settings.twilio_account_sid, self.settings.twilio_auth_token)
        if channel == "sms":
            client.messages.create(body=message, from_=self.settings.twilio_phone_number, to=recipient)
        # Voice notifications are spoken during the live call itself (see app/api/routes/voice.py);
        # this path exists for future out-of-band voice notification support.
