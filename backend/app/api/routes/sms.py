from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Form, Response
from twilio.twiml.messaging_response import MessagingResponse

from app.models.schemas import ChatRequest
from app.services.agent_service import AgentService, AgentServiceError, get_agent_service

router = APIRouter(prefix="/sms", tags=["sms"])
logger = logging.getLogger(__name__)


def _sms_session_id(phone_number: str) -> str:
    """Every message from the same phone number resumes the same conversation --
    this is the entire "session identification" story for SMS (PRD UC-05)."""
    return f"sms:{phone_number}"


def _format_sms_body(message: str, appointment: dict | None) -> str:
    """Render the same structured appointment payload the chat UI turns into cards as
    a short, numbered plain-text list -- SMS has no UI, so options must be readable as
    text (PRD Phase 4.12: "Keep SMS messages concise. Prefer numbered choices.")."""
    if not appointment:
        return message

    kind = appointment.get("type")
    lines = [message]

    if kind == "hospital_options":
        for index, hospital in enumerate(appointment.get("hospitals", []), start=1):
            lines.append(f"{index}. {hospital['name']} ({hospital['location']})")
        lines.append("Reply with a number to choose.")
    elif kind == "doctor_options":
        for index, doctor in enumerate(appointment.get("doctors", []), start=1):
            lines.append(f"{index}. {doctor['name']} - {doctor['specialty']}")
        lines.append("Reply with a number to choose.")
    elif kind == "slot_options":
        for index, slot in enumerate(appointment.get("slots", []), start=1):
            lines.append(f"{index}. {slot['date']} {slot['start_time']}")
        lines.append("Reply with a number to choose.")
    elif kind == "confirm":
        lines.append("Reply YES to confirm.")

    return "\n".join(lines)


@router.post("/webhook")
async def sms_webhook(
    From: str = Form(...),  # noqa: N803 -- Twilio's form field names are capitalized
    Body: str = Form(...),
    service: AgentService = Depends(get_agent_service),
) -> Response:
    """Twilio inbound-SMS webhook. Reuses the exact same AgentService/LangGraph as chat
    and voice -- there is no separate SMS appointment agent (PRD Phase 4.11 rule, which
    applies equally here: "Do not create another appointment agent")."""
    twiml = MessagingResponse()
    session_id = _sms_session_id(From)
    text = (Body or "").strip()

    if not text:
        twiml.message("Please send a message, e.g. BOOK DOCTOR.")
        return Response(content=str(twiml), media_type="application/xml")

    try:
        request = ChatRequest(session_id=session_id, message=text)
        response = service.handle_chat(request, channel="sms")
        reply_text = _format_sms_body(response.message, response.appointment)
    except AgentServiceError:
        logger.exception("SMS request failed for session %s", session_id)
        reply_text = "Voice/SMS assistant is temporarily unavailable -- Demo Mode. Please try again shortly."
    except Exception:  # pragma: no cover -- never leak internals to an SMS reply
        logger.exception("Unexpected SMS failure for session %s", session_id)
        reply_text = "Sorry, something went wrong on our end. Please try again shortly."

    twiml.message(reply_text)
    return Response(content=str(twiml), media_type="application/xml")


@router.get("")
def sms_status() -> dict:
    return {"status": "ok", "stage": 4, "webhook": "/sms/webhook"}
