"""Seed the RuralCare AI care-navigation database with clearly fictional DEMO DATA.

This is the ONLY place demo hospitals, doctors, specialties, and slots are defined.
No demo data is hard-coded into React components or scattered across backend modules --
everything the API and LangGraph tools return comes from the database rows created here.

Usage:
    cd backend
    python ../scripts/seed_demo_data.py

Re-running this script wipes previously seeded demo rows (is_demo_data=True) and
recreates them, so it is safe to run repeatedly during development.
"""
from __future__ import annotations

import sys
from datetime import date, time, timedelta
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.models import Appointment, AppointmentSlot, Doctor, Hospital, NotificationRecord, Specialty  # noqa: E402
from app.db.session import SessionLocal, init_db  # noqa: E402
from app.models.care_navigation_enums import ConsultationType, EntityStatus, HospitalType, SlotStatus  # noqa: E402

SPECIALTIES = [
    ("spec-general-medicine", "General Medicine", "Primary care for everyday illness and preventive checkups."),
    ("spec-pediatrics", "Pediatrics", "Care for infants, children, and adolescents."),
    ("spec-cardiology", "Cardiology", "Heart and cardiovascular system care."),
    ("spec-dermatology", "Dermatology", "Skin, hair, and nail conditions."),
    ("spec-gynecology", "Gynecology", "Women's reproductive health."),
    ("spec-orthopedics", "Orthopedics", "Bones, joints, and musculoskeletal care."),
    ("spec-ent", "ENT", "Ear, nose, and throat care."),
]

HOSPITALS = [
    {
        "id": "hosp-001",
        "name": "RuralCare Community Hospital",
        "location": "Tirupati",
        "hospital_type": HospitalType.MULTI_SPECIALTY,
        "contact": "+91-90000-00001 (Demo)",
        "languages": ["en", "te"],
        "specialties": ["spec-general-medicine", "spec-pediatrics", "spec-cardiology", "spec-ent"],
    },
    {
        "id": "hosp-002",
        "name": "Community Wellness Center",
        "location": "Bengaluru",
        "hospital_type": HospitalType.GENERAL,
        "contact": "+91-90000-00002 (Demo)",
        "languages": ["en", "hi", "kn"],
        "specialties": ["spec-general-medicine", "spec-dermatology", "spec-gynecology"],
    },
    {
        "id": "hosp-003",
        "name": "Village Health Specialty Center",
        "location": "Mysuru",
        "hospital_type": HospitalType.SPECIALTY_CARE,
        "contact": "+91-90000-00003 (Demo)",
        "languages": ["en", "te", "kn"],
        "specialties": ["spec-cardiology", "spec-orthopedics", "spec-ent"],
    },
    {
        "id": "hosp-004",
        "name": "Highlands Rural Health Institute",
        "location": "Ooty",
        "hospital_type": HospitalType.MULTI_SPECIALTY,
        "contact": "+91-90000-00004 (Demo)",
        "languages": ["en", "ta"],
        "specialties": ["spec-general-medicine", "spec-pediatrics", "spec-orthopedics", "spec-gynecology"],
    },
    {
        "id": "hosp-005",
        "name": "Coastal Care Clinic",
        "location": "Visakhapatnam",
        "hospital_type": HospitalType.GENERAL,
        "contact": "+91-90000-00005 (Demo)",
        "languages": ["en", "te"],
        "specialties": ["spec-general-medicine", "spec-dermatology"],
    },
]

DOCTORS = [
    ("doc-001", "Dr. Anitha Rao", "spec-general-medicine", "hosp-001", 12, ["en", "te"], ConsultationType.IN_PERSON),
    ("doc-002", "Dr. Ravi Kumar", "spec-pediatrics", "hosp-001", 9, ["en", "te"], ConsultationType.IN_PERSON),
    ("doc-003", "Dr. Meera Sharma", "spec-cardiology", "hosp-001", 15, ["en", "hi"], ConsultationType.BOTH),
    ("doc-004", "Dr. Kiran Reddy", "spec-ent", "hosp-001", 7, ["en", "te"], ConsultationType.IN_PERSON),
    ("doc-005", "Dr. Sunita Iyer", "spec-general-medicine", "hosp-002", 10, ["en", "hi", "kn"], ConsultationType.IN_PERSON),
    ("doc-006", "Dr. Arjun Menon", "spec-dermatology", "hosp-002", 6, ["en", "hi"], ConsultationType.TELECONSULT),
    ("doc-007", "Dr. Priya Nair", "spec-gynecology", "hosp-002", 11, ["en", "hi", "kn"], ConsultationType.IN_PERSON),
    ("doc-008", "Dr. Vikram Das", "spec-cardiology", "hosp-003", 14, ["en", "kn"], ConsultationType.BOTH),
    ("doc-009", "Dr. Lakshmi Pillai", "spec-orthopedics", "hosp-003", 8, ["en", "te", "kn"], ConsultationType.IN_PERSON),
    ("doc-010", "Dr. Arvind Nair", "spec-ent", "hosp-003", 5, ["en", "kn"], ConsultationType.IN_PERSON),
    ("doc-011", "Dr. Divya Krishnan", "spec-general-medicine", "hosp-004", 9, ["en", "ta"], ConsultationType.IN_PERSON),
    ("doc-012", "Dr. Suresh Babu", "spec-pediatrics", "hosp-004", 13, ["en", "ta", "te"], ConsultationType.IN_PERSON),
    ("doc-013", "Dr. Neha Joshi", "spec-orthopedics", "hosp-004", 7, ["en", "ta"], ConsultationType.TELECONSULT),
    ("doc-014", "Dr. Farah Sheikh", "spec-gynecology", "hosp-004", 10, ["en", "ta", "hi"], ConsultationType.IN_PERSON),
    ("doc-015", "Dr. Anil Kapoor", "spec-general-medicine", "hosp-005", 16, ["en", "te"], ConsultationType.IN_PERSON),
    ("doc-016", "Dr. Radhika Menon", "spec-dermatology", "hosp-005", 4, ["en", "te"], ConsultationType.TELECONSULT),
]

