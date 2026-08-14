from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Form, Response
from twilio.twiml.voice_response import Gather, VoiceResponse

from app.models.schemas import ChatRequest, LanguageCode
from app.services.agent_service import AgentService, AgentServiceError, get_agent_service

router = APIRouter(prefix="/voice", tags=["voice"])
logger = logging.getLogger(__name__)

# Simple in-memory voice state tracker for observability / status endpoint.
# Maps session_id -> current state (IDLE, LISTENING, PROCESSING, SPEAKING, ERROR).
_VOICE_STATES: dict[str, str] = {}

# Maps session_id -> chosen language ("en"/"te") for the life of the call. Twilio's
# speech recognizer needs one fixed language per <Gather>, so -- unlike chat/SMS --
# voice can't silently auto-detect language turn by turn; the caller picks it once
# via a short DTMF/speech prompt and every subsequent turn is pinned to that choice.
_VOICE_LANGUAGES: dict[str, str] = {}

# Twilio's <Say> needs an explicit voice per language: Polly has no Telugu voice, so
# English uses Amazon Polly (Indian-English) and Telugu uses Google's Cloud TTS voice,
# which Twilio also proxies. Gather's `language` selects the speech-recognition locale.
_VOICE_COPY = {
    "en": {
        "gather_language": "en-IN",
        "voice": "Polly.Aditi",
        "greeting": (
            "Welcome to Rural Care AI. How can I help you today? "
            "You can say things like, I need a general physician."
        ),
        "next_prompt": "What would you like to do next?",
        "no_input": "I did not hear anything. Voice is temporarily unavailable. Continue in chat.",
        "unavailable": "Voice is temporarily unavailable. Continue in chat.",
        "confirm_hint": " Please say yes to confirm.",
    },
    "te": {
        "gather_language": "te-IN",
        "voice": "Google.te-IN-Standard-A",
        "greeting": (
            "రూరల్ కేర్ AI కి స్వాగతం. మీకు ఈరోజు ఎలా సహాయం చేయగలను? "
            "ఉదాహరణకు, 'నాకు జనరల్ ఫిజిషియన్ కావాలి' అని చెప్పవచ్చు."
        ),
        "next_prompt": "మీరు తర్వాత ఏమి చేయాలనుకుంటున్నారు?",
        "no_input": "నాకు ఏమీ వినిపించలేదు. వాయిస్ తాత్కాలికంగా అందుబాటులో లేదు. చాట్‌లో కొనసాగించండి.",
        "unavailable": "వాయిస్ తాత్కాలికంగా అందుబాటులో లేదు. చాట్‌లో కొనసాగించండి.",
        "confirm_hint": " నిర్ధారించడానికి దయచేసి 'అవును' అని చెప్పండి.",
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
    twiml = VoiceResponse()
    gather = Gather(
        input="dtmf speech",
        action="/voice/webhook",
        method="POST",
        num_digits=1,
        speech_timeout="auto",
        hints="English,Telugu",
    )
    gather.say("Welcome to Rural Care AI. For English, press 1, or say English.", voice="Polly.Aditi")
    gather.say("తెలుగు కోసం, 2 నొక్కండి, లేదా తెలుగు అని చెప్పండి.", voice="Google.te-IN-Standard-A")
    twiml.append(gather)
    twiml.say("I did not hear a selection. Continuing in English.", voice="Polly.Aditi")
    return Response(content=str(twiml), media_type="application/xml")


def _greeting_response(session_id: str, language: str) -> Response:
    copy = _VOICE_COPY[language]
    _set_voice_state(session_id, "LISTENING")
    twiml = VoiceResponse()
    gather = Gather(
        input="speech",
        action="/voice/webhook",
        method="POST",
        speech_timeout="auto",
        language=copy["gather_language"],
    )
    gather.say(copy["greeting"], voice=copy["voice"])
    twiml.append(gather)
    twiml.say(copy["no_input"], voice=copy["voice"])
    return Response(content=str(twiml), media_type="application/xml")


@router.post("/webhook")
async def voice_webhook(
    From: str = Form(default=""),  # noqa: N803
    SpeechResult: str = Form(default=""),  # noqa: N803
    Digits: str = Form(default=""),  # noqa: N803
    CallSid: str = Form(default=""),  # noqa: N803
    service: AgentService = Depends(get_agent_service),
) -> Response:
    """Twilio voice webhook. Reuses the same LangGraph agent as chat and SMS.

    Flow: Phone -> Twilio -> language selection -> Speech-to-text -> FastAPI -> LangGraph
          -> Appointment Tools -> Response -> Text-to-speech -> Twilio -> Phone
    """
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
    twiml = VoiceResponse()

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

        twiml.say(reply, voice=copy["voice"])

        if response.appointment and response.appointment.get("type") not in ("booked", "cancelled_by_user"):
            gather = Gather(
                input="speech",
                action="/voice/webhook",
                method="POST",
                speech_timeout="auto",
                language=copy["gather_language"],
            )
            gather.say(copy["next_prompt"], voice=copy["voice"])
            twiml.append(gather)
            _set_voice_state(session_id, "LISTENING")
        else:
            _set_voice_state(session_id, "IDLE")
            _VOICE_LANGUAGES.pop(session_id, None)

    except AgentServiceError:
        logger.exception("Voice request failed for session %s", session_id)
        _set_voice_state(session_id, "ERROR")
        twiml.say(copy["unavailable"], voice=copy["voice"])
    except Exception:  # pragma: no cover
        logger.exception("Unexpected voice failure for session %s", session_id)
        _set_voice_state(session_id, "ERROR")
        twiml.say(copy["unavailable"], voice=copy["voice"])

    return Response(content=str(twiml), media_type="application/xml")
