# Safety

## Risk classifier

Deterministic keyword/symptom analysis in `app/safety/classifier.py`:

| Level | Action |
|-------|--------|
| EMERGENCY | Interrupt → urgent care message |
| HIGH | Human escalation pathway |
| MODERATE | Gather more context |
| LOW | General guidance with sources |

## Rules

- The LLM is **not** a doctor
- No autonomous diagnosis
- No fabricated emergency protocols
- Escalation state is set by application code, not retrieved documents

## Prompt injection

`tests/test_security.py` verifies poisoned RAG documents cannot fabricate booking IDs or change safety routing.

## User-facing copy

Emergency and escalation responses are templated in `agent_graph.py` with English and Telugu variants.
