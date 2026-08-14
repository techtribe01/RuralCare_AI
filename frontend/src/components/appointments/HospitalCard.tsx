import { Building2, MapPin } from 'lucide-react'
import { cn } from '../../lib/utils'
import { StatusBadge } from './StatusBadge'

type HospitalCardProps = {
  name: string
  location: string
  specialties?: string[]
  languages?: string[]
  selected?: boolean
  isDemoData?: boolean
  onSelect?: () => void
}

export function HospitalCard({
  name,
  location,
  specialties = [],
  languages = [],
  selected = false,
  isDemoData = true,
  onSelect,
}: HospitalCardProps) {
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
            <Building2 className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">{name}</p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-text-secondary">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {location}
            </p>
          </div>
        </div>
        {isDemoData ? <StatusBadge status="demo" /> : null}
      </div>
      {specialties.length > 0 ? (
        <p className="mt-3 pl-[52px] text-xs text-text-muted">Specialties: {specialties.join(', ')}</p>
      ) : null}
      {languages.length > 0 ? (
        <p className="mt-1 pl-[52px] text-xs text-text-muted">Languages: {languages.join(', ')}</p>
      ) : null}
    </button>
  )
}
