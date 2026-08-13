from __future__ import annotations

from datetime import date as date_

from sqlalchemy.orm import Session

from app.db.models import AppointmentSlot
from app.models.care_navigation_enums import SlotStatus


class SlotRepository:
    """Read/lifecycle access to appointment slots. No business logic lives here."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, slot_id: str) -> AppointmentSlot | None:
        return self.db.get(AppointmentSlot, slot_id)

    def search(
        self,
        *,
        doctor_id: str,
        date_from: date_ | None = None,
        date_to: date_ | None = None,
        status: SlotStatus | None = SlotStatus.AVAILABLE,
        include_unavailable: bool = False,
    ) -> list[AppointmentSlot]:
        query = self.db.query(AppointmentSlot).filter(AppointmentSlot.doctor_id == doctor_id)
        if status is not None and not include_unavailable:
            query = query.filter(AppointmentSlot.status == status)
        if date_from is not None:
            query = query.filter(AppointmentSlot.date >= date_from)
        if date_to is not None:
            query = query.filter(AppointmentSlot.date <= date_to)
        return query.order_by(AppointmentSlot.date, AppointmentSlot.start_time).all()

    def next_available(self, doctor_id: str) -> AppointmentSlot | None:
        return (
            self.db.query(AppointmentSlot)
            .filter(AppointmentSlot.doctor_id == doctor_id, AppointmentSlot.status == SlotStatus.AVAILABLE)
            .order_by(AppointmentSlot.date, AppointmentSlot.start_time)
            .first()
        )
