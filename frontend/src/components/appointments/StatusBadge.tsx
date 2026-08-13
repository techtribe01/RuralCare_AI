type AppointmentStatus =
  | 'available'
  | 'held'
  | 'booked'
  | 'cancelled'
  | 'confirmed'
  | 'pending'
  | 'demo'
  | 'showcase'

type StatusBadgeProps = {
  status: AppointmentStatus
  label?: string
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-green-100 text-green-700' },
  held: { label: 'Held', className: 'bg-amber-100 text-amber-700' },
  booked: { label: 'Booked', className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  demo: { label: 'DEMO DATA', className: 'bg-violet-100 text-violet-700' },
  showcase: { label: 'SHOWCASE', className: 'bg-violet-100 text-violet-700' },
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {label ?? config.label}
    </span>
  )
}
