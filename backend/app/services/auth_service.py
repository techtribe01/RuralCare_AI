from __future__ import annotations

import re
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config.settings import Settings, get_settings
from app.db.models import AppUser, AuthSession
from app.services.twilio_verify_service import TwilioVerifyError, TwilioVerifyService

_E164_RE = re.compile(r"^\+[1-9]\d{7,14}$")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _as_aware_utc(value: datetime) -> datetime:
    """SQLite drops tzinfo on round-trip even for DateTime(timezone=True) columns, so a
    freshly-read expires_at can come back naive. Treat naive values as UTC (the only
    timezone this app ever writes) so comparisons against an aware "now" don't raise."""
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


class AuthError(Exception):
    """Raised for any auth failure. `code` is a stable, machine-readable reason the API
    layer maps to an HTTP status -- never a raw Twilio error or stack trace."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class AuthService:
    """Owns the phone-OTP login flow: starting/checking a Twilio Verify verification,
    and finding-or-creating the phone-verified user + session on success."""

    def __init__(self, verify_service: TwilioVerifyService | None = None, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.verify_service = verify_service or TwilioVerifyService(self.settings)

    def send_otp(self, phone_number: str) -> None:
        if not _E164_RE.match(phone_number or ""):
            raise AuthError("invalid_phone", "Enter a valid mobile number in international format, e.g. +91XXXXXXXXXX.")
        try:
            self.verify_service.start_verification(phone_number)
        except TwilioVerifyError as exc:
            raise AuthError(exc.code, exc.message) from exc

    def verify_otp(self, db: Session, phone_number: str, code: str) -> tuple[AppUser, str]:
        if not _E164_RE.match(phone_number or ""):
            raise AuthError("invalid_phone", "Enter a valid mobile number in international format, e.g. +91XXXXXXXXXX.")
        if not code or not code.strip():
            raise AuthError("invalid_code", "Enter the verification code that was sent to you.")

        try:
            approved = self.verify_service.check_verification(phone_number, code)
        except TwilioVerifyError as exc:
            raise AuthError(exc.code, exc.message) from exc

        if not approved:
            raise AuthError("invalid_code", "The code you entered is incorrect or has expired.")

        now = _utcnow()
        user = db.query(AppUser).filter(AppUser.phone_number == phone_number).one_or_none()
        if user is None:
            user = AppUser(id=uuid.uuid4().hex, phone_number=phone_number, phone_verified=True, last_login_at=now)
            db.add(user)
        else:
            user.phone_verified = True
            user.last_login_at = now
        db.commit()
        db.refresh(user)

        session = AuthSession(
            id=uuid.uuid4().hex,
            user_id=user.id,
            expires_at=now + timedelta(hours=self.settings.session_ttl_hours),
        )
        db.add(session)
        db.commit()

        return user, session.id

    def get_user_for_session(self, db: Session, session_id: str) -> AppUser | None:
        session = db.get(AuthSession, session_id)
        if session is None or session.revoked_at is not None:
            return None
        if _as_aware_utc(session.expires_at) <= _utcnow():
            return None
        return db.get(AppUser, session.user_id)

    def logout(self, db: Session, session_id: str) -> None:
        session = db.get(AuthSession, session_id)
        if session is not None and session.revoked_at is None:
            session.revoked_at = _utcnow()
            db.commit()


_DEFAULT_AUTH_SERVICE: AuthService | None = None


def get_auth_service() -> AuthService:
    global _DEFAULT_AUTH_SERVICE
    if _DEFAULT_AUTH_SERVICE is None:
        _DEFAULT_AUTH_SERVICE = AuthService()
    return _DEFAULT_AUTH_SERVICE
