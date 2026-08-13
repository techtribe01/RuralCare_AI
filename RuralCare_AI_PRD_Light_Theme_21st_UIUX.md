# RuralCare AI — Product Requirements Document

## Multilingual Agentic Healthcare & Care-Navigation Assistant

**Version:** 2.0 — UX-first showcase PRD  
**Product:** RuralCare AI  
**Primary objective:** Accessible health information + care navigation + appointment orchestration  
**Primary channels:** Web chat, voice call, SMS; WhatsApp optional  
**Design priority:** User experience first; rigid, reusable, high-quality UI components  
**Visual direction:** Light, editorial, clinical-tech, calm, premium; 21st.dev/shadcn-inspired  
**Prototype target:** A polished, demonstrable 24-hour MVP with a clear production path

---

## 1. Executive Summary

RuralCare AI is a multilingual agentic healthcare assistant designed for rural and low-resource communities. It provides conversational health information from a controlled evidence base, gathers structured symptom context, guides users toward appropriate care, helps find doctors and appointment slots, and supports voice and SMS access.

LangGraph orchestrates the stateful workflow, Agentic RAG provides grounded information, and deterministic application services validate safety-sensitive decisions and tool execution.

For the institute showcase, the product is explicitly a working prototype rather than a production medical device. It must demonstrate real agent routing, real retrieval, real tool execution, multilingual interaction, and visible safety controls. It must not claim to diagnose disease or replace clinicians.

The showcase experience must communicate the sophistication of the system without making the interface complicated. The core design objective is a calm, premium, highly legible product that works for a first-time smartphone user while also exposing an advanced agent trace for evaluators.

---

# 2. Product Vision

> **“Healthcare guidance that speaks your language, meets you on your channel, and helps you take the next safe step.”**

### Vision goals

- Make access to reliable health information simpler for users with limited time, connectivity, literacy, or healthcare access.
- Use AI for orchestration and accessibility while preserving human oversight for safety-critical situations.
- Turn a fragmented healthcare journey into one continuous conversation: **understand → guide → navigate → confirm → follow up.**

---

# 3. Product Principles

| Principle | Product implication |
|---|---|
| UX before AI spectacle | Every feature must reduce user effort; do not expose complexity unless it helps. |
| Progressive disclosure | Show simple guidance first; reveal sources, agent state, and technical detail on demand. |
| User control | Never silently book, escalate, or take an irreversible action. |
| Evidence over confidence | Prefer sourced, bounded responses over fluent speculation. |
| Calm under stress | Emergency/high-risk states use clear hierarchy, minimal copy, and unmistakable next actions. |
| Multilingual by architecture | Language is a first-class session property, not a final translation step. |
| Accessible by default | Large touch targets, readable typography, keyboard support, high contrast, voice-first options. |
| Rigid where consistency matters | Use a small, governed component vocabulary rather than one-off UI. |
| Observable agent | Evaluators can inspect what the agent retrieved, which route it took, and which tool it called. |

---

# 4. Problem Statement

People in rural and low-resource communities may face:

- distance from healthcare services
- language barriers
- inconsistent connectivity
- difficulty navigating doctors and hospitals
- limited digital literacy
- difficulty obtaining immediate, understandable health information

A conventional chatbot can answer questions but does not necessarily retrieve evidence, manage state, execute healthcare tools, or route high-risk situations safely.

RuralCare AI therefore combines:

- conversational AI
- Agentic RAG
- stateful workflow orchestration
- multilingual interaction
- healthcare navigation
- appointment tooling
- voice
- SMS
- human escalation

---

# 5. Target Users

| User | Context | Primary need | Preferred experience |
|---|---|---|---|
| Rural resident | Limited access / local language | Quick guidance and next step | Voice / simple chat |
| Caregiver | Helping a parent, child, or family member | Understand options and arrange care | Chat / voice |
| Low-literacy user | Text is difficult | Speak naturally and hear the answer | Voice |
| Low-bandwidth user | Intermittent data | Complete short interactions | SMS |
| Patient seeking consultation | Knows they need a clinician | Find suitable doctor and time | Chat / voice |
| Evaluator | Project showcase | Understand technical innovation | Web dashboard with agent trace |

