from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import Appointment
from app.models.care_navigation import AppointmentOut
from app.models.care_navigation_enums import AppointmentStatus, EntityStatus, SlotStatus
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.doctor_repository import DoctorRepository
from app.repositories.hospital_repository import HospitalRepository
from app.repositories.slot_repository import SlotRepository
from app.services.care_navigation_mappers import appointment_to_schema

# A single process-wide lock serializes the check-then-update critical section for
# booking and rescheduling. SQLite has no row-level locking primitive reachable through
# the ORM, so this lock plus an explicit transaction plus a partial unique index on
# appointments.slot_id (see app.db.models) together stand in for "row locking or
# equivalent" for this single-process demo/showcase deployment.
_BOOKING_LOCK = threading.Lock()


class AppointmentValidationError(Exception):
    """Raised whenever a booking/cancel/reschedule request fails server-side validation.

    `code` is a stable machine-readable reason the API layer maps to an HTTP status and
    the frontend maps to a specific empty/failure state -- never a raw stack trace.
    """

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def _new_booking_id() -> str:
    return f"DEMO-{uuid.uuid4().hex[:8].upper()}"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AppointmentService:
    """Owns every booking/cancel/reschedule validation rule and the transaction
    boundary. This is the ONLY place appointment state is mutated. LangGraph tools,
    chat/voice/SMS routes, and REST routes all call through here -- never the ORM
    directly -- so double-booking, cross-user access, and unconfirmed bookings are
    rejected identically regardless of channel."""

    def book_appointment(
        self,
        db: Session,
        *,
        user_id: str,
        doctor_id: str,
        hospital_id: str,
        slot_id: str,
        confirmation: bool,
        channel: str = "chat",
    ) -> AppointmentOut:
        if not user_id or not user_id.strip():
            raise AppointmentValidationError("invalid_user", "A valid user is required to book an appointment.")

        if confirmation is not True:
            raise AppointmentValidationError(
                "confirmation_required",
                "Booking requires explicit user confirmation before it can be created.",
            )

        with _BOOKING_LOCK:
            doctor_repo = DoctorRepository(db)
            hospital_repo = HospitalRepository(db)
            slot_repo = SlotRepository(db)
            appointment_repo = AppointmentRepository(db)

            doctor = doctor_repo.get_by_id(doctor_id)
            if doctor is None or doctor.status != EntityStatus.ACTIVE:
                raise AppointmentValidationError("doctor_not_found", "The selected doctor is not available.")

            hospital = hospital_repo.get_by_id(hospital_id)
            if hospital is None or hospital.status != EntityStatus.ACTIVE:
                raise AppointmentValidationError("hospital_not_found", "The selected hospital is not available.")

            if doctor.hospital_id != hospital.id:
                raise AppointmentValidationError(
                    "invalid_doctor_hospital_combination",
                    "The selected doctor does not belong to the selected hospital.",
                )

            # Re-check slot availability against the database -- never trust a slot the
            # frontend cached from an earlier search response.
            slot = slot_repo.get_by_id(slot_id)
            if slot is None:
                raise AppointmentValidationError("slot_not_found", "The selected time slot no longer exists.")
            if slot.doctor_id != doctor.id:
                raise AppointmentValidationError(
                    "invalid_slot_doctor_combination",
                    "The selected time slot does not belong to the selected doctor.",
                )
            if slot.status != SlotStatus.AVAILABLE:
                raise AppointmentValidationError(
                    "slot_unavailable",
                    "This time slot is no longer available. Please choose another time.",
                )

            appointment = Appointment(
                id=_new_booking_id(),
                user_id=user_id,
                doctor_id=doctor.id,
                hospital_id=hospital.id,
                slot_id=slot.id,
                status=AppointmentStatus.CONFIRMED,
                confirmed_at=_utcnow(),
                channel=channel,
            )

            try:
                slot.status = SlotStatus.BOOKED
                appointment_repo.create(appointment)
                db.commit()
            except IntegrityError as exc:
                db.rollback()
                raise AppointmentValidationError(
                    "slot_unavailable",
                    "This time slot was just booked by another user. Please choose another time.",
                ) from exc
            except Exception:
                db.rollback()
                raise

            db.refresh(appointment)
            return appointment_to_schema(appointment)

    def cancel_appointment(
        self,
        db: Session,
        *,
        appointment_id: str,
        user_id: str,
        confirmation: bool,
    ) -> AppointmentOut:
        if confirmation is not True:
            raise AppointmentValidationError(
                "confirmation_required",
                "Cancellation requires explicit user confirmation.",
            )

        with _BOOKING_LOCK:
            appointment_repo = AppointmentRepository(db)
            appointment = appointment_repo.get_by_id(appointment_id)
            if appointment is None:
                raise AppointmentValidationError("appointment_not_found", "This appointment could not be found.")
            if appointment.user_id != user_id:
                raise AppointmentValidationError(
                    "forbidden",
                    "This appointment does not belong to the requesting user.",
                )
            if appointment.status not in (AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED):
                raise AppointmentValidationError(
                    "invalid_status",
                    f"This appointment cannot be cancelled from status '{appointment.status.value}'.",
                )

            try:
                appointment.status = AppointmentStatus.CANCELLED
                appointment.cancelled_at = _utcnow()
                appointment.slot.status = SlotStatus.AVAILABLE
                db.commit()
            except Exception:
                db.rollback()
                raise

            db.refresh(appointment)
            return appointment_to_schema(appointment)

    def reschedule_appointment(
        self,
        db: Session,
        *,
        appointment_id: str,
        user_id: str,
        new_slot_id: str,
        confirmation: bool,
    ) -> AppointmentOut:
        if confirmation is not True:
            raise AppointmentValidationError(
                "confirmation_required",
                "Rescheduling requires explicit user confirmation.",
            )

        with _BOOKING_LOCK:
            appointment_repo = AppointmentRepository(db)
            slot_repo = SlotRepository(db)

            appointment = appointment_repo.get_by_id(appointment_id)
            if appointment is None:
                raise AppointmentValidationError("appointment_not_found", "This appointment could not be found.")
            if appointment.user_id != user_id:
                raise AppointmentValidationError(
                    "forbidden",
                    "This appointment does not belong to the requesting user.",
                )
            if appointment.status != AppointmentStatus.CONFIRMED:
                raise AppointmentValidationError(
                    "invalid_status",
                    f"This appointment cannot be rescheduled from status '{appointment.status.value}'.",
                )

            new_slot = slot_repo.get_by_id(new_slot_id)
            if new_slot is None:
                raise AppointmentValidationError("slot_not_found", "The selected time slot no longer exists.")
            if new_slot.doctor_id != appointment.doctor_id:
                raise AppointmentValidationError(
                    "invalid_slot_doctor_combination",
                    "The new time slot must belong to the same doctor.",
                )
            if new_slot.id == appointment.slot_id:
                raise AppointmentValidationError(
                    "same_slot",
                    "The selected time slot is the same as the current appointment.",
                )
            if new_slot.status != SlotStatus.AVAILABLE:
                raise AppointmentValidationError(
                    "slot_unavailable",
                    "This time slot is no longer available. Please choose another time.",
                )

            old_slot = appointment.slot
            try:
                old_slot.status = SlotStatus.AVAILABLE
                new_slot.status = SlotStatus.BOOKED
                appointment.slot_id = new_slot.id
                appointment.confirmed_at = _utcnow()
                db.commit()
            except IntegrityError as exc:
                db.rollback()
                raise AppointmentValidationError(
                    "slot_unavailable",
                    "This time slot was just booked by another user. Please choose another time.",
                ) from exc
            except Exception:
                db.rollback()
                raise

            db.refresh(appointment)
            return appointment_to_schema(appointment)

    def get_appointment(self, db: Session, appointment_id: str) -> AppointmentOut | None:
        appointment = AppointmentRepository(db).get_by_id(appointment_id)
        return appointment_to_schema(appointment) if appointment else None

    def list_for_user(self, db: Session, user_id: str) -> list[AppointmentOut]:
        appointments = AppointmentRepository(db).list_for_user(user_id)
        return [appointment_to_schema(appointment) for appointment in appointments]
