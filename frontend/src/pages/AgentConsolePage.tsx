import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/shared/PageContainer'
import { PageHeader } from '../components/shared/PageHeader'
import { AgentStep } from '../components/agent/AgentStep'
import { AgentTrace } from '../components/agent/AgentTrace'
import { StatusBadge } from '../components/appointments/StatusBadge'
import { useChatSession } from '../app/ChatSessionContext'

export default function AgentConsolePage() {
  const { latestEvents, latestResponse, latestAppointment } = useChatSession()

  const appointmentEvents = latestEvents.filter((event) =>
    ['specialty_prompt', 'specialty_identified', 'hospital_search', 'doctor_search', 'slot_search', 'present_confirmation', 'user_confirmation', 'booking_tool_invoked', 'database_updated', 'notification', 'booking_failed'].includes(event.node),
  )

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Agent Console"
        title="Workflow visibility and execution trace"
        description="A transparent view of the real agent flow for evaluators and product reviewers."
        actions={<StatusBadge status="showcase" />}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current run</p>
            <div className="mt-4 space-y-3">
              <AgentStep
                label="Response"
                status={latestResponse ? 'completed' : 'pending'}
                duration={latestResponse ? 'completed' : 'idle'}
                detail={
                  latestResponse
                    ? 'Latest response returned to the assistant UI.'
                    : 'Send a message in the Assistant to generate a live trace.'
                }
              />
              {latestAppointment ? (
                <AgentStep
                  label={`Appointment: ${latestAppointment.type}`}
                  status="completed"
                  duration="—"
                  detail="Structured appointment payload returned from the agent."
                />
              ) : null}
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Conversation summary</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Language: {latestResponse?.language ?? 'en'}</li>
              <li>• Intent: {latestResponse?.intent ?? 'general_information'}</li>
              <li>• Session: Live</li>
              {latestResponse?.risk_level ? <li>• Risk: {latestResponse.risk_level}</li> : null}
            </ul>
          </Card>

          {appointmentEvents.length > 0 ? (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Appointment flow events</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {appointmentEvents.map((event, index) => (
                  <li key={`${event.node}-${index}`}>
                    [✓] {event.node.replaceAll('_', ' ')}
                    {event.detail ? ` — ${event.detail}` : ''}
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Appointment flow</p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Start an appointment booking in the Assistant to see live hospital search, doctor search, slot search, confirmation, and booking events here.
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <AgentTrace events={latestEvents} />
        </div>
      </div>
    </PageContainer>
  )
}
