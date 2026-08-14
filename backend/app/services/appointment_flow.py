from __future__ import annotations

"""Deterministic, multi-turn appointment conversation state machine.

Shared by chat, voice, and SMS -- the graph node in app.services.agent_graph calls
`AppointmentFlowEngine.run()` once per turn, and this module is the ONLY place that
decides what to ask next. It never talks to the database or Twilio directly; every
side effect goes through app.services.appointment_tools, so exactly the same
validation, transaction, and double-booking protection applies no matter which
channel the user is on (PRD Phase 4.13: "language-independent internally").
"""

import re
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.db.models import Appointment as AppointmentModel
from app.db.models import Specialty
from app.services.appointment_tools import (
    AppointmentValidationError,
    book_appointment,
    check_slots,
    search_doctors,
    search_hospitals,
    send_notification,
)
from app.services.doctor_service import DoctorService
from app.services.hospital_service import HospitalService

_doctor_service = DoctorService()
_hospital_service = HospitalService()

# Steps where a follow-up reply should still be routed back into the appointment flow
# rather than re-classified as a fresh, unrelated intent. "confirmed" is intentionally
# excluded -- once a booking completes, the next message starts a clean slate.
ACTIVE_APPOINTMENT_STEPS = {"collect_specialty", "select_hospital", "select_doctor", "select_slot", "await_confirmation"}

_SPECIALTY_SYNONYMS = {
    "general physician": "general medicine",
    "general medicine": "general medicine",
    "family doctor": "general medicine",
    "family physician": "general medicine",
    "gp": "general medicine",
    "pediatrician": "pediatrics",
    "paediatrician": "pediatrics",
    "child specialist": "pediatrics",
    "children's doctor": "pediatrics",
    "kids doctor": "pediatrics",
    "cardiologist": "cardiology",
    "heart specialist": "cardiology",
    "heart doctor": "cardiology",
    "dermatologist": "dermatology",
    "skin specialist": "dermatology",
    "skin doctor": "dermatology",
    "gynecologist": "gynecology",
    "gynaecologist": "gynecology",
    "women's health": "gynecology",
    "orthopedic": "orthopedics",
    "orthopaedic": "orthopedics",
    "bone doctor": "orthopedics",
    "joint specialist": "orthopedics",
    "ent specialist": "ent",
    "ear nose throat": "ent",
    "ent doctor": "ent",
    # Telugu terms for the offline (no-OPENAI_API_KEY) heuristic path. Matching still
    # resolves to the same canonical English specialty name from the database -- the
    # appointment flow itself stays fully language-independent (PRD Phase 4.13).
    "సాధారణ వైద్యుడు": "general medicine",
    "జనరల్ మెడిసిన్": "general medicine",
    "పీడియాట్రిషియన్": "pediatrics",
    "శిశువైద్యుడు": "pediatrics",
    "పిల్లల డాక్టర్": "pediatrics",
    "కార్డియాలజిస్ట్": "cardiology",
    "గుండె వైద్యుడు": "cardiology",
    "చర్మ వైద్యుడు": "dermatology",
    "డెర్మటాలజిస్ట్": "dermatology",
    "గైనకాలజిస్ట్": "gynecology",
    "స్త్రీ వైద్యుడు": "gynecology",
    "ఎముకల వైద్యుడు": "orthopedics",
    "ఆర్థోపెడిక్": "orthopedics",
    "చెవి ముక్కు గొంతు": "ent",
}

_AFFIRMATIVE_PHRASES = {"yes", "y", "yes please", "confirm", "confirmed", "confirm booking", "ok", "okay", "proceed", "sure", "book it", "go ahead"}
_NEGATIVE_PHRASES = {"no", "n", "cancel", "stop", "not now", "never mind", "nevermind"}


def _t(language: str, en: str, te: str) -> str:
    return te if language == "te" else en


def _list_specialties(db: Session) -> list[str]:
    return [row.name for row in db.query(Specialty).order_by(Specialty.name).all()]


def _extract_specialty(db: Session, message: str) -> str | None:
    lowered = message.lower()
    specialties = _list_specialties(db)
    name_by_lower = {name.lower(): name for name in specialties}

    for lower_name, canonical in name_by_lower.items():
        if lower_name in lowered:
            return canonical
    for phrase, canonical_lower in _SPECIALTY_SYNONYMS.items():
        if phrase in lowered and canonical_lower in name_by_lower:
            return name_by_lower[canonical_lower]
    return None


