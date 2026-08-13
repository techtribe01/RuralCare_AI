from __future__ import annotations

from datetime import date as date_

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.models import Appointment as AppointmentModel
from app.db.session import get_db
from app.models.care_navigation import (
    AppointmentOut,
    BookAppointmentRequest,
    CancelAppointmentRequest,
    DoctorOut,
    HospitalOut,
    NotificationResult,
    RescheduleAppointmentRequest,
    SlotOut,
    SpecialtyOut,
)
from app.models.care_navigation_enums import HospitalType
from app.services.appointment_service import AppointmentService, AppointmentValidationError
from app.services.doctor_service import DoctorService
from app.services.hospital_service import HospitalService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/appointments", tags=["appointments"])

hospital_service = HospitalService()
doctor_service = DoctorService()
appointment_service = AppointmentService()
notification_service = NotificationService()

_ERROR_STATUS = {
    "invalid_user": 400,
    "confirmation_required": 400,
    "invalid_doctor_hospital_combination": 400,
    "invalid_slot_doctor_combination": 400,
    "same_slot": 400,
    "doctor_not_found": 404,
    "hospital_not_found": 404,
    "slot_not_found": 404,
    "appointment_not_found": 404,
    "forbidden": 403,
    "slot_unavailable": 409,
    "invalid_status": 409,
}


def _raise_validation_error(exc: AppointmentValidationError) -> None:
    status_code = _ERROR_STATUS.get(exc.code, 400)
    raise HTTPException(status_code=status_code, detail={"code": exc.code, "message": exc.message}) from exc


@router.get("/specialties", response_model=list[SpecialtyOut])
def list_specialties(db: Session = Depends(get_db)) -> list[SpecialtyOut]:
    from app.db.models import Specialty

    specialties = db.query(Specialty).order_by(Specialty.name).all()
    return [
        SpecialtyOut(specialty_id=s.id, name=s.name, description=s.description, status=s.status) for s in specialties
    ]


@router.get("/hospitals", response_model=list[HospitalOut])
def search_hospitals(
    location: str | None = None,
    specialty: str | None = None,
    hospital_type: HospitalType | None = None,
    language: str | None = None,
    db: Session = Depends(get_db),
) -> list[HospitalOut]:
    return hospital_service.search_hospitals(
        db, location=location, specialty=specialty, hospital_type=hospital_type, language=language
    )


@router.get("/doctors", response_model=list[DoctorOut])
def search_doctors(
    specialty: str | None = None,
    location: str | None = None,
    hospital_id: str | None = None,
    language: str | None = None,
    date: date_ | None = None,
    db: Session = Depends(get_db),
) -> list[DoctorOut]:
    return doctor_service.search_doctors(
        db, specialty=specialty, location=location, hospital_id=hospital_id, language=language, date=date
    )


@router.get("/slots", response_model=list[SlotOut])
def check_slots(
    doctor_id: str = Query(min_length=1),
    date: date_ | None = None,
    date_from: date_ | None = None,
    date_to: date_ | None = None,
    include_unavailable: bool = False,
    db: Session = Depends(get_db),
) -> list[SlotOut]:
    """Only AVAILABLE slots are returned by default so the agent/UI can never present or
    let the LLM invent a slot that is not actually bookable. `include_unavailable` exists
    for verification/admin views (e.g. confirming a slot is BOOKED after reschedule)."""
    return doctor_service.check_slots(
        db, doctor_id=doctor_id, date=date, date_from=date_from, date_to=date_to, include_unavailable=include_unavailable
    )


@router.get("", response_model=list[AppointmentOut])
def list_appointments(user_id: str = Query(min_length=1), db: Session = Depends(get_db)) -> list[AppointmentOut]:
    return appointment_service.list_for_user(db, user_id)


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: str, db: Session = Depends(get_db)) -> AppointmentOut:
    appointment = appointment_service.get_appointment(db, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=404, detail={"code": "appointment_not_found", "message": "This appointment could not be found."})
    return appointment


@router.post("/book", response_model=AppointmentOut)
def book_appointment(payload: BookAppointmentRequest, db: Session = Depends(get_db)) -> AppointmentOut:
    """Every field here is re-validated server-side against the database. The frontend
    may only pass IDs it already received from a prior search response -- it can never
    cause a booking on its own; `confirmation` must be explicitly true or the request
    is rejected before any database write happens."""
    try:
        appointment = appointment_service.book_appointment(
            db,
            user_id=payload.user_id,
            doctor_id=payload.doctor_id,
            hospital_id=payload.hospital_id,
            slot_id=payload.slot_id,
            confirmation=payload.confirmation,
            channel=payload.channel,
        )
    except AppointmentValidationError as exc:
        _raise_validation_error(exc)

    record = db.get(AppointmentModel, appointment.appointment_id)
    notification_service.send_appointment_confirmation(db, record, channel=payload.channel)
    return appointment


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(appointment_id: str, payload: CancelAppointmentRequest, db: Session = Depends(get_db)) -> AppointmentOut:
    try:
        appointment = appointment_service.cancel_appointment(
            db, appointment_id=appointment_id, user_id=payload.user_id, confirmation=payload.confirmation
        )
    except AppointmentValidationError as exc:
        _raise_validation_error(exc)

    record = db.get(AppointmentModel, appointment.appointment_id)
    notification_service.send_cancellation(db, record, channel=record.channel)
    return appointment


@router.post("/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule_appointment(
    appointment_id: str, payload: RescheduleAppointmentRequest, db: Session = Depends(get_db)
) -> AppointmentOut:
    try:
        appointment = appointment_service.reschedule_appointment(
            db,
            appointment_id=appointment_id,
            user_id=payload.user_id,
            new_slot_id=payload.new_slot_id,
            confirmation=payload.confirmation,
        )
    except AppointmentValidationError as exc:
        _raise_validation_error(exc)

    record = db.get(AppointmentModel, appointment.appointment_id)
    notification_service.send_reschedule_confirmation(db, record, channel=record.channel)
    return appointment


@router.get("/{appointment_id}/notifications", response_model=list[NotificationResult])
def list_notifications(appointment_id: str, db: Session = Depends(get_db)) -> list[NotificationResult]:
    from app.db.models import NotificationRecord

    records = (
        db.query(NotificationRecord)
        .filter(NotificationRecord.appointment_id == appointment_id)
        .order_by(NotificationRecord.created_at)
        .all()
    )
    return [
        NotificationResult(channel=r.channel, status=r.status, message=r.message, demo_mode=r.status != "sent")
        for r in records
    ]
