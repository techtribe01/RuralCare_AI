from __future__ import annotations

import logging
from xml.etree import ElementTree as ET

from fastapi import APIRouter, Depends, Form, Query, Response
from fastapi.responses import JSONResponse

from app.models.schemas import ChatRequest
from app.models.schemas import LanguageCode
from app.services.agent_service import AgentService, AgentServiceError, get_agent_service

router = APIRouter(prefix="/voice", tags=["voice"])
logger = logging.getLogger(__name__)

_VOICE_STATES: dict[str, str] = {}
_VOICE_LANGUAGES: dict[str, str] = {}

# Exotel's Gather applet is DTMF-only (no speech recognition) and calls back via GET,
# expecting JSON rather than TwiML. This tracks where each call is in a fixed menu flow,
# separate from the Twilio/speech-based state above.
_EXOTEL_STAGES: dict[str, str] = {}

_EXOTEL_MENU_TEXT = {
    "en": "Press 1 to book an appointment. Press 2 to check or cancel an appointment.",
    "te": "అపాయింట్‌మెంట్ బుక్ చేయడానికి 1 నొక్కండి. అపాయింట్‌మెంట్ చెక్ చేయడానికి లేదా రద్దు చేయడానికి 2 నొక్కండి.",
}
_EXOTEL_MENU_ACTIONS = {
    "1": "I want to book an appointment",
    "2": "I want to check or cancel my appointment",
}
_EXOTEL_GOODBYE_TEXT = {
    "en": "Thank you for calling Rural Care AI. Goodbye.",
    "te": "రూరల్ కేర్ AI కి కాల్ చేసినందుకు ధన్యవాదాలు. వీడ్కోలు.",
}

_VOICE_COPY = {
    "en": {
        "greeting": "Welcome to Rural Care AI. How can I help with your health or appointment today?",
        "no_input": "I did not hear any speech. Please tell me how I can help.",
        "next_prompt": "Is there anything else I can help you with?",
        "confirm_hint": " Say yes to confirm this appointment.",
        "unavailable": "Voice assistant is temporarily unavailable. Please try again shortly.",
        "voice": "Polly.Aditi",
        "gather_language": "en-IN",
    },
    "te": {
        "greeting": "రూరల్ కేర్ AI కి స్వాగతం. ఈరోజు మీ ఆరోగ్య సహాయం లేదా అపాయింట్‌మెంట్ కోసం నేను ఎలా సహాయపడగలను?",
        "no_input": "నాకు ఏమీ వినిపించలేదు. దయచేసి మళ్లీ చెప్పండి.",
        "next_prompt": "నేను మీకు ఇంకా ఏమైనా సహాయం చేయవచ్చా?",
        "confirm_hint": " అపాయింట్‌మెంట్ ఖరారు చేయడానికి అవును అని చెప్పండి.",
        "unavailable": "వాయిస్ అసిస్టెంట్ తాత్కాలికంగా లభించడం లేదు. దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
        "voice": "Google.te-IN-Standard-A",
        "gather_language": "te-IN",
    },
}


def _voice_session_id(phone_number: str) -> str:
    return f"voice:{phone_number}"


def _set_voice_state(session_id: str, state: str) -> None:
    _VOICE_STATES[session_id] = state


def _language_from_input(digits: str, speech: str) -> str | None:
    if digits == "2":
        return "te"
    if digits == "1":
        return "en"
    lowered = speech.lower()
    if "telugu" in lowered or "తెలుగు" in speech:
        return "te"
    if "english" in lowered:
        return "en"
    return None


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


