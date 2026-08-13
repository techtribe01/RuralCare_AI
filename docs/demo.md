# Deployment & Demo Guide

## Pre-demo checklist

1. `backend\.venv\Scripts\python.exe scripts\verify_environment.py`
2. `backend\.venv\Scripts\python.exe scripts\verify_connections.py`
3. `backend\.venv\Scripts\python.exe ..\scripts\seed_demo_data.py`
4. Start backend + frontend
5. Run `pytest tests`

## Commands

| Task | Command |
|------|---------|
| Backend | `cd backend && .\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000` |
| Frontend | `cd frontend && npm run dev` |
| Seed data | `backend\.venv\Scripts\python.exe scripts\seed_demo_data.py` |
| Tests | `backend\.venv\Scripts\python.exe -m pytest tests -v` |
| Build | `cd frontend && npm run build` |

## Demo fallback

- **No LLM key:** Offline heuristics (fast, English + Telugu intents)
- **LLM timeout:** Falls back to heuristics after ~15s per call
- **Twilio missing:** Webhooks return unavailable message
- **Notifications:** Demo mode unless Twilio sends outbound SMS

## Showcase script

1. Health: "I have a fever" → sources + moderate risk guidance
2. Booking: "I want a general physician" → complete card flow → YES → confirmed
3. Telugu: "నాకు వైద్యుడిని బుక్ చేయాలి"
4. Safety: "chest pain and cannot breathe" → emergency pathway
5. Agent Console: show live trace from Assistant session

## Known limitations

- RAG uses local index, not live Qdrant writes
- Supabase Postgres optional — SQLite default
- Voice UI placeholder in browser
- NVIDIA NIM latency may trigger heuristic fallback
