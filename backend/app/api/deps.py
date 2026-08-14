from __future__ import annotations

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config.settings import get_settings
from app.db.models import AppUser
from app.db.session import get_db
from app.services.auth_service import AuthService, get_auth_service


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> AppUser | None:
    session_id = request.cookies.get(get_settings().session_cookie_name)
    if not session_id:
        return None
    return auth_service.get_user_for_session(db, session_id)


def get_current_user(current_user: AppUser | None = Depends(get_current_user_optional)) -> AppUser:
    if current_user is None:
        raise HTTPException(
            status_code=401,
            detail={"code": "unauthenticated", "message": "Please verify your mobile number to continue."},
        )
    return current_user