---

# 6. Goals

## 6.1 Product goals

- Provide grounded, understandable general health information from an approved knowledge base.
- Collect relevant symptom information through structured conversation.
- Route conversations using explicit LangGraph states and conditional edges.
- Search doctors/hospitals and book appointments only after user confirmation.
- Support at least English plus one Indian language for the MVP.
- Demonstrate voice and SMS channels in the showcase.
- Make agent activity visible through a live workflow/trace panel.
- Provide an auditable source trail for RAG responses.

## 6.2 Non-goals / safety boundaries

- No autonomous diagnosis claims.
- No autonomous clinician replacement.
- No unrestricted medication prescribing.
- No autonomous emergency dispatch decisions generated solely by an LLM.
- No real hospital/EHR integration required for the 24-hour showcase.
- No storage of unnecessary sensitive health information.
- No production clinical deployment claim from the showcase prototype.

---

# 7. Primary User Journeys

## 7.1 Health Guidance Journey

**Landing → Choose language → Choose chat/voice → Describe concern → Focused follow-up questions → Safety check → Evidence retrieval → Concise guidance → Clear next-step card → Optional doctor search**

## 7.2 Appointment Journey

**User asks to see a doctor → Identify specialty/need → Show doctor cards → Show available slots → User selects → Confirmation sheet → Explicit confirmation → Booking tool → Confirmation card → Optional SMS**

## 7.3 Emergency Journey

**Potential high-risk signal → Interrupt normal flow → Show calm urgent-action panel → Configured local emergency/urgent-care instruction → Human escalation option → Log event**

## 7.4 SMS Journey

**Inbound SMS → Identify/resume session → Ask one concise question at a time → Store state → Respond → Offer next action**

## 7.5 Multilingual Journey

**Language selection/detection → Persistent language state → Internal agent workflow → Localized response → Voice output in supported language**

---

# 8. Core Use Cases

## UC-01 — Symptom Guidance

1. User describes symptoms in text or voice.
2. System detects language and intent.
3. Agent extracts structured symptom information.
4. Agent asks focused follow-up questions.
5. Safety layer checks the conversation against clinician-reviewed/demo protocols.
6. RAG retrieves approved evidence.
7. Response generator produces a cautious, understandable answer.
8. Response is translated/spoken back in the user's selected language.

## UC-02 — Appointment Booking

1. User requests a doctor/department.
2. Appointment agent searches hospital and doctor records.
3. Agent checks available slots.
4. System displays the proposed appointment.
5. User explicitly confirms.
6. Booking tool executes.
7. System returns a booking ID.
8. Confirmation is sent through the active channel.

## UC-03 — Emergency / High-Risk Escalation

1. System detects a possible emergency trigger according to configured, clinician-reviewed rules.
2. Normal conversational flow is interrupted.
3. User receives configured urgent/emergency instructions.
4. Conversation can be escalated to a human workflow.
5. System records the escalation event for audit purposes.

## UC-04 — Multilingual Conversation

1. User speaks or types in English or an initial supported Indian language.
2. Language is detected and retained in session state.
3. Internal agent state remains language-independent.
4. Final response is generated/translated into the user's selected language.
5. Voice output uses the selected language when supported.

## UC-05 — Low-Bandwidth SMS

1. User sends an SMS such as `FEVER`.
2. Webhook creates/resumes a conversation thread.
3. Agent asks short structured questions.
4. Agent provides concise next-step guidance or appointment navigation.
5. Conversation state is persisted between messages.

---