SLOT_TIMES = [(time(10, 0), time(10, 30)), (time(15, 0), time(15, 30))]
SLOT_DAY_OFFSETS = [1, 2, 3]  # tomorrow, +2 days, +3 days -- never in the past


def _clear_demo_data(db) -> None:
    db.query(NotificationRecord).delete()
    db.query(Appointment).filter(Appointment.is_demo_data.is_(True)).delete(synchronize_session=False)
    db.query(AppointmentSlot).filter(AppointmentSlot.is_demo_data.is_(True)).delete(synchronize_session=False)
    db.query(Doctor).filter(Doctor.is_demo_data.is_(True)).delete(synchronize_session=False)
    for hospital in db.query(Hospital).filter(Hospital.is_demo_data.is_(True)).all():
        hospital.specialties = []
    db.flush()
    db.query(Hospital).filter(Hospital.is_demo_data.is_(True)).delete(synchronize_session=False)
    db.query(Specialty).delete()
    db.commit()


def seed() -> dict[str, int]:
    init_db()
    db = SessionLocal()
    try:
        _clear_demo_data(db)

        specialties_by_id: dict[str, Specialty] = {}
        for specialty_id, name, description in SPECIALTIES:
            specialty = Specialty(id=specialty_id, name=name, description=description, status=EntityStatus.ACTIVE)
            db.add(specialty)
            specialties_by_id[specialty_id] = specialty
        db.flush()

        hospitals_by_id: dict[str, Hospital] = {}
        for hospital_data in HOSPITALS:
            hospital = Hospital(
                id=hospital_data["id"],
                name=hospital_data["name"],
                location=hospital_data["location"],
                hospital_type=hospital_data["hospital_type"],
                contact=hospital_data["contact"],
                languages=hospital_data["languages"],
                status=EntityStatus.ACTIVE,
                is_demo_data=True,
            )
            hospital.specialties = [specialties_by_id[sid] for sid in hospital_data["specialties"]]
            db.add(hospital)
            hospitals_by_id[hospital.id] = hospital
        db.flush()

        doctors_by_id: dict[str, Doctor] = {}
        for doctor_id, name, specialty_id, hospital_id, experience_years, languages, consultation_type in DOCTORS:
            doctor = Doctor(
                id=doctor_id,
                name=name,
                specialty_id=specialty_id,
                hospital_id=hospital_id,
                experience_years=experience_years,
                languages=languages,
                consultation_type=consultation_type,
                status=EntityStatus.ACTIVE,
                is_demo_data=True,
            )
            db.add(doctor)
            doctors_by_id[doctor_id] = doctor
        db.flush()

        today = date.today()
        slot_count = 0
        for index, doctor_id in enumerate(doctors_by_id):
            for day_offset in SLOT_DAY_OFFSETS:
                slot_date = today + timedelta(days=day_offset)
                for slot_index, (start_time, end_time) in enumerate(SLOT_TIMES):
                    slot_count += 1
                    # Pre-book roughly one in every seven slots so the demo shows a
                    # realistic mix of available and unavailable times out of the box.
                    status = SlotStatus.BOOKED if slot_count % 7 == 0 else SlotStatus.AVAILABLE
                    slot = AppointmentSlot(
                        id=f"slot-{slot_count:05d}",
                        doctor_id=doctor_id,
                        date=slot_date,
                        start_time=start_time,
                        end_time=end_time,
                        status=status,
                        is_demo_data=True,
                    )
                    db.add(slot)

        db.commit()
        return {
            "specialties": len(SPECIALTIES),
            "hospitals": len(HOSPITALS),
            "doctors": len(DOCTORS),
            "slots": slot_count,
        }
    finally:
        db.close()


if __name__ == "__main__":
    summary = seed()
    print("RuralCare AI demo data seeded (all records marked DEMO DATA):")
    for key, value in summary.items():
        print(f"  {key}: {value}")
