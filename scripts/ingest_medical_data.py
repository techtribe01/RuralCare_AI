from __future__ import annotations

from pathlib import Path

from app.services.rag_service import RAGService


def main() -> None:
    service = RAGService()
    raw_dir = Path(__file__).resolve().parents[1] / "data" / "medical" / "raw"
    count = service.ingest_directory(raw_dir)
    print(f"Ingested {count} medical chunks into the local demo vector store.")


if __name__ == "__main__":
    main()