def _language_prompt_response() -> Response:
    resp = ET.Element("Response")
    gather = ET.SubElement(resp, "Gather", input="dtmf speech", action="/voice/webhook", method="POST", num_digits="1", speech_timeout="auto")
    say1 = ET.SubElement(gather, "Say", voice="Polly.Aditi")
    say1.text = "Welcome to Rural Care AI. For English, press 1, or say English."
    say2 = ET.SubElement(gather, "Say", voice="Google.te-IN-Standard-A")
    say2.text = "తెలుగు కొరకు 2 నొక్కండి లేదా తెలుగు అని చెప్పండి."
    fallback = ET.SubElement(resp, "Say", voice="Polly.Aditi")
    fallback.text = "I did not hear a selection. Continuing in English."
    xml_str = ET.tostring(resp, encoding="unicode")
    return Response(content=xml_str, media_type="application/xml")


def _greeting_response(session_id: str, language: str) -> Response:
    copy = _VOICE_COPY[language]
    _set_voice_state(session_id, "LISTENING")
    resp = ET.Element("Response")
    gather = ET.SubElement(resp, "Gather", input="speech", action="/voice/webhook", method="POST", speech_timeout="auto", language=copy["gather_language"])
    say = ET.SubElement(gather, "Say", voice=copy["voice"])
    say.text = copy["greeting"]
    fallback = ET.SubElement(resp, "Say", voice=copy["voice"])
    fallback.text = copy["no_input"]
    xml_str = ET.tostring(resp, encoding="unicode")
    return Response(content=xml_str, media_type="application/xml")


@router.post("/webhook")
async def voice_webhook(
    From: str = Form(default=""),  # noqa: N803
    SpeechResult: str = Form(default=""),  # noqa: N803
    Digits: str = Form(default=""),  # noqa: N803
    CallSid: str = Form(default=""),  # noqa: N803
    service: AgentService = Depends(get_agent_service),
) -> Response:
    session_id = _voice_session_id(From or CallSid or "unknown")
    speech = (SpeechResult or "").strip()
    digits = (Digits or "").strip()

    language = _VOICE_LANGUAGES.get(session_id)
    if language is None:
        selected = _language_from_input(digits, speech)
        if selected is None:
            _set_voice_state(session_id, "LISTENING")
            return _language_prompt_response()
        _VOICE_LANGUAGES[session_id] = selected
        return _greeting_response(session_id, selected)

    copy = _VOICE_COPY.get(language, _VOICE_COPY["en"])
    resp = ET.Element("Response")

    if not speech:
        return _greeting_response(session_id, language)

    _set_voice_state(session_id, "PROCESSING")
    try:
        request = ChatRequest(session_id=session_id, message=speech, language=LanguageCode(language))
        response = service.handle_chat(request, channel="voice")
        reply = response.message
        _set_voice_state(session_id, "SPEAKING")

        if response.appointment and response.appointment.get("type") == "confirm":
            reply += copy["confirm_hint"]

        say = ET.SubElement(resp, "Say", voice=copy["voice"])
        say.text = reply

        if response.appointment and response.appointment.get("type") not in ("booked", "cancelled_by_user"):
            gather = ET.SubElement(resp, "Gather", input="speech", action="/voice/webhook", method="POST", speech_timeout="auto", language=copy["gather_language"])
            say_next = ET.SubElement(gather, "Say", voice=copy["voice"])
            say_next.text = copy["next_prompt"]
            _set_voice_state(session_id, "LISTENING")
        else:
            _set_voice_state(session_id, "IDLE")
            _VOICE_LANGUAGES.pop(session_id, None)

    except AgentServiceError:
        logger.exception("Voice request failed for session %s", session_id)
        _set_voice_state(session_id, "ERROR")
        say_err = ET.SubElement(resp, "Say", voice=copy["voice"])
        say_err.text = copy["unavailable"]
    except Exception:
        logger.exception("Unexpected voice failure for session %s", session_id)
        _set_voice_state(session_id, "ERROR")
        say_err = ET.SubElement(resp, "Say", voice=copy["voice"])
        say_err.text = copy["unavailable"]

    xml_str = ET.tostring(resp, encoding="unicode")
    return Response(content=xml_str, media_type="application/xml")


