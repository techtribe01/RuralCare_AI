from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any


class QdrantKnowledgeStore:
    def __init__(self, collection_name: str = "ruralcare_medical_demo", persist_path: str | None = None) -> None:
        self.collection_name = collection_name
        root = Path(__file__).resolve().parents[3]
        self.persist_path = Path(persist_path) if persist_path else root / "data" / "medical" / "processed" / "vector_index.json"
        self.persist_path.parent.mkdir(parents=True, exist_ok=True)
        self.documents: list[dict[str, Any]] = self._load_from_disk()

    def create_collection_if_needed(self) -> bool:
        if not self.persist_path.exists():
            self.persist_path.parent.mkdir(parents=True, exist_ok=True)
            self.documents = []
            self._save_to_disk()
        return True

    def upsert(self, document_id: str, text: str, metadata: dict[str, Any], vector: list[float]) -> dict[str, Any]:
        entry = {
            "id": document_id,
            "text": text,
            "metadata": metadata,
            "vector": vector,
        }
        existing = next((item for item in self.documents if item["id"] == document_id), None)
        if existing is not None:
            self.documents = [item for item in self.documents if item["id"] != document_id]
        self.documents.append(entry)
        self._save_to_disk()
        return entry

    def search(self, query_vector: list[float], *, limit: int = 5, metadata_filter: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        filtered = []
        for item in self.documents:
            metadata = item.get("metadata", {})
            if metadata_filter and not all(metadata.get(key) == value for key, value in metadata_filter.items()):
                continue
            similarity = self._cosine_similarity(query_vector, item.get("vector", []))
            filtered.append({**item, "score": similarity})
        filtered.sort(key=lambda item: item["score"], reverse=True)
        return filtered[:limit]

    def get_all(self) -> list[dict[str, Any]]:
        return list(self.documents)

    def _load_from_disk(self) -> list[dict[str, Any]]:
        if not self.persist_path.exists():
            return []
        try:
            data = json.loads(self.persist_path.read_text(encoding="utf-8"))
            return data if isinstance(data, list) else []
        except (json.JSONDecodeError, OSError):
            return []

    def _save_to_disk(self) -> None:
        self.persist_path.write_text(json.dumps(self.documents, ensure_ascii=False, indent=2), encoding="utf-8")

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        if not a or not b:
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))
        if not norm_a or not norm_b:
            return 0.0
        return dot / (norm_a * norm_b)
