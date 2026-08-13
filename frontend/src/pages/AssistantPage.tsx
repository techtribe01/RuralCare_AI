import { NavLink } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/shared/PageContainer'
import { PageHeader } from '../components/shared/PageHeader'
import { AppointmentOptionsPanel } from '../components/assistant/AppointmentOptionsPanel'
import { ConversationPanel } from '../components/assistant/ConversationPanel'
import { MessageBubble } from '../components/assistant/MessageBubble'
import { MessageComposer } from '../components/assistant/MessageComposer'
import { AgentTrace } from '../components/agent/AgentTrace'
import { StatusBadge } from '../components/appointments/StatusBadge'
import { useChatSession } from '../app/ChatSessionContext'

export default function AssistantPage() {
  const { messages, latestEvents, latestResponse, latestAppointment, isThinking, error, sendMessage } = useChatSession()

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Assistant"
        title="Multilingual care assistant"
        description="Conversational workspace for health guidance, intent routing, and live agent execution visibility."
        actions={
          <NavLink
            to="/help-safety"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            View safety guidance
          </NavLink>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.75fr]">
        <div className="space-y-5">
          {error ? <Alert title="Assistant unavailable" variant="danger">{error}</Alert> : null}

          <ConversationPanel
            status={
              latestResponse ? (
                <span>
                  Latest intent: <strong>{latestResponse.intent}</strong>
                </span>
              ) : (
                'Ready for a new conversation'
              )
            }
            emptyState={
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                Your conversation will appear here after you send a message. Try &quot;I want a general physician&quot; to start booking.
              </div>
            }
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} role={message.role} text={message.text} meta={message.role === 'assistant' ? 'Agent response' : undefined} />
            ))}
            {isThinking ? <MessageBubble role="assistant" text="Agent is thinking..." meta="Language detection and intent routing are running now." /> : null}
          </ConversationPanel>

          {latestAppointment ? (
            <AppointmentOptionsPanel
              payload={latestAppointment}
              onSelectSpecialty={(specialty) => sendMessage(specialty)}
              onSelectHospital={(id) => sendMessage('', { selected_hospital_id: id })}
              onSelectDoctor={(id) => sendMessage('', { selected_doctor_id: id })}
              onSelectSlot={(id) => sendMessage('', { selected_slot_id: id })}
              onConfirmBooking={() => sendMessage('YES', { confirm_booking: true })}
            />
          ) : null}

          <MessageComposer onSubmit={sendMessage} loading={isThinking} />
        </div>

        <div className="space-y-5">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Session context</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Language: {latestResponse?.language ?? 'en'}</li>
              <li>• Intent: {latestResponse?.intent ?? 'general_information'}</li>
              <li>• Channel: Chat</li>
              <li>• Session: Active</li>
              {latestResponse?.risk_level ? <li>• Risk: {latestResponse.risk_level}</li> : null}
            </ul>
            <div className="mt-3">
              <StatusBadge status="demo" />
            </div>
          </Card>

          <AgentTrace events={latestEvents} />
        </div>
      </div>
    </PageContainer>
  )
}
