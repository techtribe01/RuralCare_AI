# API Reference

Base URL: `http://localhost:8000`

## Health

`GET /health`

Returns service status without secrets. Optional `?deep=true` probes LLM reachability.

## Chat

`POST /chat`

```json
{
  "session_id": "uuid",
  "message": "I have a fever",
  "language": "en",
  "selected_hospital_id": null,
  "selected_doctor_id": null,
  "selected_slot_id": null,
  "confirm_booking": false
}
```

Response includes `message`, `intent`, `language`, `risk_level`, `sources`, `appointment`, `agent_events`.

## Appointments

Prefix: `/appointments`

| Endpoint | Description |
|----------|-------------|
| `GET /specialties` | All specialties |
| `GET /hospitals?specialty=&location=` | Hospital search |
| `GET /doctors?specialty=&hospital_id=` | Doctor search |
| `GET /slots?doctor_id=` | Available slots only |
| `GET ?user_id=` | List user appointments |
| `POST /book` | Requires `confirmation: true` |
| `POST /{id}/cancel` | Requires `confirmation: true` |
| `POST /{id}/reschedule` | Requires `new_slot_id`, `confirmation: true` |
| `GET /{id}/notifications` | Notification audit trail |

## Voice

`POST /voice/webhook` — Twilio TwiML (speech → LangGraph → TTS)

## SMS

`POST /sms/webhook` — Twilio inbound SMS → LangGraph → plain-text reply

## Error format

```json
{
  "detail": {
    "code": "confirmation_required",
    "message": "Human-readable message"
  }
}
```