def _parse_numeric_selection(message: str) -> int | None:
    match = re.fullmatch(r"\s*(?:option\s*)?#?(\d{1,2})[.)]?\s*", message.strip(), flags=re.IGNORECASE)
    if not match:
        return None
    value = int(match.group(1))
    if value < 1 or value > 50:
        return None
    return value - 1


def _is_affirmative(message: str) -> bool:
    lowered = message.strip().lower()
    return lowered in _AFFIRMATIVE_PHRASES or lowered.startswith("yes")


def _is_negative(message: str) -> bool:
    lowered = message.strip().lower()
    return lowered in _NEGATIVE_PHRASES or lowered.startswith("no")


@dataclass
class AppointmentFlowResult:
    care_context: dict
    message: str
    next_action: str
    requires_followup: bool
    appointment_payload: dict | None
    events: list[tuple[str, str]] = field(default_factory=list)


class AppointmentFlowEngine:
    def run(self, db: Session, *, state: dict) -> AppointmentFlowResult:
        message = state.get("normalized_message") or state.get("user_message") or ""
        language = state.get("language", "en")
        channel = state.get("channel", "chat")
        intent = state.get("intent")
        care_context = dict(state.get("care_context") or {})
        events: list[tuple[str, str]] = []

        # Apply explicit UI-driven selections for this turn (Assistant cards, or the
        # structured Appointments page talking to the graph instead of free text).
        if state.get("selected_hospital_id"):
            care_context["hospital_id"] = state["selected_hospital_id"]
            care_context.pop("hospital_options", None)
        if state.get("selected_doctor_id"):
            selected_doctor_id = state["selected_doctor_id"]
            care_context["doctor_id"] = selected_doctor_id
            care_context.pop("doctor_options", None)
            # A doctor belongs to exactly one hospital, so derive hospital_id from the
            # doctor record itself -- the free-text numeric-selection path below does
            # the same. Without this, confirmation crashes with a missing hospital_id
            # whenever a doctor is chosen without an explicit prior hospital pick (the
            # common "I want a general physician" -> click a doctor card flow).
            doctor_record = _doctor_service.get_doctor(db, selected_doctor_id)
            if doctor_record:
                care_context["hospital_id"] = doctor_record.hospital_id
        if state.get("selected_slot_id"):
            care_context["slot_id"] = state["selected_slot_id"]
            care_context.pop("slot_options", None)

        if care_context.get("step") in ACTIVE_APPOINTMENT_STEPS and _is_negative(message):
            events.append(("appointment_cancelled_by_user", "User declined to continue the appointment flow."))
            return AppointmentFlowResult(
                care_context={},
                message=_t(
                    language,
                    "No problem -- I won't book anything. Let me know if you'd like to start over.",
                    "పర్వాలేదు -- ఏమీ బుక్ చేయము. మళ్లీ మొదలుపెట్టాలంటే చెప్పండి.",
                ),
                next_action="appointment_cancelled",
                requires_followup=False,
                appointment_payload={"type": "cancelled_by_user"},
                events=events,
            )

        # 1. Need identification (specialty)
        if not care_context.get("specialty"):
            specialty = _extract_specialty(db, message)
            if specialty:
                care_context["specialty"] = specialty
                events.append(("specialty_identified", f"Specialty identified: {specialty}."))
            else:
                specialties = _list_specialties(db)
                care_context["step"] = "collect_specialty"
                events.append(("specialty_prompt", "Specialty not yet identified; asked the user to choose one."))
                return AppointmentFlowResult(
                    care_context=care_context,
                    message=_t(
                        language,
                        "Sure, I can help you find a doctor. Which type of doctor do you need? " + ", ".join(specialties) + ".",
                        "తప్పకుండా, నేను వైద్యుడిని కనుగొనడంలో సహాయపడగలను. మీకు ఏ రకమైన వైద్యుడు అవసరం? " + ", ".join(specialties) + ".",
                    ),
                    next_action="collect_specialty",
                    requires_followup=True,
                    appointment_payload={"type": "collect_specialty", "specialties": specialties},
                    events=events,
                )

        # 2. Optional hospital search -- only for an explicit "which hospitals..." ask,
        # and only before a doctor has been chosen (PRD Scenario B).
        if intent == "hospital_search" and not care_context.get("hospital_id") and not care_context.get("doctor_id"):
            selection = _parse_numeric_selection(message)
            if care_context.get("hospital_options") and selection is not None:
                options = care_context["hospital_options"]
                if 0 <= selection < len(options):
                    chosen = options[selection]
                    care_context["hospital_id"] = chosen["hospital_id"]
                    care_context.pop("hospital_options", None)
                    events.append(("hospital_selected", f"User selected hospital: {chosen['name']}."))

            if not care_context.get("hospital_id"):
                hospitals = search_hospitals(db, specialty=care_context["specialty"])
                events.append(("hospital_search", f"{len(hospitals)} hospital(s) found for {care_context['specialty']}."))
                if not hospitals:
                    return AppointmentFlowResult(
                        care_context=care_context,
                        message=_t(
                            language,
                            f"I couldn't find a hospital offering {care_context['specialty']} right now. Would you like to try a different specialty?",
                            f"{care_context['specialty']} అందించే ఆసుపత్రి ప్రస్తుతం కనబడలేదు. వేరే స్పెషాలిటీ ప్రయత్నించాలా?",
                        ),
                        next_action="no_hospitals_found",
                        requires_followup=True,
                        appointment_payload={"type": "no_hospitals_found"},
                        events=events,
                    )
                care_context["hospital_options"] = [h.model_dump(mode="json") for h in hospitals]
                care_context["step"] = "select_hospital"
                return AppointmentFlowResult(
                    care_context=care_context,
                    message=_t(language, "Here are hospitals that can help:", "ఇక్కడ సహాయపడే ఆసుపత్రులు ఉన్నాయి:"),
                    next_action="select_hospital",
                    requires_followup=True,
                    appointment_payload={"type": "hospital_options", "hospitals": care_context["hospital_options"]},
                    events=events,
                )

        # 3. Doctor search
        if not care_context.get("doctor_id"):
            selection = _parse_numeric_selection(message)
            if care_context.get("doctor_options") and selection is not None:
                options = care_context["doctor_options"]
                if 0 <= selection < len(options):
                    chosen = options[selection]
                    care_context["doctor_id"] = chosen["doctor_id"]
                    care_context["hospital_id"] = chosen["hospital_id"]
                    care_context.pop("doctor_options", None)
                    events.append(("doctor_selected", f"User selected doctor: {chosen['name']}."))

            if not care_context.get("doctor_id"):
                doctors = search_doctors(db, specialty=care_context["specialty"], hospital_id=care_context.get("hospital_id"))
                events.append(("doctor_search", f"{len(doctors)} doctor(s) found."))
                if not doctors:
                    care_context.pop("hospital_id", None)
                    return AppointmentFlowResult(
                        care_context=care_context,
                        message=_t(
                            language,
                            "I couldn't find an available doctor for that right now. Would you like to try a different specialty or hospital?",
                            "ప్రస్తుతం అందుబాటులో వైద్యుడు కనబడలేదు. వేరే స్పెషాలిటీ లేదా ఆసుపత్రి ప్రయత్నించాలా?",
                        ),
                        next_action="no_doctors_found",
                        requires_followup=True,
                        appointment_payload={"type": "no_doctors_found"},
                        events=events,
                    )
                care_context["doctor_options"] = [d.model_dump(mode="json") for d in doctors]
                care_context["step"] = "select_doctor"
                return AppointmentFlowResult(
                    care_context=care_context,
                    message=_t(language, "Here are doctors who can see you:", "మిమ్మల్ని చూడగల వైద్యులు ఇక్కడ ఉన్నారు:"),
                    next_action="select_doctor",
                    requires_followup=True,
                    appointment_payload={"type": "doctor_options", "doctors": care_context["doctor_options"]},
                    events=events,
                )

        # 4. Slot search
        if not care_context.get("slot_id"):
            selection = _parse_numeric_selection(message)
            if care_context.get("slot_options") and selection is not None:
                options = care_context["slot_options"]
                if 0 <= selection < len(options):
                    chosen = options[selection]
                    care_context["slot_id"] = chosen["slot_id"]
                    care_context.pop("slot_options", None)
                    events.append(("slot_selected", f"User selected slot: {chosen['slot_id']}."))

            if not care_context.get("slot_id"):
                slots = check_slots(db, doctor_id=care_context["doctor_id"])
                events.append(("slot_search", f"{len(slots)} available slot(s) found."))
                if not slots:
                    care_context.pop("doctor_id", None)
                    care_context.pop("doctor_options", None)
                    return AppointmentFlowResult(
                        care_context=care_context,
                        message=_t(
                            language,
                            "That doctor has no open time slots right now. Would you like to see another doctor?",
                            "ఆ వైద్యుడికి ప్రస్తుతం ఖాళీ సమయాలు లేవు. వేరే వైద్యుడిని చూడాలా?",
                        ),
                        next_action="no_slots_available",
                        requires_followup=True,
                        appointment_payload={"type": "no_slots_available"},
                        events=events,
                    )
                care_context["slot_options"] = [s.model_dump(mode="json") for s in slots]
                care_context["step"] = "select_slot"
                return AppointmentFlowResult(
                    care_context=care_context,
                    message=_t(language, "Here are the available times:", "ఇక్కడ అందుబాటులో ఉన్న సమయాలు ఉన్నాయి:"),
                    next_action="select_slot",
                    requires_followup=True,
                    appointment_payload={
                        "type": "slot_options",
                        "doctor_id": care_context["doctor_id"],
                        "slots": care_context["slot_options"],
                    },
                    events=events,
                )

        # 5. Present confirmation once, then wait for an explicit reply.
        if care_context.get("step") != "await_confirmation":
            doctor = _doctor_service.get_doctor(db, care_context["doctor_id"])
            hospital = _hospital_service.get_hospital(db, care_context["hospital_id"])
            slot = next((s for s in care_context.get("slot_options", []) if s["slot_id"] == care_context["slot_id"]), None)
            if slot is None:
                fetched = check_slots(db, doctor_id=care_context["doctor_id"])
                slot = next((s.model_dump(mode="json") for s in fetched if s.slot_id == care_context["slot_id"]), None)

            proposed = {
                "doctor_id": care_context["doctor_id"],
                "doctor_name": doctor.name if doctor else "",
                "specialty": doctor.specialty if doctor else care_context.get("specialty", ""),
                "hospital_id": care_context["hospital_id"],
                "hospital_name": hospital.name if hospital else "",
                "location": hospital.location if hospital else "",
                "slot_id": care_context["slot_id"],
                "date": slot["date"] if slot else None,
                "start_time": slot["start_time"] if slot else None,
                "end_time": slot["end_time"] if slot else None,
            }
            care_context["proposed_appointment"] = proposed
            care_context["step"] = "await_confirmation"
            events.append(("present_confirmation", "Proposed appointment presented to the user for confirmation."))
            return AppointmentFlowResult(
                care_context=care_context,
                message=_t(
                    language,
                    f"Please confirm: {proposed['doctor_name']} ({proposed['specialty']}) at {proposed['hospital_name']} "
                    f"on {proposed['date']} at {proposed['start_time']}. Reply YES to confirm.",
                    f"దయచేసి నిర్ధారించండి: {proposed['doctor_name']} ({proposed['specialty']}), {proposed['hospital_name']}లో "
                    f"{proposed['date']} న {proposed['start_time']}కి. నిర్ధారించడానికి YES అని పంపండి.",
                ),
                next_action="confirm_appointment_required",
                requires_followup=True,
                appointment_payload={"type": "confirm", "proposed": proposed},
                events=events,
            )

        # 6. Awaiting explicit confirmation.
        confirmed = bool(state.get("confirm_booking")) or _is_affirmative(message)
        events.append(("user_confirmation", f"User confirmation received: {confirmed}."))
        if not confirmed:
            proposed = care_context.get("proposed_appointment", {})
            return AppointmentFlowResult(
                care_context=care_context,
                message=_t(
                    language,
                    "No problem -- reply YES when you're ready to confirm, or tell me what you'd like to change.",
                    "పర్వాలేదు -- సిద్ధంగా ఉన్నప్పుడు YES అని పంపండి, లేదా మార్చాలనుకున్నది చెప్పండి.",
                ),
                next_action="confirm_appointment_required",
                requires_followup=True,
                appointment_payload={"type": "confirm", "proposed": proposed},
                events=events,
            )

        # 7. Booking requires a phone-verified identity for the web chat widget. SMS/voice
        # already assert identity via Twilio's own inbound webhook (see sms.py/voice.py),
        # so they keep booking under their existing "sms:<phone>"/"voice:<phone>" id and
        # are not gated here. If the chat user isn't authenticated yet, pause with
        # care_context untouched (still "await_confirmation") -- the frontend runs the
        # OTP flow and resubmits confirm_booking=True on this same session_id, which
        # resumes exactly at this step without re-collecting anything.
        if channel == "chat":
            booking_user_id = state.get("authenticated_user_id")
            if not booking_user_id:
                events.append(("auth_required", "Booking requires phone verification; authentication flow started."))
                return AppointmentFlowResult(
                    care_context=care_context,
                    message=_t(
                        language,
                        "Before I can book this, I need to verify your mobile number. Please verify to continue.",
                        "దీన్ని బుక్ చేయడానికి ముందు మీ మొబైల్ నంబర్‌ను నిర్ధారించాలి. కొనసాగించడానికి దయచేసి నిర్ధారించండి.",
                    ),
                    next_action="auth_required",
                    requires_followup=True,
                    appointment_payload={"type": "auth_required", "proposed": care_context.get("proposed_appointment")},
                    events=events,
                )
        else:
            booking_user_id = state.get("user_id", "")

        # 8. Validated booking tool -- the ONLY path that may create a CONFIRMED
        # appointment, and only reachable after the explicit confirmation above.
        events.append(("booking_tool_invoked", "Booking tool invoked after explicit user confirmation."))
        try:
            appointment = book_appointment(
                db,
                user_id=booking_user_id,
                doctor_id=care_context["doctor_id"],
                hospital_id=care_context["hospital_id"],
                slot_id=care_context["slot_id"],
                confirmation=True,
                channel=channel,
            )
            events.append(("database_updated", f"Appointment {appointment.booking_id} confirmed; slot marked BOOKED."))
            appointment_model = db.get(AppointmentModel, appointment.appointment_id)
            notification = send_notification(db, appointment_model, channel=channel, kind="confirmation")
            events.append(("notification", f"Notification status: {notification.status.value}."))

            return AppointmentFlowResult(
                care_context={"step": "confirmed", "last_appointment_id": appointment.appointment_id},
                message=_t(
                    language,
                    f"Your appointment is confirmed with {appointment.doctor.name} ({appointment.doctor.specialty}) at "
                    f"{appointment.hospital.name} on {appointment.slot.date} at {appointment.slot.start_time}. "
                    f"Booking ID: {appointment.booking_id}.",
                    f"మీ అపాయింట్‌మెంట్ నిర్ధారించబడింది: {appointment.doctor.name} ({appointment.doctor.specialty}), "
                    f"{appointment.hospital.name}లో {appointment.slot.date} న {appointment.slot.start_time}కి. "
                    f"బుకింగ్ ఐడి: {appointment.booking_id}.",
                ),
                next_action="appointment_confirmed",
                requires_followup=False,
                appointment_payload={
                    "type": "booked",
                    "appointment": appointment.model_dump(mode="json"),
                    "notification": notification.model_dump(mode="json"),
                },
                events=events,
            )
        except AppointmentValidationError as exc:
            events.append(("booking_failed", exc.message))
            care_context.pop("slot_id", None)
            care_context.pop("slot_options", None)
            care_context["step"] = "select_slot"
            return AppointmentFlowResult(
                care_context=care_context,
                message=_t(
                    language,
                    "Sorry -- that time slot is no longer available. Let's find another time.",
                    "క్షమించండి -- ఆ సమయం ఇప్పుడు అందుబాటులో లేదు. మరో సమయం చూద్దాం.",
                ),
                next_action="slot_unavailable",
                requires_followup=True,
                appointment_payload={"type": "booking_failed", "reason": exc.code},
                events=events,
            )
