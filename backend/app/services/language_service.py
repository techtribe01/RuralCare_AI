from __future__ import annotations

import json
import re
from typing import Any

from app.models.schemas import ConversationTurn, LanguageCode, LanguageDetection
from app.services.llm_service import LLMService


class LanguageService:
    def __init__(self, llm_service: LLMService) -> None:
        self.llm_service = llm_service

    @staticmethod
    def _coerce_language(value: LanguageCode | str | None) -> LanguageCode | None:
        if value is None:
            return None
        if isinstance(value, LanguageCode):
            return value
        try:
            return LanguageCode(value)
        except ValueError:
            return None

    def detect(
        self,
        message: str,
        *,
        preferred_language: LanguageCode | str | None = None,
        history: list[ConversationTurn] | None = None,
    ) -> LanguageDetection:
        preferred = self._coerce_language(preferred_language)
        if self.llm_service.available:
            prompt = self._build_prompt(message=message, preferred_language=preferred, history=history)
            try:
                return self.llm_service.generate_structured(
                    LanguageDetection,
                    instructions=(
                        "Detect the user's language. Return only structured output. "
                        "Supported languages: en, te."
                    ),
                    input_text=prompt,
                )
            except Exception:
                pass
        return self._heuristic_detect(message=message, preferred_language=preferred)

    def _heuristic_detect(
        self,
        *,
        message: str,
        preferred_language: LanguageCode | None = None,
    ) -> LanguageDetection:
        if re.search(r"[\u0C00-\u0C7F]", message):
            return LanguageDetection(language=LanguageCode.TE, confidence=0.99)
        if preferred_language is not None:
            return LanguageDetection(language=preferred_language, confidence=0.8)
        return LanguageDetection(language=LanguageCode.EN, confidence=0.92)

    def _build_prompt(
        self,
        *,
        message: str,
        preferred_language: LanguageCode | None,
        history: list[ConversationTurn] | None,
    ) -> str:
        history_payload: list[dict[str, Any]] = []
        for turn in history or []:
            history_payload.append(
                {
                    "role": turn.role.value,
                    "message": turn.message,
                }
            )
        return json.dumps(
            {
                "message": message,
                "preferred_language": preferred_language.value if preferred_language else None,
                "history": history_payload,
            },
            ensure_ascii=False,
        )

