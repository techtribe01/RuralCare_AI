import { CheckCircle2, CircleDashed, Loader2, XCircle, ShieldAlert } from 'lucide-react'
import { cn } from '../../lib/utils'

type AgentStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'active' | 'complete' | 'blocked'

type AgentStepProps = {
  label: string
  status: AgentStepStatus
  duration?: string | number
  detail?: string
}

const normalizeStatus = (status: AgentStepStatus): 'pending' | 'running' | 'completed' | 'failed' => {
  if (status === 'active') return 'running'
  if (status === 'complete') return 'completed'
  if (status === 'blocked') return 'failed'
  return status
}

const statusConfig = {
  pending: { icon: CircleDashed, classes: 'text-text-muted', label: 'Pending', spin: false },
  running: { icon: Loader2, classes: 'text-brand-600', label: 'Running', spin: true },
  completed: { icon: CheckCircle2, classes: 'text-success-600', label: 'Completed', spin: false },
  failed: { icon: XCircle, classes: 'text-critical-600', label: 'Failed', spin: false },
} as const

export function AgentStep({ label, status, duration, detail }: AgentStepProps) {
  const normalized = normalizeStatus(status)
  const { icon: Icon, classes, label: statusLabel, spin } = statusConfig[normalized]

  return (
    <div className="rounded-lg border border-border bg-surface p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium capitalize text-text-primary">
          {label === 'safety' || label === 'safety check' ? (
            <ShieldAlert className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
          ) : null}
          {label}
        </p>
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', classes)}>
          <Icon className={cn('h-3.5 w-3.5', spin && 'animate-spin')} aria-hidden="true" />
          {statusLabel}
        </span>
      </div>
      {duration !== undefined ? (
        <p className="mt-1.5 font-mono text-xs text-text-muted">{duration}</p>
      ) : null}
      {detail ? <p className="mt-1.5 text-sm text-text-secondary">{detail}</p> : null}
    </div>
  )
}
