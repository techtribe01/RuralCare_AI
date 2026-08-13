from __future__ import annotations

from app.models.schemas import RiskLevel


def build_escalation_record(risk_level: RiskLevel | str, reason_code: str, language: str = "en") -> dict:
    normalized = str(risk_level).lower()
    if normalized == RiskLevel.EMERGENCY.value:
        message = "urgent medical assistance recommended"
    elif normalized == RiskLevel.HIGH.value:
        message = "human review requested by safety policy"
    else:
        message = "monitoring and follow-up guidance"

    return {
        "risk_level": normalized,
        "reason_code": reason_code,
        "status": "pending",
        "message": message,
        "language": language,
        "human_review_required": normalized in {RiskLevel.HIGH.value, RiskLevel.EMERGENCY.value},
    }
