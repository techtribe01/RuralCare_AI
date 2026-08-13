from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.care_navigation import HospitalOut
from app.models.care_navigation_enums import HospitalType
from app.repositories.hospital_repository import HospitalRepository
from app.services.care_navigation_mappers import hospital_to_schema


class HospitalService:
    """Application service for hospital search. Owns validation/shaping; the
    repository owns queries; routes and LangGraph tools only call this service."""

    def search_hospitals(
        self,
        db: Session,
        *,
        location: str | None = None,
        specialty: str | None = None,
        hospital_type: HospitalType | None = None,
        language: str | None = None,
    ) -> list[HospitalOut]:
        repo = HospitalRepository(db)
        hospitals = repo.search(location=location, specialty=specialty, hospital_type=hospital_type, language=language)
        return [hospital_to_schema(hospital) for hospital in hospitals]

    def get_hospital(self, db: Session, hospital_id: str) -> HospitalOut | None:
        repo = HospitalRepository(db)
        hospital = repo.get_by_id(hospital_id)
        return hospital_to_schema(hospital) if hospital else None
