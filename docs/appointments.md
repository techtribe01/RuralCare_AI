# Appointments

## Demo data

All entities are fictional and marked `is_demo_data: true`. Seeded via:

```powershell
backend\.venv\Scripts\python.exe scripts\seed_demo_data.py
```

## Booking safety

```
User request → search → select → confirmation → server validation → DB transaction → notification
```

- `confirmation: true` required on book/cancel/reschedule
- Double booking prevented server-side (`slot_unavailable` 409)
- LLM never writes to database directly

## Channels

Same `AppointmentFlowEngine` for chat, voice, and SMS. Channel stored on appointment record for notifications.

## Frontend

- **Appointments page:** Direct API wizard
- **Assistant:** Structured appointment cards from agent payload
- **Activity:** Shared session ID lists booked appointments
