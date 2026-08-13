from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import Doctor, Hospital, Specialty
from app.models.care_navigation_enums import EntityStatus


class DoctorRepository:
    """Read access to doctor records. No business logic lives here."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, doctor_id: str) -> Doctor | None:
        return self.db.get(Doctor, doctor_id)

    def search(
        self,
        *,
        specialty: str | None = None,
        location: str | None = None,
        hospital_id: str | None = None,
        language: str | None = None,
    ) -> list[Doctor]:
        query = (
            self.db.query(Doctor)
            .join(Doctor.hospital)
            .join(Doctor.specialty)
            .filter(Doctor.status == EntityStatus.ACTIVE)
        )
        if specialty:
            query = query.filter(Specialty.name.ilike(f"%{specialty}%"))
        if hospital_id:
            query = query.filter(Doctor.hospital_id == hospital_id)
        if location:
            query = query.filter(Hospital.location.ilike(f"%{location}%"))

        doctors = query.distinct().all()
        if language:
            doctors = [d for d in doctors if language in (d.languages or [])]
        return doctors
