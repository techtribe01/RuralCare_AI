from __future__ import annotations

from datetime import date as date_

from sqlalchemy.orm import Session

from app.models.care_navigation import DoctorOut, SlotOut
from app.repositories.doctor_repository import DoctorRepository
from app.repositories.slot_repository import SlotRepository
from app.services.care_navigation_mappers import doctor_to_schema, slot_to_schema


class DoctorService:
    """Application service for doctor and slot search. Never lets the LLM
    write arbitrary queries -- callers may only pass the structured filters below."""

    def search_doctors(
        self,
        db: Session,
        *,
        specialty: str | None = None,
        location: str | None = None,
        hospital_id: str | None = None,
        language: str | None = None,
        date: date_ | None = None,
    ) -> list[DoctorOut]:
        doctor_repo = DoctorRepository(db)
        slot_repo = SlotRepository(db)
        doctors = doctor_repo.search(specialty=specialty, location=location, hospital_id=hospital_id, language=language)

        results: list[DoctorOut] = []
        for doctor in doctors:
            next_slot = slot_repo.next_available(doctor.id)
            if date is not None:
                slots_on_date = slot_repo.search(doctor_id=doctor.id, date_from=date, date_to=date)
                if not slots_on_date:
                    continue
                next_slot = slots_on_date[0]
            results.append(doctor_to_schema(doctor, next_available_slot=next_slot))
        return results

    def get_doctor(self, db: Session, doctor_id: str) -> DoctorOut | None:
        doctor_repo = DoctorRepository(db)
        slot_repo = SlotRepository(db)
        doctor = doctor_repo.get_by_id(doctor_id)
        if doctor is None:
            return None
        return doctor_to_schema(doctor, next_available_slot=slot_repo.next_available(doctor_id))

    def check_slots(
        self,
        db: Session,
        *,
        doctor_id: str,
        date: date_ | None = None,
        date_from: date_ | None = None,
        date_to: date_ | None = None,
        include_unavailable: bool = False,
    ) -> list[SlotOut]:
        slot_repo = SlotRepository(db)
        effective_from = date or date_from
        effective_to = date or date_to
        slots = slot_repo.search(
            doctor_id=doctor_id,
            date_from=effective_from,
            date_to=effective_to,
            include_unavailable=include_unavailable,
        )
        return [slot_to_schema(slot) for slot in slots]
