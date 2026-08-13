from __future__ import annotations

import sys
from datetime import date, time, timedelta
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.db.models import AppointmentSlot, Doctor, Hospital, Specialty  # noqa: E402
from app.db.session import Base, create_session_factory, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.care_navigation_enums import ConsultationType, EntityStatus, HospitalType, SlotStatus  # noqa: E402


@pytest.fixture()
def test_db() -> Generator[tuple, None, None]:
    """Isolated in-memory SQLite database with minimal seed data for appointment tests."""
    engine, factory = create_session_factory("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    db = factory()
    _seed_test_data(db)
    db.commit()
    try:
        yield engine, factory, db
    finally:
        db.close()
        engine.dispose()


def _seed_test_data(db: Session) -> None:
    specialty = Specialty(
        id="spec-general-medicine",
        name="General Medicine",
        description="Primary care",
        status=EntityStatus.ACTIVE,
    )
    specialty_cardio = Specialty(
        id="spec-cardiology",
        name="Cardiology",
        description="Heart care",
        status=EntityStatus.ACTIVE,
    )
    hospital = Hospital(
        id="hosp-test-001",
        name="Test Community Hospital",
        location="Tirupati",
        hospital_type=HospitalType.GENERAL,
        contact="+91-90000-00001",
        languages=["en", "te"],
        status=EntityStatus.ACTIVE,
        is_demo_data=True,
    )
    hospital.specialties = [specialty, specialty_cardio]

    hospital2 = Hospital(
        id="hosp-test-002",
        name="Test Specialty Center",
        location="Bengaluru",
        hospital_type=HospitalType.SPECIALTY_CARE,
        contact="+91-90000-00002",
        languages=["en"],
        status=EntityStatus.ACTIVE,
        is_demo_data=True,
    )
    hospital2.specialties = [specialty_cardio]

    doctor = Doctor(
        id="doc-test-001",
        name="Dr. Test Rao",
        specialty_id=specialty.id,
        hospital_id=hospital.id,
        experience_years=10,
        languages=["en", "te"],
        consultation_type=ConsultationType.IN_PERSON,
        status=EntityStatus.ACTIVE,
        is_demo_data=True,
    )
    doctor_cardio = Doctor(
        id="doc-test-002",
        name="Dr. Test Kumar",
        specialty_id=specialty_cardio.id,
        hospital_id=hospital.id,
        experience_years=15,
        languages=["en"],
        consultation_type=ConsultationType.IN_PERSON,
        status=EntityStatus.ACTIVE,
        is_demo_data=True,
    )

    tomorrow = date.today() + timedelta(days=1)
    slot1 = AppointmentSlot(
        id="slot-test-001",
        doctor_id=doctor.id,
        date=tomorrow,
        start_time=time(10, 0),
        end_time=time(10, 30),
        status=SlotStatus.AVAILABLE,
        is_demo_data=True,
    )
    slot2 = AppointmentSlot(
        id="slot-test-002",
        doctor_id=doctor.id,
        date=tomorrow,
        start_time=time(11, 30),
        end_time=time(12, 0),
        status=SlotStatus.AVAILABLE,
        is_demo_data=True,
    )
    slot3 = AppointmentSlot(
        id="slot-test-003",
        doctor_id=doctor_cardio.id,
        date=tomorrow,
        start_time=time(9, 0),
        end_time=time(9, 30),
        status=SlotStatus.AVAILABLE,
        is_demo_data=True,
    )

    db.add_all([specialty, specialty_cardio, hospital, hospital2, doctor, doctor_cardio, slot1, slot2, slot3])


@pytest.fixture()
def client(test_db) -> Generator[TestClient, None, None]:
    _, factory, _ = test_db

    def override_get_db():
        db = factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
