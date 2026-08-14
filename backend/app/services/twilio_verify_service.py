from __future__ import annotations

from app.config.settings import Settings, get_settings


class TwilioVerifyError(Exception):
    """Internal, generic error for a failed Twilio Verify call. `code` is one of
    "not_configured", "rate_limited", "invalid_phone", or "service_error" -- Twilio's
    own status/message is never attached, so it can never leak to an API response."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class TwilioVerifyService:
    """Thin wrapper around Twilio Verify. Never generates or stores an OTP itself --
    Twilio owns the code lifecycle end to end; this class only starts/checks a
    verification against the configured Verify Service."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def start_verification(self, phone_number: str) -> None:
        client = self._client()
        try:
            client.verify.v2.services(self.settings.twilio_verify_service_sid).verifications.create(
                to=phone_number, channel="sms"
            )
        except Exception as exc:  # pragma: no cover - requires live Twilio credentials
            raise self._wrap(exc) from exc

    def check_verification(self, phone_number: str, code: str) -> bool:
        client = self._client()
        try:
            result = client.verify.v2.services(self.settings.twilio_verify_service_sid).verification_checks.create(
                to=phone_number, code=code
            )
        except Exception as exc:  # pragma: no cover - requires live Twilio credentials
            raise self._wrap(exc) from exc
        return result.status == "approved"

    def _client(self):  # pragma: no cover - requires live Twilio credentials
        if not self.settings.twilio_verify_configured:
            raise TwilioVerifyError("not_configured", "Phone verification is not configured.")
        from twilio.rest import Client

        return Client(self.settings.twilio_account_sid, self.settings.twilio_auth_token)

    def _wrap(self, exc: Exception) -> TwilioVerifyError:  # pragma: no cover - requires live Twilio credentials
        from twilio.base.exceptions import TwilioRestException

        if isinstance(exc, TwilioRestException):
            if exc.status == 429 or exc.code in (60203, 60212):
                return TwilioVerifyError("rate_limited", "Too many verification attempts. Please try again later.")
            if exc.code in (60200, 60205, 60033):
                return TwilioVerifyError("invalid_phone", "That phone number could not be used for verification.")
        return TwilioVerifyError("service_error", "Verification is temporarily unavailable. Please try again.")
