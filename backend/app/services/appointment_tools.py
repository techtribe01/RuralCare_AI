from __future__ import annotations

"""Validated agent tools for care navigation (PRD section 24 "Agent Tools").

This is the ONLY surface LangGraph is allowed to call for appointment actions. Each
function here is a narrow, structured interface -- the LLM can never write arbitrary
queries or invoke a database write on its own. `book_appointment` in particular is the
sole path into AppointmentService and hard-rejects anything without an explicit
`confirmation=True`, matching the "LLM proposes -> user confirms -> book" control flow
required by the PRD's booking control section.

    LangGraph -> Validated Tool (this module) -> Application Service -> Repository -> DB
"""

from datetime import date as date_

from sqlalchemy.orm import Session

from app.models.care_navigation import AppointmentOut, DoctorOut, HospitalOut, NotificationResult, SlotOut
from app.services.appointment_service import AppointmentService, AppointmentValidationError
from app.services.doctor_service import DoctorService
from app.services.hospital_service import HospitalService
from app.services.notification_service import NotificationService

_hospital_service = HospitalService()
_doctor_service = DoctorService()
_appointment_service = AppointmentService()
_notification_service = NotificationService()


def search_hospitals(
    db: Session, *, location: str | None = None, specialty: str | None = None, language: str | None = None
) -> list[HospitalOut]:
    """search_hospitals(location, specialty/capability) -> hospital list. Read-only."""
    return _hospital_service.search_hospitals(db, location=location, specialty=specialty, language=language)


def search_doctors(
    db: Session,
    *,
    specialty: str | None = None,
    location: str | None = None,
    hospital_id: str | None = None,
    language: str | None = None,
    date: date_ | None = None,
) -> list[DoctorOut]:
    """search_doctors(hospital, specialty, location) -> doctor list. Read-only."""
    return _doctor_service.search_doctors(
        db, specialty=specialty, location=location, hospital_id=hospital_id, language=language, date=date
    )


def check_slots(db: Session, *, doctor_id: str, date: date_ | None = None) -> list[SlotOut]:
    """check_slots(doctor_id, date_range) -> available slots. Read-only. Never invents a slot."""
    return _doctor_service.check_slots(db, doctor_id=doctor_id, date=date)


def book_appointment(
    db: Session,
    *,
    user_id: str,
    doctor_id: str,
    hospital_id: str,
    slot_id: str,
    confirmation: bool,
    channel: str = "chat",
) -> AppointmentOut:
    """book_appointment(user_id, slot_id, confirmation) -> booking ID.

    Hard-rejects any call where confirmation is not exactly True. This is the only
    function in the entire system that may create a CONFIRMED appointment row."""
    if confirmation is not True:
        raise AppointmentValidationError("confirmation_required", "Booking requires explicit confirmation.")
    return _appointment_service.book_appointment(
        db,
        user_id=user_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,
        slot_id=slot_id,
        confirmation=confirmation,
        channel=channel,
    )


def cancel_appointment(db: Session, *, appointment_id: str, user_id: str, confirmation: bool) -> AppointmentOut:
    """cancel_appointment(appointment_id, confirmation) -> status."""
    return _appointment_service.cancel_appointment(
        db, appointment_id=appointment_id, user_id=user_id, confirmation=confirmation
    )


def reschedule_appointment(
    db: Session, *, appointment_id: str, user_id: str, new_slot_id: str, confirmation: bool
) -> AppointmentOut:
    return _appointment_service.reschedule_appointment(
        db, appointment_id=appointment_id, user_id=user_id, new_slot_id=new_slot_id, confirmation=confirmation
    )


def send_notification(db: Session, appointment_model, *, channel: str, kind: str = "confirmation") -> NotificationResult:
    """send_notification(channel, recipient, message) -> delivery status."""
    if kind == "cancellation":
        return _notification_service.send_cancellation(db, appointment_model, channel=channel)
    if kind == "reschedule":
        return _notification_service.send_reschedule_confirmation(db, appointment_model, channel=channel)
    return _notification_service.send_appointment_confirmation(db, appointment_model, channel=channel)


__all__ = [
    "search_hospitals",
    "search_doctors",
    "check_slots",
    "book_appointment",
    "cancel_appointment",
    "reschedule_appointment",
    "send_notification",
    "AppointmentValidationError",
]
