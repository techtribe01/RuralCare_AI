# Agent Workflow

## LangGraph nodes

1. `input_normalizer`
2. `language_detection`
3. `intent_classifier`
4. `safety_assessment` → conditional route
5. Branch A: `appointment_orchestrator` (booking intents)
6. Branch B: `symptom_extraction` → `retrieval_decision` → `retrieval` → `evidence_validation`
7. Branch C: `emergency` / `human_escalation`
8. `response_generator`

## Conditional routing after safety

| Condition | Route |
|-----------|-------|
| EMERGENCY risk | `emergency` |
| HIGH risk | `human_escalation` |
| Appointment intent or active appointment step | `appointment_orchestrator` |
| Otherwise | `symptom_extraction` → RAG path |

## Appointment flow steps

`collect_specialty` → `select_hospital` (optional) → `select_doctor` → `select_slot` → `await_confirmation` → booking tool

Booking only executes after explicit YES / `confirm_booking: true`.

## Offline fallback

When `OPENAI_API_KEY` is absent or LLM requests fail/timeout, language and intent use deterministic heuristics supporting English and Telugu.

## Trace events

Real events are appended to `agent_events` in the API response — never fabricated in the frontend.
