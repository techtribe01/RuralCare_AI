import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { CalendarClock, MessageCircle, User2, Bot } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { PageContainer } from '../components/shared/PageContainer'
import { PageHeader } from '../components/shared/PageHeader'
import { AppointmentCard } from '../components/appointments/AppointmentCard'
import { EmptyState } from '../components/appointments/EmptyState'
import { StatusBadge } from '../components/appointments/StatusBadge'
import { listAppointments } from '../lib/appointments-api'
import { useAuth } from '../app/AuthContext'
import { useChatSession } from '../app/ChatSessionContext'
import { cn } from '../lib/utils'
import type { Appointment } from '../types/appointments'
import type { ChatMessage } from '../types/chat'

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24 && isSameDay(date, now)) return `${diffHours} hr ago`

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function groupMessagesByDay(messages: ChatMessage[]) {
  const today: ChatMessage[] = []
  const earlier: ChatMessage[] = []
  const now = new Date()

  for (const message of messages) {
    if (isSameDay(new Date(message.timestamp), now)) {
      today.push(message)
    } else {
      earlier.push(message)
    }
  }

  return { today, earlier }
}

function ConversationRow({ message, index }: { message: ChatMessage; index: number }) {
  const isUser = message.role === 'user'
  const truncated = message.text.length > 80 ? `${message.text.slice(0, 80)}…` : message.text

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 5) * 0.03 }}
      className="flex items-start gap-3 py-3"
    >
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-brand-soft text-brand-700' : 'bg-surface-muted text-text-secondary',
        )}
      >
        {isUser ? <User2 className="h-4 w-4" aria-hidden="true" /> : <Bot className="h-4 w-4" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-text-primary">{isUser ? 'You' : 'Assistant'}</p>
          <p className="shrink-0 text-xs text-text-muted">{formatRelativeTime(message.timestamp)}</p>
        </div>
        <p className="mt-0.5 truncate text-sm text-text-secondary">{truncated}</p>
      </div>
    </motion.li>
  )
}

function ConversationGroup({ label, items, offset }: { label: string; items: ChatMessage[]; offset: number }) {
  if (items.length === 0) return null

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <ul className="mt-1 divide-y divide-border">
        {items.map((message, index) => (
          <ConversationRow key={message.id} message={message} index={offset + index} />
        ))}
      </ul>
    </div>
  )
}

function AppointmentSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((key) => (
        <div key={key} className="rounded-xl border border-border bg-surface-muted p-4">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ActivityPage() {
  const navigate = useNavigate()
  const { messages, sessionId } = useChatSession()
  const { isAuthenticated, checkingSession } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (checkingSession) return
    if (!isAuthenticated) {
      setAppointments([])
      setLoadError(null)
      setIsLoadingAppointments(false)
      return
    }
    setIsLoadingAppointments(true)
    listAppointments()
      .then((data) => {
        setAppointments(data)
        setLoadError(null)
      })
      .catch(() => setLoadError('Could not load appointment history.'))
      .finally(() => setIsLoadingAppointments(false))
  }, [isAuthenticated, checkingSession])

  const recentMessages = messages.slice(-5).reverse()
  const { today, earlier } = groupMessagesByDay(recentMessages)
  const hasAnyActivity = recentMessages.length > 0 || appointments.length > 0

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Activity"
        title="Recent care activity"
        description="Your recent conversations and appointment history in one place."
        actions={<StatusBadge status="demo" />}
      />

      {!hasAnyActivity && !isLoadingAppointments && !loadError ? (
        <EmptyState
          title="No activity yet"
          description="Start a conversation with the assistant or book an appointment to see your activity here."
          actionLabel="Start a conversation"
          onAction={() => navigate('/assistant')}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  Recent conversations
                </CardTitle>
                <CardDescription>Your last few messages with the assistant.</CardDescription>
              </div>
            </CardHeader>

            {recentMessages.length > 0 ? (
              <div className="space-y-4">
                <ConversationGroup label="Today" items={today} offset={0} />
                <ConversationGroup label="Earlier" items={earlier} offset={today.length} />
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No conversations yet. Start one in the Assistant.</p>
            )}
            <p className="mt-4 text-xs text-text-muted">Session: {sessionId.slice(0, 8)}…</p>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  Appointments
                </CardTitle>
                <CardDescription>Bookings made through the assistant or appointments page.</CardDescription>
              </div>
            </CardHeader>

            {isLoadingAppointments ? (
              <AppointmentSkeleton />
            ) : loadError ? (
              <EmptyState title="Could not load appointments" description={loadError} variant="warning" />
            ) : appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.appointment_id}
                    title={`${appointment.status === 'CANCELLED' ? 'Cancelled' : 'Confirmed'} appointment`}
                    doctorName={appointment.doctor.name}
                    specialty={appointment.doctor.specialty}
                    hospitalName={appointment.hospital.name}
                    date={appointment.slot.date}
                    time={`${appointment.slot.start_time.slice(0, 5)} – ${appointment.slot.end_time.slice(0, 5)}`}
                    location={appointment.hospital.location}
                    bookingId={appointment.booking_id}
                    status={appointment.status === 'CANCELLED' ? 'cancelled' : 'confirmed'}
                  />
                ))}
              </div>
            ) : !isAuthenticated ? (
              <EmptyState
                title="Verify your mobile number"
                description="Book an appointment to verify your mobile number and see your appointment history here."
                actionLabel="Find a doctor"
                onAction={() => navigate('/appointments')}
              />
            ) : (
              <EmptyState
                title="No appointments yet"
                description="Book an appointment from the Appointments page or ask the assistant to help you find a doctor."
                actionLabel="Find a doctor"
                onAction={() => navigate('/appointments')}
              />
            )}
          </Card>
        </div>
      )}
    </PageContainer>
  )
}
