import { Stethoscope, MapPin, Languages, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'
import { StatusBadge } from './StatusBadge'

type DoctorCardProps = {
  name: string
  specialty: string
  location: string
  availability: string
  languages?: string[]
  selected?: boolean
  onSelect?: () => void
}

export function DoctorCard({
  name,
  specialty,
  location,
  availability,
  languages = [],
  selected = false,
  onSelect,
}: DoctorCardProps) {
  const interactive = Boolean(onSelect)

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!interactive}
      className={cn(
        'w-full rounded-xl border p-4 text-left transition-all',
        selected
          ? 'border-brand-300 bg-brand-50 ring-2 ring-brand-200'
          : 'border-border bg-surface hover:border-border-strong hover:shadow-sm',
        interactive ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
            <Stethoscope className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">{name}</p>
            <p className="mt-0.5 text-sm text-text-secondary">{specialty}</p>
          </div>
        </div>
        <StatusBadge status="available" label={availability} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-[52px] text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Next: {availability}
        </span>
        {languages.length > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5" aria-hidden="true" />
            {languages.join(', ')}
          </span>
        ) : null}
      </div>
    </button>
  )
}
