from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Form, Response
from twilio.twiml.voice_response import Gather, VoiceResponse

from app.models.schemas import ChatRequest
from app.services.agent_service import AgentService, AgentServiceError, get_agent_service

router = APIRouter(prefix="/voice", tags=["voice"])
logger = logging.getLogger(__name__)

# Simple in-memory voice state tracker for observability / status endpoint.
# Maps session_id -> current state (IDLE, LISTENING, PROCESSING, SPEAKING, ERROR).
_VOICE_STATES: dict[str, str] = {}


def _voice_session_id(phone_number: str) -> str:
    return f"voice:{phone_number}"


def _set_voice_state(session_id: str, state: str) -> None:
    _VOICE_STATES[session_id] = state


@router.get("")
def voice_status() -> dict:
    return {
        "status": "ok",
        "stage": 4,
        "webhook": "/voice/webhook",
        "states": ["IDLE", "LISTENING", "PROCESSING", "SPEAKING", "ERROR"],
        "active_sessions": len(_VOICE_STATES),
    }


@router.get("/state/{session_id}")
def get_voice_state(session_id: str) -> dict:
    return {"session_id": session_id, "state": _VOICE_STATES.get(session_id, "IDLE")}


@router.post("/webhook")
async def voice_webhook(
    From: str = Form(default=""),  # noqa: N803
    SpeechResult: str = Form(default=""),  # noqa: N803
    CallSid: str = Form(default=""),  # noqa: N803
    service: AgentService = Depends(get_agent_service),
) -> Response:
    """Twilio voice webhook. Reuses the same LangGraph agent as chat and SMS.

    Flow: Phone -> Twilio -> Speech-to-text -> FastAPI -> LangGraph -> Appointment Tools
          -> Response -> Text-to-speech -> Twilio -> Phone
    """
    twiml = VoiceResponse()
    session_id = _voice_session_id(From or CallSid or "unknown")
    speech = (SpeechResult or "").strip()

    if not speech:
        _set_voice_state(session_id, "LISTENING")
        gather = Gather(input="speech", action="/voice/webhook", method="POST", speech_timeout="auto", language="en-IN")
        gather.say(
            "Welcome to Rural Care AI. How can I help you today? You can say things like I need a general physician.",
            voice="Polly.Aditi",
        )
        twiml.append(gather)
        twiml.say("I did not hear anything. Voice is temporarily unavailable. Continue in chat.", voice="Polly.Aditi")
        return Response(content=str(twiml), media_type="application/xml")

    _set_voice_state(session_id, "PROCESSING")
    try:
        request = ChatRequest(session_id=session_id, message=speech)
        response = service.handle_chat(request, channel="voice")
        reply = response.message
        _set_voice_state(session_id, "SPEAKING")

        if response.appointment and response.appointment.get("type") == "confirm":
            reply += " Please say yes to confirm."

        twiml.say(reply, voice="Polly.Aditi")

        if response.appointment and response.appointment.get("type") not in ("booked", "cancelled_by_user"):
            gather = Gather(input="speech", action="/voice/webhook", method="POST", speech_timeout="auto", language="en-IN")
            gather.say("What would you like to do next?", voice="Polly.Aditi")
            twiml.append(gather)
            _set_voice_state(session_id, "LISTENING")
        else:
            _set_voice_state(session_id, "IDLE")

    except AgentServiceError:
        logger.exception("Voice request failed for session %s", session_id)
        _set_voice_state(session_id, "ERROR")
        twiml.say(
            "Voice is temporarily unavailable. Continue in chat.",
            voice="Polly.Aditi",
        )
    except Exception:  # pragma: no cover
        logger.exception("Unexpected voice failure for session %s", session_id)
        _set_voice_state(session_id, "ERROR")
        twiml.say(
            "Voice is temporarily unavailable. Continue in chat.",
            voice="Polly.Aditi",
        )

    return Response(content=str(twiml), media_type="application/xml")