def _clean_digits(raw: str) -> str:
    return raw.strip().strip('"')


def _exotel_gather(prompt_text: str, *, max_digits: int = 1, finish_on_key: str = "", timeout: int = 8, repeat: int = 1) -> JSONResponse:
    return JSONResponse(
        {
            "gather_prompt": {"text": prompt_text},
            "max_input_digits": max_digits,
            "finish_on_key": finish_on_key,
            "input_timeout": timeout,
            "repeat_menu": repeat,
            "repeat_gather_prompt": {"text": prompt_text},
        }
    )


def _exotel_flow_turn(session_id: str, language: str, message: str, service: AgentService) -> JSONResponse:
    copy = _VOICE_COPY[language]
    try:
        request = ChatRequest(session_id=session_id, message=message, language=LanguageCode(language))
        response = service.handle_chat(request, channel="voice")
        reply = response.message
        appointment = response.appointment or {}
        kind = appointment.get("type")

        if kind in ("hospital_options", "doctor_options", "slot_options"):
            items = appointment.get("hospitals") or appointment.get("doctors") or appointment.get("slots") or []
            lines = [reply]
            for index, item in enumerate(items, start=1):
                label = item.get("name") or f"{item.get('date')} {item.get('start_time')}"
                lines.append(f"{index}. {label}")
            return _exotel_gather(" ".join(lines), max_digits=2, finish_on_key="#")

        if kind == "confirm":
            return _exotel_gather(f"{reply} Press 1 to confirm, or 2 to cancel.", max_digits=1)

        if kind in ("booked", "cancelled_by_user"):
            _EXOTEL_STAGES[session_id] = "DONE"
            return _exotel_gather(f"{reply} {_EXOTEL_GOODBYE_TEXT[language]}", max_digits=1, timeout=1, repeat=0)

        return _exotel_gather(reply, max_digits=2, finish_on_key="#")
    except Exception:
        logger.exception("Exotel voice flow failed for session %s", session_id)
        _EXOTEL_STAGES[session_id] = "DONE"
        return _exotel_gather(copy["unavailable"], max_digits=1, timeout=1, repeat=0)


@router.get("/webhook")
def voice_webhook_exotel(
    CallSid: str = Query(default=""),  # noqa: N803
    From: str = Query(default=""),  # noqa: N803
    digits: str = Query(default=""),  # noqa: N803
    service: AgentService = Depends(get_agent_service),
) -> JSONResponse:
    """Exotel's Gather applet (dynamic-URL mode) calls back via GET and expects
    this JSON contract. DTMF-only: there is no speech recognition on this path."""
    session_id = _voice_session_id(From or CallSid or "unknown")
    pressed = _clean_digits(digits)
    stage = _EXOTEL_STAGES.get(session_id, "LANG")

    if stage == "LANG":
        selected = _language_from_input(pressed, "")
        if selected is None:
            return _exotel_gather("Welcome to Rural Care AI. For English press 1. Telugu కొరకు 2 నొక్కండి.")
        _VOICE_LANGUAGES[session_id] = selected
        _EXOTEL_STAGES[session_id] = "MENU"
        return _exotel_gather(_EXOTEL_MENU_TEXT[selected])

    language = _VOICE_LANGUAGES.get(session_id, "en")

    if stage == "MENU":
        action = _EXOTEL_MENU_ACTIONS.get(pressed)
        if action is None:
            return _exotel_gather(_EXOTEL_MENU_TEXT[language])
        _EXOTEL_STAGES[session_id] = "FLOW"
        return _exotel_flow_turn(session_id, language, action, service)

    if stage == "FLOW":
        return _exotel_flow_turn(session_id, language, pressed or "yes", service)

    _EXOTEL_STAGES.pop(session_id, None)
    _VOICE_LANGUAGES.pop(session_id, None)
    return _exotel_gather(_EXOTEL_GOODBYE_TEXT[language], timeout=1, repeat=0)
