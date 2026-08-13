import type { AgentEvent } from '../../types/chat'
import { AgentStep } from './AgentStep'

type AgentTraceProps = {
  events: AgentEvent[]
}

export function AgentTrace({ events }: AgentTraceProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Agent trace</p>
        <p className="mt-4 text-sm text-slate-600">Send a message in the Assistant to view the live execution trace.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Agent trace</p>
      </div>
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={`${event.node}-${event.timestamp}-${index}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                {index + 1}
              </div>
              {index < events.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
            </div>
            <div className="flex-1">
              <AgentStep
                label={event.node.replaceAll('_', ' ')}
                status={event.status}
                duration={typeof event.duration_ms === 'number' ? `${event.duration_ms}ms` : event.duration_ms ?? '—'}
                detail={event.detail ?? undefined}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
