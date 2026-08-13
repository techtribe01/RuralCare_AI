# RAG

## Pipeline

```
data/medical/raw/*.json
        ↓
scripts/ingest_medical_data.py (optional)
        ↓
RAGService.ingest_directory()
        ↓
Chunking (~180 words)
        ↓
Hash-based embeddings
        ↓
data/medical/processed/vector_index.json
        ↓
Cosine similarity search
        ↓
Evidence validation (min score)
        ↓
SourceReference in response
```

## Qdrant Cloud

`QDRANT_URL` and `QDRANT_API_KEY` may be configured and verified reachable, but the application RAG layer currently uses the **local vector index file** via `QdrantKnowledgeStore`. Cloud Qdrant integration is a future enhancement.

## Source metadata

Each chunk includes: `source`, `title`, `version`, `topic`, `language`, `region`, `review_status`, `document_id`, `section`.

## Security

Retrieved content is untrusted data — it cannot override system instructions or auto-confirm bookings. See `tests/test_security.py`.
