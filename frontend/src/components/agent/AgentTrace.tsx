import { Activity } from 'lucide-react'
import type { AgentEvent } from '../../types/chat'
import { AgentStep } from './AgentStep'

type AgentTraceProps = {
  events: AgentEvent[]
  title?: string
}

export function AgentTrace({ events, title = 'Agent trace' }: AgentTraceProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">
        <Activity className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </p>
      {events.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Send a message in the Assistant to view the live execution trace.
        </p>
      ) : (
        <ol className="space-y-3">
          {events.map((event, index) => (
            <li key={`${event.node}-${event.timestamp}-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-700">
                  {index + 1}
                </div>
                {index < events.length - 1 ? <div className="mt-1 w-px flex-1 bg-border" /> : null}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <AgentStep
                  label={event.node.replaceAll('_', ' ')}
                  status={event.status}
                  duration={typeof event.duration_ms === 'number' ? `${event.duration_ms}ms` : undefined}
                  detail={event.detail ?? undefined}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
