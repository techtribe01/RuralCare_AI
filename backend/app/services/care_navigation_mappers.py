from __future__ import annotations

from app.db.models import Appointment, AppointmentSlot, Doctor, Hospital
from app.models.care_navigation import AppointmentOut, DoctorOut, HospitalOut, SlotOut


def hospital_to_schema(hospital: Hospital) -> HospitalOut:
    return HospitalOut(
        hospital_id=hospital.id,
        name=hospital.name,
        location=hospital.location,
        hospital_type=hospital.hospital_type,
        specialties=[specialty.name for specialty in hospital.specialties],
        languages=list(hospital.languages or []),
        contact=hospital.contact,
        status=hospital.status,
        is_demo_data=hospital.is_demo_data,
    )


def slot_to_schema(slot: AppointmentSlot) -> SlotOut:
    return SlotOut(
        slot_id=slot.id,
        doctor_id=slot.doctor_id,
        date=slot.date,
        start_time=slot.start_time,
        end_time=slot.end_time,
        status=slot.status,
        is_demo_data=slot.is_demo_data,
    )


def doctor_to_schema(doctor: Doctor, *, next_available_slot: AppointmentSlot | None = None) -> DoctorOut:
    return DoctorOut(
        doctor_id=doctor.id,
        name=doctor.name,
        specialty=doctor.specialty.name,
        hospital_id=doctor.hospital_id,
        hospital_name=doctor.hospital.name,
        location=doctor.hospital.location,
        experience_years=doctor.experience_years,
        languages=list(doctor.languages or []),
        consultation_type=doctor.consultation_type,
        next_available_slot=slot_to_schema(next_available_slot) if next_available_slot else None,
        status=doctor.status,
        is_demo_data=doctor.is_demo_data,
    )


def appointment_to_schema(appointment: Appointment) -> AppointmentOut:
    return AppointmentOut(
        appointment_id=appointment.id,
        booking_id=appointment.id,
        user_id=appointment.user_id,
        status=appointment.status,
        doctor=doctor_to_schema(appointment.doctor),
        hospital=hospital_to_schema(appointment.hospital),
        slot=slot_to_schema(appointment.slot),
        created_at=appointment.created_at.isoformat() if appointment.created_at else "",
        confirmed_at=appointment.confirmed_at.isoformat() if appointment.confirmed_at else None,
        cancelled_at=appointment.cancelled_at.isoformat() if appointment.cancelled_at else None,
        channel=appointment.channel,
        is_demo_data=appointment.is_demo_data,
    )
