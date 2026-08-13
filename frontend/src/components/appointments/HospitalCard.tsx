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
  const state = selected
    ? 'border-sky-300 bg-sky-50 ring-2 ring-sky-200'
    : 'border-slate-200 bg-white hover:border-slate-300'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!interactive}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${state} ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900">{name}</p>
          <p className="mt-1 text-sm text-slate-600">{location}</p>
        </div>
        {isDemoData ? <StatusBadge status="demo" /> : null}
      </div>
      {specialties.length > 0 ? (
        <p className="mt-3 text-sm text-slate-500">Specialties: {specialties.join(', ')}</p>
      ) : null}
      {languages.length > 0 ? (
        <p className="mt-1 text-xs text-slate-400">Languages: {languages.join(', ')}</p>
      ) : null}
    </button>
  )
}
