# Voice & SMS

## Voice (Twilio)

`POST /voice/webhook`

- Speech-to-text via Twilio `Gather`
- Same LangGraph agent as chat
- Text-to-speech via Twilio `Say` (Polly.Aditi)
- Fallback message when agent unavailable

## SMS (Twilio)

`POST /sms/webhook`

- Session ID: `sms:{phone_number}`
- Appointment payloads rendered as numbered plain-text choices
- Same agent, no separate SMS workflow

## Configuration

Requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.

When not configured, webhooks still return safe fallback messages (demo mode).

## Frontend VoiceControl

The in-app `VoiceControl` component is a UI placeholder. Live voice uses Twilio phone webhooks.
