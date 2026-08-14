import { CalendarDays, Clock, MapPin, Stethoscope, Hash } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

type AppointmentCardProps = {
  title: string
  doctorName?: string
  specialty?: string
  hospitalName?: string
  date: string
  time: string
  location: string
  bookingId?: string
  status?: 'confirmed' | 'cancelled' | 'pending'
}

export function AppointmentCard({
  title,
  doctorName,
  specialty,
  hospitalName,
  date,
  time,
  location,
  bookingId,
  status = 'confirmed',
}: AppointmentCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <StatusBadge status={status} />
      </div>
      <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm text-text-secondary sm:grid-cols-2">
        {doctorName ? (
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            <dt className="sr-only">Doctor</dt>
            <dd>{doctorName}{specialty ? ` · ${specialty}` : ''}</dd>
          </div>
        ) : null}
        {hospitalName ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            <dt className="sr-only">Hospital</dt>
            <dd>{hospitalName}</dd>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          <dt className="sr-only">Date</dt>
          <dd>{date}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          <dt className="sr-only">Time</dt>
          <dd>{time}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          <dt className="sr-only">Location</dt>
          <dd>{location}</dd>
        </div>
        {bookingId ? (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            <dt className="sr-only">Booking ID</dt>
            <dd className="font-mono text-xs">{bookingId}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
