import { Badge } from '../ui/Badge'

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

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: 'success' | 'warning' | 'default' | 'danger' | 'brand' }> = {
  available: { label: 'Available', variant: 'success' },
  held: { label: 'Held', variant: 'warning' },
  booked: { label: 'Booked', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  demo: { label: 'Demo data', variant: 'brand' },
  showcase: { label: 'Showcase', variant: 'brand' },
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{label ?? config.label}</Badge>
}
