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
          <p className="mt-1 text-sm text-slate-600">{specialty}</p>
        </div>
        <StatusBadge status="available" label={availability} />
      </div>
      <p className="mt-3 text-sm text-slate-500">{location}</p>
      {languages.length > 0 ? <p className="mt-1 text-xs text-slate-400">Languages: {languages.join(', ')}</p> : null}
    </button>
  )
}
