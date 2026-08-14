from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_optional
from app.config.settings import get_settings
from app.db.models import AppUser
from app.db.session import get_db
from app.services.auth_service import AuthError, AuthService, get_auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

_ERROR_STATUS = {
    "invalid_phone": 400,
    "invalid_code": 401,
    "rate_limited": 429,
    "not_configured": 503,
    "service_error": 503,
}


def _raise_auth_error(exc: AuthError) -> None:
    status_code = _ERROR_STATUS.get(exc.code, 400)
    raise HTTPException(status_code=status_code, detail={"code": exc.code, "message": exc.message}) from exc


class SendOtpRequest(BaseModel):
    phone_number: str = Field(min_length=1)


class VerifyOtpRequest(BaseModel):
    phone_number: str = Field(min_length=1)
    code: str = Field(min_length=1)


@router.post("/send-otp")
def send_otp(payload: SendOtpRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict:
    try:
        auth_service.send_otp(payload.phone_number)
    except AuthError as exc:
        _raise_auth_error(exc)
    return {"status": "verification_sent"}


@router.post("/verify-otp")
def verify_otp(
    payload: VerifyOtpRequest,
    response: Response,
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    try:
        user, session_id = auth_service.verify_otp(db, payload.phone_number, payload.code)
    except AuthError as exc:
        _raise_auth_error(exc)

    settings = get_settings()
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_id,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.session_ttl_hours * 3600,
        path="/",
    )
    return {"verified": True, "user_id": user.id, "session_id": session_id}


@router.get("/session")
def get_session(current_user: AppUser | None = Depends(get_current_user_optional)) -> dict:
    if current_user is None:
        return {"is_authenticated": False}
    return {"is_authenticated": True, "user_id": current_user.id, "phone_verified": current_user.phone_verified}


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    settings = get_settings()
    session_id = request.cookies.get(settings.session_cookie_name)
    if session_id:
        auth_service.logout(db, session_id)
    response.delete_cookie(settings.session_cookie_name, path="/")
    return {"status": "logged_out"}
