type AgentStepProps = {
  label: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'active' | 'complete' | 'blocked'
  duration?: string | number
  detail?: string
}

export function AgentStep({ label, status, duration, detail }: AgentStepProps) {
  const normalized = status === 'active' ? 'running' : status === 'complete' ? 'completed' : status
  const palette = {
    pending: 'bg-slate-100 text-slate-600',
    running: 'bg-sky-100 text-sky-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    blocked: 'bg-red-100 text-red-700',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${palette[normalized]}`}>
          {normalized}
        </span>
      </div>
      {duration !== undefined ? <p className="mt-2 text-xs text-slate-500">{duration}</p> : null}
      {detail ? <p className="mt-1 text-sm text-slate-600">{detail}</p> : null}
    </div>
  )
}
