import { Wrench } from 'lucide-react'

type ToolActivityProps = {
  label: string
  status: string
}

export function ToolActivity({ label, status }: ToolActivityProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted p-3">
      <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
        <Wrench className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
        {label}
      </p>
      <span className="text-xs font-medium text-text-secondary">{status}</span>
    </div>
  )
}
