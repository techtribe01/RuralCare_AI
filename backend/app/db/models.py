from __future__ import annotations

from datetime import date as date_, datetime, time as time_
from datetime import timezone

from sqlalchemy import JSON, Column, DateTime, Enum as SAEnum, ForeignKey, Index, Table, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.care_navigation_enums import AppointmentStatus, ConsultationType, EntityStatus, HospitalType, SlotStatus


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


hospital_specialty = Table(
    "hospital_specialty",
    Base.metadata,
    Column("hospital_id", ForeignKey("hospitals.id"), primary_key=True),
    Column("specialty_id", ForeignKey("specialties.id"), primary_key=True),
)


class Specialty(Base):
    """Normalized specialty catalog (General Medicine, Pediatrics, Cardiology, ...)."""

    __tablename__ = "specialties"

    id: Mapped[str] = mapped_column(primary_key=True)  # specialty_id, e.g. "spec-general-medicine"
    name: Mapped[str] = mapped_column(unique=True)
    description: Mapped[str] = mapped_column(default="")
    status: Mapped[EntityStatus] = mapped_column(SAEnum(EntityStatus, native_enum=False), default=EntityStatus.ACTIVE)

    hospitals: Mapped[list["Hospital"]] = relationship(secondary=hospital_specialty, back_populates="specialties")
    doctors: Mapped[list["Doctor"]] = relationship(back_populates="specialty")


class Hospital(Base):
    """DEMO DATA: fictional hospital record for the RuralCare AI showcase."""

    __tablename__ = "hospitals"

    id: Mapped[str] = mapped_column(primary_key=True)  # hospital_id, e.g. "hosp-001"
    name: Mapped[str]
    location: Mapped[str]
    hospital_type: Mapped[HospitalType] = mapped_column(SAEnum(HospitalType, native_enum=False))
    contact: Mapped[str] = mapped_column(default="")
    languages: Mapped[list] = mapped_column(JSON, default=list)  # JSON list of language codes, e.g. ["en", "te"]
    status: Mapped[EntityStatus] = mapped_column(SAEnum(EntityStatus, native_enum=False), default=EntityStatus.ACTIVE)
    is_demo_data: Mapped[bool] = mapped_column(default=True)

    specialties: Mapped[list[Specialty]] = relationship(secondary=hospital_specialty, back_populates="hospitals")
    doctors: Mapped[list["Doctor"]] = relationship(back_populates="hospital")


class Doctor(Base):
    """DEMO DATA: fictional doctor record for the RuralCare AI showcase."""

    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(primary_key=True)  # doctor_id, e.g. "doc-001"
    name: Mapped[str]
    specialty_id: Mapped[str] = mapped_column(ForeignKey("specialties.id"))
    hospital_id: Mapped[str] = mapped_column(ForeignKey("hospitals.id"))
    experience_years: Mapped[int] = mapped_column(default=0)
    languages: Mapped[list] = mapped_column(JSON, default=list)
    consultation_type: Mapped[ConsultationType] = mapped_column(
        SAEnum(ConsultationType, native_enum=False), default=ConsultationType.IN_PERSON
    )
    status: Mapped[EntityStatus] = mapped_column(SAEnum(EntityStatus, native_enum=False), default=EntityStatus.ACTIVE)
    is_demo_data: Mapped[bool] = mapped_column(default=True)

    specialty: Mapped[Specialty] = relationship(back_populates="doctors")
    hospital: Mapped[Hospital] = relationship(back_populates="doctors")
    slots: Mapped[list["AppointmentSlot"]] = relationship(back_populates="doctor")


class AppointmentSlot(Base):
    """DEMO DATA: fictional appointment slot for the RuralCare AI showcase."""

    __tablename__ = "appointment_slots"
    __table_args__ = (
        UniqueConstraint("doctor_id", "date", "start_time", name="uq_slot_doctor_date_start"),
    )

    id: Mapped[str] = mapped_column(primary_key=True)  # slot_id, e.g. "slot-000123"
    doctor_id: Mapped[str] = mapped_column(ForeignKey("doctors.id"))
    date: Mapped[date_]
    start_time: Mapped[time_]
    end_time: Mapped[time_]
    status: Mapped[SlotStatus] = mapped_column(SAEnum(SlotStatus, native_enum=False), default=SlotStatus.AVAILABLE)
    is_demo_data: Mapped[bool] = mapped_column(default=True)

    doctor: Mapped[Doctor] = relationship(back_populates="slots")


class Appointment(Base):
    """DEMO DATA: fictional appointment/booking record for the RuralCare AI showcase."""

    __tablename__ = "appointments"

    id: Mapped[str] = mapped_column(primary_key=True)  # appointment_id, displayed to users as "DEMO-XXXXXXXX"
    user_id: Mapped[str]
    doctor_id: Mapped[str] = mapped_column(ForeignKey("doctors.id"))
    hospital_id: Mapped[str] = mapped_column(ForeignKey("hospitals.id"))
    slot_id: Mapped[str] = mapped_column(ForeignKey("appointment_slots.id"))
    status: Mapped[AppointmentStatus] = mapped_column(SAEnum(AppointmentStatus, native_enum=False), default=AppointmentStatus.PENDING)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    channel: Mapped[str] = mapped_column(default="chat")
    is_demo_data: Mapped[bool] = mapped_column(default=True)

    doctor: Mapped[Doctor] = relationship()
    hospital: Mapped[Hospital] = relationship()
    slot: Mapped[AppointmentSlot] = relationship()


# Defense-in-depth against double booking: at most one non-cancelled appointment may
# reference a given slot at a time. Combined with the application-level booking lock and
# an explicit DB transaction, this prevents two users from ever holding the same slot.
Index(
    "uq_active_appointment_per_slot",
    Appointment.slot_id,
    unique=True,
    sqlite_where=Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
)


class NotificationRecord(Base):
    """Audit trail for notification attempts (confirmation/cancellation/reschedule)."""

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(primary_key=True)
    appointment_id: Mapped[str] = mapped_column(ForeignKey("appointments.id"))
    channel: Mapped[str]
    message: Mapped[str]
    status: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
