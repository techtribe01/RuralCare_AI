import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/shared/PageContainer'
import { PageHeader } from '../components/shared/PageHeader'
import { AppointmentCard } from '../components/appointments/AppointmentCard'
import { EmptyState } from '../components/appointments/EmptyState'
import { StatusBadge } from '../components/appointments/StatusBadge'
import { listAppointments } from '../lib/appointments-api'
import { useChatSession } from '../app/ChatSessionContext'
import type { Appointment } from '../types/appointments'

export default function ActivityPage() {
  const { messages, sessionId } = useChatSession()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    listAppointments(sessionId)
      .then(setAppointments)
      .catch(() => setLoadError('Could not load appointment history.'))
  }, [sessionId])

  const recentMessages = messages.slice(-5).reverse()

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Activity"
        title="Recent care activity"
        description="User-visible history for conversations, appointments, and escalation events."
        actions={<StatusBadge status="demo" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recent conversations</p>
          {recentMessages.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {recentMessages.map((message) => (
                <li key={message.id}>
                  • {message.role === 'user' ? 'You' : 'Assistant'}: {message.text.slice(0, 80)}
                  {message.text.length > 80 ? '…' : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No conversations yet. Start one in the Assistant.</p>
          )}
          <p className="mt-3 text-xs text-slate-400">Session: {sessionId.slice(0, 8)}…</p>
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Appointments</p>
            {loadError ? (
              <div className="mt-4">
                <EmptyState title="Could not load appointments" description={loadError} variant="warning" />
              </div>
            ) : appointments.length > 0 ? (
              <div className="mt-4 space-y-3">
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
            ) : (
              <p className="mt-4 text-sm text-slate-600">No appointments yet. Book one from the Appointments page or Assistant.</p>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
