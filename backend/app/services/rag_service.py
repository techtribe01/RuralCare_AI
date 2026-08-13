from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from app.models.schemas import SourceReference
from app.services.qdrant_service import QdrantKnowledgeStore


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9]+", text.lower())


def _hash_vector(tokens: list[str], dimensions: int = 32) -> list[float]:
    vector = [0.0] * dimensions
    counts: dict[str, int] = {}
    for token in tokens:
        counts[token] = counts.get(token, 0) + 1
    for token, count in counts.items():
        index = abs(hash(token)) % dimensions
        vector[index] += float(count)
    norm = sum(value * value for value in vector) ** 0.5 or 1.0
    return [value / norm for value in vector]


class RAGService:
    def __init__(self, store: QdrantKnowledgeStore | None = None) -> None:
        self.store = store or QdrantKnowledgeStore()
        self.store.create_collection_if_needed()
        self._ensure_seed_index()

    def _ensure_seed_index(self) -> None:
        if self.store.get_all():
            return
        raw_dir = Path(__file__).resolve().parents[3] / "data" / "medical" / "raw"
        if raw_dir.exists():
            self.ingest_directory(raw_dir)

    def ingest_directory(self, raw_dir: str | Path) -> int:
        directory = Path(raw_dir)
        if not directory.exists():
            return 0

        inserted = 0
        for file_path in sorted(directory.glob("*.json")):
            payload = json.loads(file_path.read_text(encoding="utf-8"))
            metadata = payload.get("metadata", {})
            document_text = payload.get("text") or payload.get("content") or ""
            if not document_text.strip():
                continue
            chunks = self._chunk_document(document_text, metadata)
            for chunk in chunks:
                document_id = f"{metadata.get('document_id', file_path.stem)}-{chunk['index']}"
                vector = _hash_vector(_tokenize(chunk["text"]))
                self.store.upsert(document_id, chunk["text"], chunk["metadata"], vector)
                inserted += 1
        return inserted

    def _chunk_document(self, text: str, metadata: dict[str, Any]) -> list[dict[str, Any]]:
        sections = [part.strip() for part in re.split(r"\n\s*\n+", text.strip()) if part.strip()]
        chunks: list[dict[str, Any]] = []
        for section_index, section in enumerate(sections):
            words = section.split()
            for chunk_index in range(0, len(words), 180):
                segment = " ".join(words[chunk_index:chunk_index + 180]).strip()
                if not segment:
                    continue
                chunk_metadata = {
                    "source": metadata.get("source", "Approved Demo Clinical Reference"),
                    "title": metadata.get("title", "Health guidance"),
                    "version": metadata.get("version", "demo"),
                    "topic": metadata.get("topic", "general_health"),
                    "language": metadata.get("language", "en"),
                    "region": metadata.get("region", "IN"),
                    "review_status": metadata.get("review_status", "reviewed"),
                    "document_id": metadata.get("document_id", "demo-document"),
                    "section": f"section-{section_index + 1}",
                }
                chunks.append({
                    "index": len(chunks),
                    "text": segment,
                    "metadata": chunk_metadata,
                })
        return chunks

    def should_retrieve(self, intent: str, message: str) -> bool:
        if not message.strip():
            return False
        health_keywords = {"fever", "headache", "cough", "pain", "nausea", "vomiting", "diarrhea", "symptom", "care", "infection", "health"}
        lowered = message.lower()
        if intent in {"health_information", "symptom_guidance"}:
            return True
        return any(keyword in lowered for keyword in health_keywords)

    def retrieve(self, query: str, *, language: str = "en", topic: str | None = None, limit: int = 5) -> list[dict[str, Any]]:
        metadata_filter: dict[str, Any] | None = None
        if topic:
            metadata_filter = {"topic": topic}
        if language:
            metadata_filter = {**(metadata_filter or {}), "language": language}
        vector = _hash_vector(_tokenize(query))
        results = self.store.search(vector, limit=limit, metadata_filter=metadata_filter)
        return results

    def build_sources(self, results: list[dict[str, Any]]) -> list[SourceReference]:
        references: list[SourceReference] = []
        for item in results:
            metadata = item.get("metadata", {})
            references.append(
                SourceReference(
                    document_id=str(metadata.get("document_id", "unknown-document")),
                    title=str(metadata.get("title", "Health guidance")),
                    source=str(metadata.get("source", "Approved Demo Clinical Reference")),
                    version=str(metadata.get("version", "demo")),
                    topic=str(metadata.get("topic", "general_health")),
                    section=str(metadata.get("section", "overview")),
                    relevance=max(0.0, min(1.0, float(item.get("score", 0.0)))),
                )
            )
        return references

    def validate_evidence(self, results: list[dict[str, Any]], *, min_score: float = 0.01) -> list[dict[str, Any]]:
        valid = []
        for item in results:
            score = float(item.get("score", 0.0))
            metadata = item.get("metadata", {})
            # Only clinician-reviewed, approved sources may reach the user. Unreviewed or
            # adversarial/poisoned documents (e.g. injected during retrieval) are treated as
            # untrusted data and are never surfaced, regardless of similarity score.
            if score >= min_score and metadata.get("review_status") == "reviewed":
                valid.append(item)
        return valid

    def build_response(self, query: str, *, language: str = "en", intent: str | None = None) -> dict[str, Any]:
        if not self.should_retrieve(intent or "general_information", query):
            return {"answer": "A general answer is best provided with additional context and source checking.", "sources": [], "evidence": []}

        results = self.retrieve(query, language=language, limit=5)
        valid_results = self.validate_evidence(results)
        if not valid_results:
            return {"answer": "I could not find sufficiently relevant approved guidance for this question right now.", "sources": [], "evidence": []}

        evidence = valid_results[:3]
        sources = self.build_sources(evidence)
        excerpt = " ".join(item.get("text", "") for item in evidence)
        answer = (
            "Based on approved health guidance, the most relevant information suggests a careful review of symptoms and next steps. "
            f"Use the retrieved guidance to focus on: {excerpt[:500]}"
        )
        return {"answer": answer, "sources": sources, "evidence": evidence}