# 9. Functional Requirements

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-01 | Chat interface | P0 | User can send/receive messages and see conversation state. |
| FR-02 | Language detection | P0 | Supported language is identified and persisted. |
| FR-03 | Intent routing | P0 | Health, appointment, emergency, and general intents route to different graph paths. |
| FR-04 | Agentic RAG | P0 | Response uses retrieved approved documents with source metadata. |
| FR-05 | Safety layer | P0 | High-risk path bypasses normal response flow and triggers escalation behavior. |
| FR-06 | Doctor search | P0 | Agent can call a doctor-search tool with structured inputs. |
| FR-07 | Slot search | P0 | Agent can retrieve available slots from a database/API. |
| FR-08 | Booking confirmation | P0 | Booking cannot execute until user confirms the proposed slot. |
| FR-09 | Appointment tool | P0 | Booking creates a unique appointment/booking ID. |
| FR-10 | Voice | P1 | A test call can complete a basic question→response flow. |
| FR-11 | SMS | P1 | Inbound SMS resumes a conversation and returns a response. |
| FR-12 | Multilingual output | P1 | At least English + one Indian language works end-to-end. |
| FR-13 | Agent trace | P1 | UI shows nodes such as language, intent, safety, RAG, and tools. |
| FR-14 | Human escalation | P1 | Agent can pause/route a conversation to a human-review state. |

---

# 10. Information Architecture

| Primary area | Purpose | Key content |
|---|---|---|
| Home | Explain value and start interaction | Hero, channel selector, language, trust statement, CTA |
| Assistant | Main user task | Conversation, voice control, suggested actions, sources |
| Appointments | Care navigation | Hospitals, doctors, slots, confirmation |
| Activity | User-visible history | Recent conversations, appointments, escalations |
| Help & Safety | Set expectations | What AI can/cannot do, emergency guidance |
| Agent Console | Evaluator-facing | Graph state, sources, tool calls, latency, events |

---

# 11. UX Architecture

The interface has two layers:

### Patient-facing experience

Optimized for:

- clarity
- reassurance
- simplicity
- accessibility
- low cognitive load

### Evaluator / operations experience

Optimized for:

- transparency
- agent traceability
- source visibility
- tool visibility
- performance inspection

### UX rule

> If a technical detail does not help a patient make a better decision, keep it behind progressive disclosure. If it helps a judge understand the innovation, expose it in the Agent Console.

---

# 12. 21st.dev / shadcn-Inspired UI Direction

Use **21st.dev** as a component and interaction reference, with **shadcn-style source ownership and tokenized theming** as the implementation philosophy.

The design should not be a visual copy of another product.

Components should be:

- locally maintainable
- accessible
- responsive
- governed by design tokens
- consistent across the product
- available in predictable states

### Visual style

The light theme should feel:

- premium
- clinical-tech
- calm
- trustworthy
- modern
- highly legible

Avoid turning the experience into a sterile hospital dashboard.

Recommended visual direction:

- warm off-white canvas
- cool slate typography
- single confident blue/cyan accent
- restrained green for success
- amber for caution
- red only for critical states
- subtle borders
- restrained shadows
- limited radii

