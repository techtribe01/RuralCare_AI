from __future__ import annotations

from app.models.schemas import RiskLevel


def validate_risk_response(risk_level: RiskLevel | str | None) -> bool:
    if risk_level is None:
        return False
    return str(risk_level).lower() in {"low", "moderate", "high", "emergency"}


def require_human_review(risk_level: RiskLevel | str | None) -> bool:
    if risk_level is None:
        return False
    return str(risk_level).lower() in {"high", "emergency"}
