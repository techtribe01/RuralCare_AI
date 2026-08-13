from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import Appointment


class AppointmentRepository:
    """Persistence access to appointment records. No business logic lives here."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, appointment_id: str) -> Appointment | None:
        return self.db.get(Appointment, appointment_id)

    def create(self, appointment: Appointment) -> Appointment:
        self.db.add(appointment)
        return appointment

    def list_for_user(self, user_id: str) -> list[Appointment]:
        return (
            self.db.query(Appointment)
            .filter(Appointment.user_id == user_id)
            .order_by(Appointment.created_at.desc())
            .all()
        )