Reference: [21st.dev](https://21st.dev/)

---

# 13. Design Tokens

| Token | Value | Use |
|---|---|---|
| Canvas | `#F8FAFC` | Application background |
| Surface | `#FFFFFF` | Cards, panels, dialogs |
| Surface muted | `#F1F5F9` | Secondary panels / input areas |
| Border | `#E2E8F0` | Default component boundary |
| Border strong | `#CBD5E1` | Focused / selected boundary |
| Text primary | `#0F172A` | Headings and key information |
| Text secondary | `#475569` | Body copy |
| Text muted | `#64748B` | Metadata / hints |
| Brand | `#0284C7` | Primary action / links / active agent |
| Brand soft | `#E0F2FE` | Selected backgrounds |
| Success | `#16A34A` | Completed / healthy state |
| Warning | `#D97706` | Caution / attention |
| Critical | `#DC2626` | Emergency only |
| Radius | `8px` default / `12px` large | Rigid geometry |
| Spacing | `8px` base scale | `8 / 16 / 24 / 32 / 40 / 48` |
| Shadow | Low elevation only | Dialog / floating controls |

---

# 14. Rigid Component System

A rigid system means the product is predictable.

Components have:

- defined anatomy
- limited variants
- fixed spacing rules
- complete interaction states
- consistent accessibility behavior

| Component | Variants | Required states | UX rule |
|---|---|---|---|
| Button | Primary / Secondary / Ghost / Destructive | Default / hover / focus / loading / disabled | One primary action per region |
| Card | Default / Interactive / Status | Default / hover / selected / disabled | Same padding and border rhythm |
| Input | Text / Search / OTP / Message | Default / focus / error / success / disabled | Never hide validation feedback |
| Chat Bubble | User / Assistant / System | Sending / streaming / complete / error | Readable max-width |
| Agent Step | Pending / Active / Complete / Blocked | All four | Active state should be clear |
| Source Card | Compact / Expanded | Loading / available / error | Source title always visible |
| Doctor Card | Compact / Detailed | Available / unavailable / selected | Availability explicit |
| Slot | Available / Selected / Disabled | Default / selected / disabled | Touch target ≥ 44px |
| Dialog | Confirm / Warning / Emergency | Open / loading / success / error | No accidental irreversible action |
| Toast | Success / Info / Warning / Error | Enter / visible / dismiss | Do not replace inline errors |
| Voice Control | Idle / Listening / Processing / Speaking | All four | State understandable without text |
| Risk Banner | Low / Moderate / High / Emergency | Default / acknowledged | Icon + label + action |

---

# 15. Required UI Components

## Layout

- AppShell
- Sidebar
- TopBar
- PageContainer
- PageHeader

## Navigation

- NavigationItem
- Breadcrumbs

## Base UI

- Button
- Card
- Badge
- Input
- Textarea
- Dialog
- Tooltip
- Tabs
- Select
- Skeleton
- Alert
- Toast

## Assistant

- ConversationPanel
- MessageBubble
- MessageComposer
- VoiceControl
- SuggestedAction

## Appointments

- DoctorCard
- AppointmentCard
- SlotCard

## Agent

- AgentTrace
- AgentStep
- SourceCard
- ToolActivity

---

# 16. Component State Requirements

Every interactive component must have the structural ability to support:

- Default
- Hover
- Focus
- Active
- Disabled
- Loading
- Error
- Success

Do not implement complicated business logic in the component layer during Stage 1.

---

# 17. Core Screens

## Screen 01 — Landing

Required elements:

- Hero explaining the benefit
- Primary CTA: `Start a conversation`
- Secondary CTA: `Book a doctor`
- Channel selector: Chat / Voice / SMS
- Language selector
- Trust row:
  - AI assistant
  - Evidence-grounded
  - Human escalation available

Avoid:

- long paragraphs
- autoplay video
- distracting carousels
- unnecessary animation

## Screen 02 — Assistant Workspace

- Three-zone desktop layout
- Conversation center
- Context/actions right
- Optional collapsible agent trace
- Text input
- Microphone
- Send action
- Suggested actions
- Structured assistant cards

On mobile:

- conversation first
- sources and trace become sheets/drawers

## Screen 03 — Agent Trace

Vertical timeline:

```text
Input
  ↓
Language
  ↓
Intent
  ↓
Safety
  ↓
Retrieval
  ↓
Tool
  ↓
Response
```

Each step shows:

- status
- duration
- short explanation

## Screen 04 — RAG Evidence Drawer

Show:

- source name
- document title
- version/date where available
- topic
- relevance
- supporting passage/metadata

Never display a fabricated source.

## Screen 05 — Appointment Flow

Step indicator:

```text
Need → Doctor → Time → Confirmed
```

Doctor cards should prioritize:

- specialty
- location
- availability
- next available slot

Slot picker should support:

- date
- time
- selected
- disabled
- loading

Confirmation sheet must summarize:

- doctor
- hospital
- date
- time
- user identity

## Screen 06 — Emergency / High-Risk State

- Remove decoration
- Minimize copy
- Strong hierarchy
- Clear urgent action
- Human escalation option
- Technical source details behind progressive disclosure

Do not bury urgent guidance.

## Screen 07 — Voice Experience

States:

- Idle
- Listening
- Processing
- Speaking

Controls:

- microphone
- mute
- end
- transcript/fallback

## Screen 08 — SMS Experience

- Short messages
- One decision/question at a time
- Numbered options where useful
- Persistent session state
- Simple escape path such as `HELP` or `HUMAN` according to deployment design

---

# 18. Responsive Design

| Breakpoint | Layout | Behavior |
|---|---|---|
| Desktop `≥1280px` | 3-zone workspace | Conversation + inspector + optional trace |
| Tablet `768–1279px` | 2-zone | Conversation + collapsible inspector |
| Mobile `<768px` | 1-zone | Conversation first; actions/sources/trace as sheets |
| Voice-only | Minimal visual | Large state indicator + transcript + essential action |

Do not create a separate mobile application.

---

# 19. Accessibility Requirements

- WCAG-oriented contrast and focus states.
- Keyboard navigation.
- Minimum `44 × 44px` interactive targets.
- No information communicated only through color.
- Readable body text and line height.
- Voice workflow must have a text alternative.
- Semantic labels for buttons, status, dialogs, and agent steps.
- Errors must state what happened and what the user can do next.

---

# 20. Technical Architecture

```text
Chat / Voice / SMS / WhatsApp
            ↓
         FastAPI
            ↓
    Session / Identity
            ↓
       LangGraph
            ↓
  ┌─────────┼─────────┐
  ↓         ↓         ↓
Health   Appointment  Emergency
Flow       Flow        Flow
  ↓         ↓         ↓
RAG      Tools      Safety
  └─────────┼─────────┘
            ↓
     Evidence / Safety
        Validation
            ↓
   Response / Translation
            ↓
       Channel Adapter
```

---

# 21. Technology Stack

| Layer | Recommended technology | Responsibility |
|---|---|---|
| Frontend | React + Vite + TypeScript | Patient UX + showcase console |
| UI system | Tailwind CSS + shadcn/ui + 21st.dev references | Rigid, accessible components |
| Backend | FastAPI + Pydantic | REST APIs and webhooks |
| Agent | LangGraph | Stateful orchestration and routing |
| LLM | OpenAI API | Structured extraction and response generation |
| RAG | Qdrant + embeddings + optional reranker | Evidence retrieval |
| Safety | Python rules + clinician-reviewed protocols | Risk routing and escalation |
| Database | PostgreSQL | Sessions, doctors, hospitals, appointments |
| Voice/SMS | Twilio | Communication channels |
| Tracing | LangSmith | Execution traces and evaluation |
| Testing | pytest | Unit/integration/evaluation tests |
| Deployment | Vercel + Render/Railway/Cloud Run | Showcase deployment |

---

# 22. LangGraph Workflow

The graph should be:

- explicit
- inspectable
- stateful
- modular
- safety-aware

### Main flow

```text
START
  ↓
Input Normalizer
  ↓
Language Detection
  ↓
Intent Router
  ↓
┌───────────────┬────────────────┬─────────────────┐
│               │                │
Health       Appointment     Emergency
Flow            Flow            Flow
│               │                │
▼               ▼                ▼
Symptoms      Doctor Search   Safety Protocol
│               │                │
▼               ▼                ▼
Safety        Slot Search     Escalation
│               │
▼               ▼
RAG          Confirmation
│               │
└───────┬───────┘
        ↓
Response
        ↓
Translation / TTS
        ↓
END
```

### Appointment branch

```text
Need identification
    ↓
Doctor Search
    ↓
Slot Search
    ↓
User Confirmation
    ↓
Booking Tool
    ↓
Notification
```

### Emergency branch

```text
Signal extraction
    ↓
Clinician-reviewed protocol
    ↓
Interrupt / escalation
    ↓
Configured next-step guidance
```

---

# 23. Agent State Model

Recommended fields:

```text
user_id
session_id
channel
language
user_message
intent
symptoms
duration
severity
risk_level
retrieved_context
selected_doctor
selected_slot
booking_confirmed
human_escalation_required
response
```

Language must persist throughout a session.

Booking confirmation must be explicit.

---

# 24. Agent Tools

| Tool | Input | Output | Control |
|---|---|---|---|
| search_hospitals | location, specialty/capability | hospital list | Validated query |
| search_doctors | hospital, specialty, location | doctor list | Read-only |
| check_slots | doctor_id, date_range | available slots | Read-only |
| book_appointment | user_id, slot_id, confirmation | booking ID | Explicit confirmation |
| cancel_appointment | appointment_id, confirmation | status | Explicit confirmation |
| send_notification | channel, recipient, message | delivery status | Template/permission validation |
| human_escalation | session_id, reason | handoff ID | High-risk / human workflow |

---

# 25. Data Model

## User

```text
id
display_name
language
channel_preferences
consent_status
```

## Session

```text
id
user_id
channel
created_at
last_active_at
```

## Message

```text
id
session_id
role
content
timestamp
```

## SymptomSession

```text
id
session_id
structured_symptoms
duration
severity
risk_level
```

## SourceDocument

```text
id
title
source
version
topic
language
review_status
```

## Doctor

```text
id
name
specialty
hospital_id
location
```

## Hospital

```text
id
name
location
contact
capabilities
```

## AppointmentSlot

```text
id
doctor_id
start
end
status
```

## Appointment

```text
id
user_id
doctor_id
slot_id
status
confirmation_id
```

## AgentEvent

```text
id
session_id
node
status
duration_ms
metadata
```

---

# 26. RAG Requirements

## Retrieval pipeline

```text
Medical Documents
      ↓
Cleaning
      ↓
Chunking
      ↓
Embeddings
      ↓
Qdrant
      ↓
Retriever
      ↓
Optional Reranker
      ↓
Evidence Validation
      ↓
Response Generation
```

Requirements:

- Use approved/authoritative medical sources.
- Version the corpus.
- Attach source metadata to every chunk.
- Track review status and content owner.
- Do not silently rely on random web pages as medical truth.
- Clearly mark showcase/mock data.
- Do not fabricate citations.
- Responses should stay within retrieved evidence where applicable.

---

# 27. Healthcare Safety Requirements

> **The LLM is an assistant inside a governed workflow, not an autonomous clinician.**

Requirements:

- Safety-critical routing must not rely solely on free-form LLM reasoning.
- Emergency and escalation criteria must be clinician-reviewed before real-world deployment.
- All tool calls must be validated by application code.
- Appointment booking requires explicit user confirmation.
- The system must communicate uncertainty appropriately.
- Audit logs should capture graph path, retrieval sources, tool calls, and escalation events.
- The UI must clearly identify the system as an AI assistant.
- Real deployment requires clinical governance, privacy/security work, professional oversight, and applicable regulatory review.

---

# 28. UI / UX Quality Bar

The product should **not** look like:

- a generic Tailwind starter
- a ChatGPT clone
- a random dashboard
- a collection of unrelated pages
- an overly rounded consumer app
- a decorative AI landing page

It should look:

- premium
- calm
- clinical-tech
- structured
- trustworthy
- highly legible
- deliberate
- production-inspired

### Visual rules

- One visual language.
- One spacing system.
- One typography system.
- Controlled colors.
- Controlled component variants.
- Predictable interaction states.
- Responsive behavior defined centrally.
- Progressive disclosure for technical complexity.

---

# 29. Showcase Screens

| Screen | Purpose |
|---|---|
| 01 — Landing / Overview | Explain rural healthcare problem and product value |
| 02 — Live Assistant | Main chat/voice experience |
| 03 — Agent Trace | Show LangGraph routing and state |
| 04 — RAG Evidence | Show retrieved sources and metadata |
| 05 — Appointment | Show doctors, slots, confirmation, booking |
| 06 — Emergency | Show safety interruption and escalation |
| 07 — Multilingual | Show language switch and localized response |
| 08 — System Metrics | Show latency, tool calls, retrieval count, test status |

---

# 30. Observability & Evaluation

The system must be traceable.

For every important interaction, capture:

```text
User input
   ↓
Language detection
   ↓
Intent
   ↓
Graph route
   ↓
Retrieved sources
   ↓
Tool calls
   ↓
Safety state
   ↓
Final response
```

Evaluate:

- intent accuracy
- retrieval quality
- source correctness
- tool-call accuracy
- appointment accuracy
- safety routing
- multilingual accuracy
- latency
- hallucination rate
- escalation correctness

Build evaluation datasets covering:

- health questions
- symptom cases
- appointment flows
- emergency scenarios
- multilingual inputs
- ambiguous inputs
- adversarial/prompt-injection cases

---

# 31. Security & Privacy

- Never hard-code API keys or secrets.
- Validate every server-side tool request.
- Authenticate protected APIs.
- Minimize health-data collection.
- Encrypt data in transit and at rest in real deployment.
- Separate demo/mock data from real patient data.
- Log only what is necessary for audit.
- Use environment variables and secure secret management.

---

# 32. 24-Hour Showcase Scope

| Time | Build focus | Definition of done |
|---|---|---|
| 0–2 h | Repo + design tokens + FastAPI | App shell and `/chat` endpoint |
| 2–5 h | LangGraph | Working state, routing, trace |
| 5–8 h | RAG | Curated corpus + Qdrant retrieval + source cards |
| 8–10 h | Safety | Controlled routing + escalation UI |
| 10–13 h | Appointments | Doctor/slot/book tools + confirmation |
| 13–16 h | UX build | Polished responsive light dashboard |
| 16–18 h | Voice | One end-to-end voice demo |
| 18–20 h | SMS | One end-to-end SMS demo |
| 20–21 h | Language | English + one Indian language |
| 21–23 h | Evaluation | Rehearsed scenarios + fallback mode |
| 23–24 h | Polish | Presentation, architecture, backup demo |

---

# 33. Showcase Demo Script

## Demo 01 — Voice

```text
Speak in local language
        ↓
Speech-to-text
        ↓
LangGraph
        ↓
Safety
        ↓
RAG
        ↓
Local-language response
```

**Wow moment:** The same agent works without typing.

## Demo 02 — RAG

```text
Question
   ↓
Retrieval
   ↓
Source cards
   ↓
Grounded response
```

**Wow moment:** Evidence is visible.

## Demo 03 — Appointment

```text
Need
 ↓
Doctor
 ↓
Slot
 ↓
Confirmation
 ↓
Booking
 ↓
Notification
```

**Wow moment:** Agent executes a real tool workflow.

## Demo 04 — Safety

```text
High-risk scenario
       ↓
Normal flow interrupted
       ↓
Escalation
```

**Wow moment:** Safety controls the agent.

## Demo 05 — Multilingual

```text
Language switch
      ↓
Same agent state
      ↓
Localized response
```

**Wow moment:** Language is part of the system state.

---

# 34. Success Metrics

| Metric | Showcase target |
|---|---:|
| Core scenario success | ≥ 95% across rehearsed flows |
| Appointment safety | 100% of bookings require explicit confirmation |
| RAG provenance | 100% of RAG demo answers expose actual retrieved source metadata |
| Emergency routing | 100% of curated high-risk test cases route to the configured escalation path |
| Multilingual | 2 languages complete one end-to-end scenario |
| Voice | At least one complete call flow |
| SMS | At least one complete inbound/outbound flow |
| UI consistency | 100% of primary screens use the governed component system |

---

# 35. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Hallucinated medical guidance | Controlled corpus + evidence validation + response policy + clinical review |
| Wrong safety route | Deterministic/clinician-reviewed protocols + human escalation |
| Tool misuse | Pydantic schemas, server validation, permissions, confirmation |
| Third-party failure | Mock/local fallback for voice/SMS/hospital tools |
| UX overload | Progressive disclosure; patient UI stays simple |
| 24-hour scope creep | Freeze P0; keep WhatsApp and advanced reranking optional |
| Poor demo reliability | Rehearsed scripts + seeded demo data + fallback mode |

---

# 36. Repository Structure

```text
ruralcare-ai/
├── backend/
│   ├── app.py
│   ├── agent/
│   │   ├── graph.py
│   │   ├── state.py
│   │   ├── nodes/
│   │   └── tools/
│   ├── rag/
│   ├── safety/
│   ├── api/
│   └── db/
│
├── frontend/
│   ├── components/
│   │   ├── ui/
│   │   ├── agent/
│   │   └── shared/
│   ├── pages/
│   ├── routes/
│   ├── hooks/
│   ├── lib/
│   └── types/
│
├── data/
│   └── medical/
│
├── tests/
│
└── docs/
```

---

# 37. Stage 1 vs Stage 2

## Stage 1 — Structure & Foundation

Stage 1 should only:

- understand the PRD
- create project foundation
- create routes/pages
- create navigation
- establish design tokens
- create reusable component skeletons
- create responsive layout
- create empty/placeholder states
- create FastAPI foundation
- create `/health`
- create placeholder API modules

### Stage 1 must NOT implement:

- LangGraph behavior
- LLM calls
- RAG
- Qdrant
- PostgreSQL business logic
- appointment logic
- Twilio
- voice
- SMS
- medical safety logic
- authentication
- fake AI responses
- fake medical content
- fake appointment results

## Stage 2 — Functionality

Stage 2 will implement:

- LangGraph
- Agentic RAG
- LLM
- medical evidence retrieval
- safety workflows
- appointment tools
- hospital/doctor search
- PostgreSQL
- memory
- voice
- SMS
- multilingual processing
- human escalation
- observability
- evaluation
- deployment

---

# 38. Definition of Done — Showcase

- A first-time user understands how to begin.
- Chat flow works end-to-end.
- LangGraph routes health, appointment, and emergency paths.
- RAG returns controlled evidence with source metadata.
- Appointment search and booking execute against demo data.
- Booking requires explicit confirmation.
- High-risk scenario interrupts normal flow and reaches escalation.
- Voice works for at least one scenario.
- SMS works for at least one scenario.
- English + one Indian language work end-to-end.
- Light UI is responsive and consistent.
- Accessibility states are implemented.
- Agent trace is visible for evaluators.
- Fallback/demo mode exists.
- README and presentation explain architecture, safety boundaries, tools, and limitations.

---

# 39. Recommended Final Stack

| Category | Choice | Why |
|---|---|---|
| Language | Python + TypeScript | Fast AI backend + modern UI |
| Agent | LangGraph | Explicit stateful orchestration |
| LLM | OpenAI API | Structured extraction and generation |
| Backend | FastAPI | Fast APIs/webhooks |
| RAG | Qdrant | Vector retrieval + metadata filtering |
| Database | PostgreSQL | Transactional state and appointment data |
| Frontend | React + Vite | Fast showcase development |
| UI | Tailwind + shadcn/ui + 21st.dev references | Rigid, customizable component system |
| Voice/SMS | Twilio | Fast multi-channel prototype |
| Observability | LangSmith | Agent trace + evaluation |
| Testing | pytest | Repeatable backend/agent tests |
| Deployment | Vercel + Render/Railway/Cloud Run | Fast public showcase |

---

# 40. Final Product Positioning

> **RuralCare AI is a multilingual, multimodal agentic healthcare assistant that uses governed medical RAG, stateful LangGraph workflows, care-navigation tools, and human escalation to help underserved users move from “I need help” to “I know my next safe step.”**

---

## Appendix A — Stage 1 Build Prompt

Stage 1 is a structure-only implementation.

### Objective

**Understand the PRD → establish project foundation → create the complete page/route/component structure → placeholder content only → no business functionality.**

### Stage 1 must create

- project skeleton
- frontend
- backend
- routes
- pages
- navigation
- reusable components
- design tokens
- responsive structure
- accessibility foundation
- FastAPI health-check
- placeholder APIs
- README

### Stage 1 must not create

- LLM integration
- LangGraph behavior
- RAG
- medical reasoning
- appointment logic
- voice
- SMS
- database business logic
- safety logic
- external API integrations

### Required page structure

```text
Home
Assistant
Appointments
Activity
Help & Safety
Agent Console
```

Each page should be visually complete enough to establish the final hierarchy, but intentionally use empty/placeholder states.

---

## Appendix B — Stage 1 Acceptance Checklist

- [ ] Frontend starts successfully.
- [ ] Backend starts successfully.
- [ ] `/health` returns `{"status":"ok"}`.
- [ ] Every route renders.
- [ ] Navigation works.
- [ ] No broken imports.
- [ ] No console errors.
- [ ] Responsive layout works.
- [ ] Design tokens are centralized.
- [ ] Core components are reusable.
- [ ] Accessibility foundation exists.
- [ ] No real API keys are required.
- [ ] No Stage 2 functionality has been accidentally implemented.

---

## Appendix C — Product Safety Statement

RuralCare AI is a prototype healthcare information and care-navigation assistant. It is not a substitute for professional medical diagnosis or treatment. Emergency routing and medical content used in a real deployment must be based on clinician-reviewed protocols, controlled knowledge sources, appropriate safety validation, human oversight, and applicable healthcare/privacy/regulatory requirements.
