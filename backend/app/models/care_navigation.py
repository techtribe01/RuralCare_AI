from __future__ import annotations

from datetime import date as date_
from datetime import time as time_

from pydantic import BaseModel, Field

from app.models.care_navigation_enums import (
    AppointmentStatus,
    ConsultationType,
    EntityStatus,
    HospitalType,
    NotificationStatus,
    SlotStatus,
)

DEMO_DATA_LABEL = "DEMO DATA"


class SpecialtyOut(BaseModel):
    specialty_id: str
    name: str
    description: str = ""
    status: EntityStatus


class HospitalOut(BaseModel):
    hospital_id: str
    name: str
    location: str
    hospital_type: HospitalType
    specialties: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    contact: str = ""
    status: EntityStatus
    is_demo_data: bool = True
    data_label: str = DEMO_DATA_LABEL


class DoctorOut(BaseModel):
    doctor_id: str
    name: str
    specialty: str
    hospital_id: str
    hospital_name: str
    location: str
    experience_years: int
    languages: list[str] = Field(default_factory=list)
    consultation_type: ConsultationType
    next_available_slot: "SlotOut | None" = None
    status: EntityStatus
    is_demo_data: bool = True
    data_label: str = DEMO_DATA_LABEL


class SlotOut(BaseModel):
    slot_id: str
    doctor_id: str
    date: date_
    start_time: time_
    end_time: time_
    status: SlotStatus
    is_demo_data: bool = True


class HospitalSearchRequest(BaseModel):
    location: str | None = None
    specialty: str | None = None
    hospital_type: HospitalType | None = None
    language: str | None = None


class DoctorSearchRequest(BaseModel):
    specialty: str | None = None
    location: str | None = None
    hospital_id: str | None = None
    language: str | None = None
    date: date_ | None = None


class SlotSearchRequest(BaseModel):
    doctor_id: str = Field(min_length=1)
    date: date_ | None = None
    date_from: date_ | None = None
    date_to: date_ | None = None


class AppointmentOut(BaseModel):
    appointment_id: str
    booking_id: str
    user_id: str
    status: AppointmentStatus
    doctor: DoctorOut
    hospital: HospitalOut
    slot: SlotOut
    created_at: str
    confirmed_at: str | None = None
    cancelled_at: str | None = None
    channel: str = "chat"
    is_demo_data: bool = True
    data_label: str = DEMO_DATA_LABEL


class BookAppointmentRequest(BaseModel):
    user_id: str = Field(min_length=1)
    doctor_id: str = Field(min_length=1)
    hospital_id: str = Field(min_length=1)
    slot_id: str = Field(min_length=1)
    confirmation: bool = False
    channel: str = "chat"


class CancelAppointmentRequest(BaseModel):
    user_id: str = Field(min_length=1)
    confirmation: bool = False


class RescheduleAppointmentRequest(BaseModel):
    user_id: str = Field(min_length=1)
    new_slot_id: str = Field(min_length=1)
    confirmation: bool = False


class NotificationResult(BaseModel):
    channel: str
    status: NotificationStatus
    message: str
    demo_mode: bool = True
