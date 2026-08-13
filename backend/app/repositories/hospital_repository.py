from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import Hospital, Specialty
from app.models.care_navigation_enums import EntityStatus, HospitalType


class HospitalRepository:
    """Read access to hospital records. No business logic lives here."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, hospital_id: str) -> Hospital | None:
        return self.db.get(Hospital, hospital_id)

    def search(
        self,
        *,
        location: str | None = None,
        specialty: str | None = None,
        hospital_type: HospitalType | None = None,
        language: str | None = None,
    ) -> list[Hospital]:
        query = self.db.query(Hospital).filter(Hospital.status == EntityStatus.ACTIVE)
        if location:
            query = query.filter(Hospital.location.ilike(f"%{location}%"))
        if hospital_type:
            query = query.filter(Hospital.hospital_type == hospital_type)
        if specialty:
            query = query.join(Hospital.specialties).filter(Specialty.name.ilike(f"%{specialty}%"))

        hospitals = query.distinct().all()
        if language:
            hospitals = [h for h in hospitals if language in (h.languages or [])]
        return hospitals
