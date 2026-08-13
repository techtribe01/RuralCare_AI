# Architecture

## Overview

```
User (Chat / Voice / SMS)
        ↓
   Frontend (React)  or  Twilio Webhooks
        ↓
   FastAPI (routes)
        ↓
   LangGraph (AgentGraphFactory)
        ↓
   ┌─────────────┬──────────────┬─────────────────┐
   │     RAG     │    Safety    │ Care Navigation │
   │  (local +   │  classifier  │ AppointmentFlow │
   │   Qdrant)   │  escalation  │     Engine      │
   └─────────────┴──────────────┴─────────────────┘
        ↓
   SQLite / PostgreSQL
```

## Principles

- **Single agent:** One LangGraph workflow for chat, voice, and SMS
- **API-first:** LangGraph → tools → services → repositories → database
- **Safety outside LLM:** Risk classification is deterministic
- **Confirmation gate:** Bookings require explicit user confirmation server-side
- **Provider-independent LLM:** `LLMService` abstracts NVIDIA NIM / OpenAI-compatible APIs

## Key modules

| Module | Role |
|--------|------|
| `app/services/agent_graph.py` | LangGraph nodes and routing |
| `app/services/agent_service.py` | Session + graph invocation |
| `app/services/llm_service.py` | LLM + structured output + offline fallback |
| `app/services/rag_service.py` | Retrieval + evidence validation |
| `app/safety/classifier.py` | Risk levels LOW/MODERATE/HIGH/EMERGENCY |
| `app/services/appointment_flow.py` | Multi-turn appointment state machine |
| `app/services/appointment_tools.py` | Agent tool layer over services |

## Database

- Default: `data/care_navigation/ruralcare_demo.db` (SQLite)
- Optional: PostgreSQL via `DATABASE_URL` (Supabase Postgres connection string)
- Demo data seeded only via `scripts/seed_demo_data.py`

## Frontend

- Shared user/session ID across Assistant, Appointments, Activity
- Agent trace visible in Assistant sidebar and Agent Console
- Appointment cards driven by structured `appointment` payload from `/chat`
