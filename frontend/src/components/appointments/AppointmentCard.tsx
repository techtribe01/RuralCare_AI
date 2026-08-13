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
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <StatusBadge status={status} />
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {doctorName ? <li>Doctor: {doctorName}</li> : null}
        {specialty ? <li>Specialty: {specialty}</li> : null}
        {hospitalName ? <li>Hospital: {hospitalName}</li> : null}
        <li>Date: {date}</li>
        <li>Time: {time}</li>
        <li>Location: {location}</li>
        {bookingId ? <li>Booking ID: {bookingId}</li> : null}
      </ul>
    </div>
  )
}
