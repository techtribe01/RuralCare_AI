import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageContainer } from '../components/shared/PageContainer'
import { PageHeader } from '../components/shared/PageHeader'
import { AppointmentOptionsPanel } from '../components/assistant/AppointmentOptionsPanel'
import { ConversationPanel } from '../components/assistant/ConversationPanel'
import { MessageBubble } from '../components/assistant/MessageBubble'
import { MessageComposer } from '../components/assistant/MessageComposer'
import { SafetyBanner } from '../components/assistant/SafetyBanner'
import { AssistantEmptyState } from '../components/assistant/EmptyState'
import { VoiceControl } from '../components/assistant/VoiceControl'
import { SourceCard } from '../components/agent/SourceCard'
import { StatusBadge } from '../components/appointments/StatusBadge'
import { PhoneAuthModal } from '../components/auth/PhoneAuthModal'
import { useChatSession } from '../app/ChatSessionContext'

export default function AssistantPage() {
  const { messages, latestResponse, latestAppointment, isThinking, error, sendMessage } = useChatSession()
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (latestAppointment?.type === 'auth_required') {
      setShowAuthModal(true)
    }
  }, [latestAppointment])

  let lastAssistantIndex = -1
  messages.forEach((message, index) => {
    if (message.role === 'assistant') {
      lastAssistantIndex = index
    }
  })

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Assistant"
        title="How are you feeling today?"
        description="Get a calm, practical next step for your health — in your language."
        actions={
          <NavLink
            to="/help-safety"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-muted"
          >
            View safety guidance
          </NavLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {error ? (
            <Alert title="Assistant unavailable" variant="danger">
              {error}
            </Alert>
          ) : null}

          <ConversationPanel
            status={
              latestResponse ? 'Your care summary is ready' : 'Private guidance, whenever you need it'
            }
            emptyState={<AssistantEmptyState onSendStarter={sendMessage} onOpenVoice={() => setVoiceOpen(true)} />}
          >
            {messages.map((message, index) => {
              const isLatestAssistantTurn = index === lastAssistantIndex && Boolean(latestResponse)
              const sources = isLatestAssistantTurn ? latestResponse?.sources ?? [] : []

              return (
                <div key={message.id} className="space-y-3">
                  <MessageBubble role={message.role} text={message.text} timestamp={message.timestamp} />
                  {isLatestAssistantTurn ? (
                    <div className="space-y-3">
                      <SafetyBanner
                        riskLevel={latestResponse?.risk_level}
                        humanEscalationRequired={latestResponse?.human_escalation_required}
                        reasonCode={latestResponse?.safety_reason_code}
                      />
                      {sources.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {sources.map((source) => (
                            <SourceCard key={source.document_id} source={source} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </ConversationPanel>

          {latestAppointment ? (
            <AppointmentOptionsPanel
              payload={latestAppointment}
              onSelectSpecialty={(specialty) => sendMessage(specialty)}
              onSelectHospital={(id) => sendMessage('', { selected_hospital_id: id })}
              onSelectDoctor={(id) => sendMessage('', { selected_doctor_id: id })}
              onSelectSlot={(id) => sendMessage('', { selected_slot_id: id })}
              onConfirmBooking={() => sendMessage('YES', { confirm_booking: true })}
              onVerifyPhone={() => setShowAuthModal(true)}
            />
          ) : null}

          <PhoneAuthModal
            open={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onVerified={() => sendMessage('confirm', { confirm_booking: true })}
          />

          {voiceOpen ? <VoiceControl onClose={() => setVoiceOpen(false)} /> : null}

          <MessageComposer
            onSubmit={sendMessage}
            loading={isThinking}
            voiceOpen={voiceOpen}
            onToggleVoice={() => setVoiceOpen((open) => !open)}
          />
        </div>

        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Session context</CardTitle>
            </CardHeader>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>Language: {latestResponse?.language ?? 'en'}</li>
              <li>Intent: {latestResponse?.intent ?? 'general_information'}</li>
              <li>Channel: Chat</li>
              <li>Session: Active</li>
              {latestResponse?.risk_level ? (
                <li className="flex items-center gap-2">
                  Risk:
                  <Badge
                    variant={
                      latestResponse.risk_level === 'emergency' || latestResponse.risk_level === 'high'
                        ? 'danger'
                        : latestResponse.risk_level === 'moderate'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {latestResponse.risk_level}
                  </Badge>
                </li>
              ) : null}
            </ul>
            <div className="mt-3">
              <StatusBadge status="demo" />
            </div>
          </Card>

        </div>
      </div>
    </PageContainer>
  )
}
