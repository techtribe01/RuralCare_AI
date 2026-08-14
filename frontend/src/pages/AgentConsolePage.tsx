import { Link } from 'react-router-dom'
import { Activity, ArrowRight, BookOpenCheck, CalendarClock, TerminalSquare } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs'
import { PageContainer } from '../components/shared/PageContainer'
import { PageHeader } from '../components/shared/PageHeader'
import { AgentStep } from '../components/agent/AgentStep'
import { AgentTrace } from '../components/agent/AgentTrace'
import { SourceCard } from '../components/agent/SourceCard'
import { StatusBadge } from '../components/appointments/StatusBadge'
import { useChatSession } from '../app/ChatSessionContext'
import type { AgentEvent, AgentEventStatus } from '../types/chat'

const APPOINTMENT_FLOW_NODES = [
  'specialty_prompt',
  'specialty_identified',
  'hospital_search',
  'doctor_search',
  'slot_search',
  'present_confirmation',
  'user_confirmation',
  'booking_tool_invoked',
  'database_updated',
  'notification',
  'booking_failed',
]

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  te: 'Telugu',
}

type PipelineStage = {
  key: string
  label: string
  match: (node: string) => boolean
}

// Groups the raw agent_events feed into the conceptual pipeline stages called out in the
// product spec (Input -> Language -> Intent -> Safety -> RAG -> Evidence -> Tool -> Response).
// A stage is only rendered if at least one real event's `node` matches — nothing here is
// fabricated, this is purely a presentation-layer grouping of node names.
const PIPELINE_STAGES: PipelineStage[] = [
  { key: 'input', label: 'Input', match: (n) => /input|message_received|user_message/.test(n) },
  { key: 'language', label: 'Language Detection', match: (n) => /language/.test(n) },
  { key: 'intent', label: 'Intent', match: (n) => /intent/.test(n) },
  { key: 'safety', label: 'Safety', match: (n) => /safety|risk|escalation/.test(n) },
  { key: 'retrieval', label: 'Retrieval', match: (n) => /retriev|rag|knowledge|vector_search/.test(n) },
  { key: 'evidence', label: 'Evidence', match: (n) => /evidence|validat/.test(n) },
  {
    key: 'tool',
    label: 'Tool',
    match: (n) => /tool|database|hospital_search|doctor_search|slot_search|booking/.test(n),
  },
  { key: 'response', label: 'Response', match: (n) => /^response$|present_confirmation|final_answer|notification/.test(n) },
]

function worstStatus(events: AgentEvent[]): AgentEventStatus {
  if (events.some((event) => event.status === 'failed')) return 'failed'
  if (events.some((event) => event.status === 'running')) return 'running'
  if (events.every((event) => event.status === 'completed')) return 'completed'
  return 'pending'
}

function sumDuration(events: AgentEvent[]): number | undefined {
  const durations = events.map((event) => event.duration_ms).filter((value): value is number => typeof value === 'number')
  if (durations.length === 0) return undefined
  return durations.reduce((total, value) => total + value, 0)
}

