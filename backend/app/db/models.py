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


class AppUser(Base):
    """Phone-verified user, created on first successful Twilio Verify OTP check.

    Mirrors the shape of a Supabase `auth.users` row (id/phone/created_at/last_login_at)
    so it can be swapped for real Supabase Auth later without changing callers.
    """

    __tablename__ = "app_users"

    id: Mapped[str] = mapped_column(primary_key=True)  # uuid4 hex
    phone_number: Mapped[str] = mapped_column(unique=True)  # E.164
    phone_verified: Mapped[bool] = mapped_column(default=False)
    preferred_language: Mapped[str] = mapped_column(default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AuthSession(Base):
    """Server-side session created after OTP verification; its id is the opaque value
    stored in the HttpOnly session cookie. DB-backed (rather than a signed token) so
    logout/expiry are enforced centrally instead of trusting an unrevocable token."""

    __tablename__ = "auth_sessions"

    id: Mapped[str] = mapped_column(primary_key=True)  # opaque session id
    user_id: Mapped[str] = mapped_column(ForeignKey("app_users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[AppUser] = relationship()


class Appointment(Base):
    """DEMO DATA: fictional appointment/booking record for the RuralCare AI showcase."""

    __tablename__ = "appointments"

    id: Mapped[str] = mapped_column(primary_key=True)  # appointment_id, displayed to users as "DEMO-XXXXXXXX"
    # For browser/chat bookings this is app_users.id (a phone-verified user). Inbound
    # SMS/voice channels still use the "sms:<phone>"/"voice:<phone>" convention (see
    # app/api/routes/sms.py, voice.py) since those channels assert identity via Twilio's
    # own inbound webhook rather than this app's OTP flow. Not modeled as a SQLAlchemy FK
    # since it can point at either source.
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
_ACTIVE_STATUSES = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]
Index(
    "uq_active_appointment_per_slot",
    Appointment.slot_id,
    unique=True,
    sqlite_where=Appointment.status.in_(_ACTIVE_STATUSES),
    postgresql_where=Appointment.status.in_(_ACTIVE_STATUSES),
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
