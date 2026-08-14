import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowUpRight, CheckCircle2, ClipboardList, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { PageContainer } from '../components/shared/PageContainer'
import { PageHeader } from '../components/shared/PageHeader'
import { AppointmentOptionsPanel } from '../components/assistant/AppointmentOptionsPanel'
import { MessageBubble } from '../components/assistant/MessageBubble'
import { MessageComposer } from '../components/assistant/MessageComposer'
import { SafetyBanner } from '../components/assistant/SafetyBanner'
import { AssistantEmptyState } from '../components/assistant/EmptyState'
import { SourceCard } from '../components/agent/SourceCard'
import { StatusBadge } from '../components/appointments/StatusBadge'
import { PhoneAuthModal } from '../components/auth/PhoneAuthModal'
import { useChatSession } from '../app/ChatSessionContext'

export default function AssistantPage() {
  const { messages, latestResponse, latestAppointment, isThinking, error, sendMessage } = useChatSession()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (latestAppointment?.type === 'auth_required') setShowAuthModal(true)
  }, [latestAppointment])

  const lastAssistantIndex = messages.reduce((last, message, index) => (message.role === 'assistant' ? index : last), -1)

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Care workspace"
        title="Assistant"
        description="A simple place to ask a question, find care, or contact the care line."
        actions={
          <NavLink to="/help-safety" className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-text-primary shadow-xs hover:border-brand-300 hover:bg-brand-50">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Safety guidance
          </NavLink>
        }
      />

      {error ? <Alert title="Assistant unavailable" variant="danger">{error}</Alert> : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <main className="min-w-0 overflow-hidden rounded-[28px] border border-border/80 bg-surface shadow-md">
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-800"><MessageCircle className="size-5" aria-hidden="true" /></span>
              <div><p className="text-sm font-semibold text-text-primary">Conversation</p><p className="text-xs text-text-muted">Your messages stay in this session</p></div>
            </div>
            <span className="hidden items-center gap-1.5 text-xs font-medium text-brand-700 sm:flex"><CheckCircle2 className="size-4" aria-hidden="true" />Ready</span>
          </div>

          <div className="min-h-[420px] bg-canvas/60 px-4 py-6 sm:px-7">
            {messages.length === 0 ? (
              <AssistantEmptyState onSendStarter={sendMessage} />
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-5">
                {messages.map((message, index) => {
                  const isLatestAssistantTurn = index === lastAssistantIndex && Boolean(latestResponse)
                  const sources = isLatestAssistantTurn ? latestResponse?.sources ?? [] : []
                  return (
                    <div key={message.id} className="space-y-3">
                      <MessageBubble role={message.role} text={message.text} timestamp={message.timestamp} />
                      {isLatestAssistantTurn ? <div className="space-y-3"><SafetyBanner riskLevel={latestResponse?.risk_level} humanEscalationRequired={latestResponse?.human_escalation_required} reasonCode={latestResponse?.safety_reason_code} />{sources.length > 0 ? <div className="grid gap-2 sm:grid-cols-2">{sources.map((source) => <SourceCard key={source.document_id} source={source} />)}</div> : null}</div> : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-border/80 bg-surface p-4 sm:p-6"><MessageComposer onSubmit={sendMessage} loading={isThinking} /></div>
        </main>

        <aside className="flex flex-col gap-4">
          <a href="tel:09513886363" className="rounded-[24px] bg-brand-800 p-5 text-white shadow-md transition-transform hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-2xl bg-white/15"><Phone className="size-5" aria-hidden="true" /></span><ArrowUpRight className="size-5 text-white/70" aria-hidden="true" /></div>
            <p className="mt-7 text-xs font-medium uppercase tracking-[0.16em] text-white/65">Care line</p><p className="mt-1 text-lg font-semibold">095-138-86363</p><p className="mt-2 text-sm leading-5 text-white/75">Tap to call when talking feels easier.</p>
          </a>
          <a href="sms:09513886363" className="flex items-center gap-3 rounded-[24px] border border-border bg-surface p-4 shadow-xs hover:border-brand-300 hover:bg-brand-50"><span className="flex size-10 items-center justify-center rounded-2xl bg-accent-soft text-text-primary"><MessageCircle className="size-5" aria-hidden="true" /></span><span><p className="text-sm font-semibold text-text-primary">Send an SMS</p><p className="mt-1 text-xs text-text-secondary">095-138-86363</p></span></a>
          <div className="rounded-[24px] border border-border bg-surface p-5 shadow-xs"><div className="flex items-center gap-3"><ClipboardList className="size-5 text-brand-700" aria-hidden="true" /><p className="text-sm font-semibold text-text-primary">Session details</p></div><dl className="mt-5 flex flex-col gap-3 text-sm"><div className="flex items-center justify-between gap-3"><dt className="text-text-muted">Language</dt><dd className="font-medium text-text-primary">{latestResponse?.language ?? 'en'}</dd></div><div className="flex items-center justify-between gap-3"><dt className="text-text-muted">Channel</dt><dd className="font-medium text-text-primary">Chat</dd></div>{latestResponse?.risk_level ? <div className="flex items-center justify-between gap-3"><dt className="text-text-muted">Risk</dt><dd><Badge variant={latestResponse.risk_level === 'emergency' || latestResponse.risk_level === 'high' ? 'danger' : latestResponse.risk_level === 'moderate' ? 'warning' : 'default'}>{latestResponse.risk_level}</Badge></dd></div> : null}</dl><div className="mt-5"><StatusBadge status="demo" /></div></div>
        </aside>
      </div>

      {latestAppointment ? <AppointmentOptionsPanel payload={latestAppointment} onSelectSpecialty={(specialty) => sendMessage(specialty)} onSelectHospital={(id) => sendMessage('', { selected_hospital_id: id })} onSelectDoctor={(id) => sendMessage('', { selected_doctor_id: id })} onSelectSlot={(id) => sendMessage('', { selected_slot_id: id })} onConfirmBooking={() => sendMessage('YES', { confirm_booking: true })} onVerifyPhone={() => setShowAuthModal(true)} /> : null}
      <PhoneAuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onVerified={() => sendMessage('confirm', { confirm_booking: true })} />
    </PageContainer>
  )
}
