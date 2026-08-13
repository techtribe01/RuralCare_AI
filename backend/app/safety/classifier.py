from __future__ import annotations

from app.models.schemas import RiskLevel, SafetyAssessment
from app.safety.protocols import AMBIGUOUS_CONTEXT_HINTS, EMERGENCY_KEYWORDS, HIGH_RISK_KEYWORDS, MODERATE_RISK_KEYWORDS


def classify_risk(message: str, symptoms: list[str] | None = None, context: dict | None = None) -> SafetyAssessment:
    text = " ".join([
        message or "",
        *((symptoms or [])),
        *(context.get("notes", []) if isinstance(context, dict) and isinstance(context.get("notes"), list) else []),
    ]).lower()

    if any(keyword in text for keyword in EMERGENCY_KEYWORDS):
        return SafetyAssessment(
            risk_level=RiskLevel.EMERGENCY,
            reason_code="emergency_keywords_detected",
            requires_escalation=True,
            recommended_action="seek_immediate_urgent_care",
        )

    if any(keyword in text for keyword in HIGH_RISK_KEYWORDS):
        return SafetyAssessment(
            risk_level=RiskLevel.HIGH,
            reason_code="high_risk_symptoms",
            requires_escalation=True,
            recommended_action="seek_urgent_clinical_advice",
        )

    if any(keyword in text for keyword in MODERATE_RISK_KEYWORDS):
        return SafetyAssessment(
            risk_level=RiskLevel.MODERATE,
            reason_code="moderate_symptoms_detected",
            requires_escalation=False,
            recommended_action="gather_more_context_and_guide_care",
        )

    if any(keyword in text for keyword in AMBIGUOUS_CONTEXT_HINTS):
        return SafetyAssessment(
            risk_level=RiskLevel.MODERATE,
            reason_code="insufficient_context",
            requires_escalation=False,
            recommended_action="request_more_detail_before_recommendation",
        )

    return SafetyAssessment(
        risk_level=RiskLevel.LOW,
        reason_code="no_urgent_signals_detected",
        requires_escalation=False,
        recommended_action="provide_general_guidance_with_sources",
    )
