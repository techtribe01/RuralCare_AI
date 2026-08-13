from __future__ import annotations

from enum import Enum


class HospitalType(str, Enum):
    MULTI_SPECIALTY = "multi_specialty"
    GENERAL = "general"
    SPECIALTY_CARE = "specialty_care"


class EntityStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class ConsultationType(str, Enum):
    IN_PERSON = "in_person"
    TELECONSULT = "teleconsult"
    BOTH = "both"


class SlotStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    HELD = "HELD"
    BOOKED = "BOOKED"
    CANCELLED = "CANCELLED"


class AppointmentStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    RESCHEDULED = "RESCHEDULED"
    COMPLETED = "COMPLETED"


class NotificationStatus(str, Enum):
    SENT = "sent"
    DEMO_MODE = "demo_mode"
    FAILED = "failed"