export default function AgentConsolePage() {
  const { latestEvents, latestResponse, latestAppointment } = useChatSession()

  const appointmentEvents = latestEvents.filter((event) => APPOINTMENT_FLOW_NODES.includes(event.node))

  const stageSummaries = PIPELINE_STAGES.map((stage) => {
    const matched = latestEvents.filter((event) => stage.match(event.node))
    if (matched.length === 0) return null

    const status = worstStatus(matched)
    const durationMs = sumDuration(matched)
    const duration = typeof durationMs === 'number' ? `${durationMs}ms` : undefined

    let detail: string | undefined
    if (stage.key === 'language' && latestResponse?.language) {
      detail = LANGUAGE_LABELS[latestResponse.language] ?? latestResponse.language
    } else if (stage.key === 'intent' && latestResponse?.intent) {
      detail = latestResponse.intent.replaceAll('_', ' ')
    } else if (stage.key === 'safety' && latestResponse?.risk_level) {
      detail = latestResponse.risk_level.toUpperCase()
    } else if (stage.key === 'retrieval' && latestResponse?.sources) {
      detail = `${latestResponse.sources.length} source${latestResponse.sources.length === 1 ? '' : 's'}`
    } else if (stage.key === 'evidence') {
      detail = latestResponse?.sources && latestResponse.sources.length > 0 ? 'Validated' : matched[matched.length - 1]?.detail ?? undefined
    } else {
      detail = matched[matched.length - 1]?.detail ?? `${matched.length} event${matched.length === 1 ? '' : 's'}`
    }

    return { key: stage.key, label: stage.label, status, duration, detail }
  }).filter((summary): summary is NonNullable<typeof summary> => summary !== null)

  const hasRun = latestEvents.length > 0
  const sources = latestResponse?.sources ?? []

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader
        eyebrow="Agent Console"
        title="Workflow visibility and execution trace"
        description="A LangGraph-level view of the real agent pipeline — every node, status, and latency exactly as emitted by the backend, for evaluators and product reviewers."
        actions={<StatusBadge status="showcase" />}
      />

      {!hasRun ? (
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-700">
            <TerminalSquare className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">No execution trace yet</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-text-secondary">
              This console mirrors the live agent run for the current session. Start a conversation in the Assistant to
              see language detection, intent classification, safety routing, RAG retrieval, and tool-call events stream
              in here.
            </p>
          </div>
          <Link
            to="/assistant"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-brand-700"
          >
            Go to Assistant
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                Pipeline summary
              </p>
              <span className="font-mono text-xs text-text-muted">session {latestResponse?.session_id ?? '—'}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stageSummaries.map((summary) => (
                <AgentStep
                  key={summary.key}
                  label={summary.label}
                  status={summary.status}
                  duration={summary.duration}
                  detail={summary.detail}
                />
              ))}
            </div>
          </Card>

          <Tabs defaultValue="trace">
            <TabsList>
              <TabsTrigger value="trace">Full trace</TabsTrigger>
              <TabsTrigger value="appointment">
                Appointment flow
                {appointmentEvents.length > 0 ? (
                  <Badge variant="brand" className="ml-1.5">
                    {appointmentEvents.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="evidence">
                Evidence
                {sources.length > 0 ? (
                  <Badge variant="brand" className="ml-1.5">
                    {sources.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trace">
              <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-5">
                  <Card>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Conversation summary</p>
                    <dl className="mt-4 space-y-2.5 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-text-secondary">Language</dt>
                        <dd className="font-mono text-text-primary">{latestResponse?.language ?? 'en'}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-text-secondary">Intent</dt>
                        <dd className="font-mono text-text-primary">{latestResponse?.intent ?? 'general_information'}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-text-secondary">Session</dt>
                        <dd className="truncate font-mono text-xs text-text-primary">{latestResponse?.session_id ?? 'live'}</dd>
                      </div>
                      {latestResponse?.risk_level ? (
                        <div className="flex items-center justify-between">
                          <dt className="text-text-secondary">Risk level</dt>
                          <dd>
                            <Badge variant={latestResponse.risk_level === 'low' ? 'success' : latestResponse.risk_level === 'moderate' ? 'warning' : 'danger'}>
                              {latestResponse.risk_level}
                            </Badge>
                          </dd>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <dt className="text-text-secondary">Events emitted</dt>
                        <dd className="font-mono text-text-primary">{latestEvents.length}</dd>
                      </div>
                    </dl>
                  </Card>

                  {latestAppointment ? (
                    <Card>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Appointment payload</p>
                      <div className="mt-4">
                        <AgentStep
                          label={`Appointment: ${latestAppointment.type}`}
                          status="completed"
                          detail="Structured appointment payload returned from the agent."
                        />
                      </div>
                    </Card>
                  ) : null}
                </div>

                <AgentTrace events={latestEvents} title="Raw event stream" />
              </div>
            </TabsContent>

            <TabsContent value="appointment">
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Appointment flow events</p>
                </div>
                {appointmentEvents.length > 0 ? (
                  <div className="space-y-2.5">
                    {appointmentEvents.map((event, index) => (
                      <AgentStep
                        key={`${event.node}-${index}`}
                        label={event.node.replaceAll('_', ' ')}
                        status={event.status}
                        duration={typeof event.duration_ms === 'number' ? `${event.duration_ms}ms` : undefined}
                        detail={event.detail ?? undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-text-secondary">
                    Start an appointment booking in the Assistant to see live hospital search, doctor search, slot
                    search, confirmation, and booking events here.
                  </p>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="evidence">
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">RAG evidence</p>
                </div>
                {sources.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sources.map((source) => (
                      <SourceCard key={source.document_id} source={source} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-text-secondary">
                    No retrieved sources for the latest response. Ask a health-information question in the Assistant
                    to see the retrieval evidence trail here.
                  </p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </PageContainer>
  )
}
