import { Button } from '../ui/Button'

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  variant?: 'info' | 'warning' | 'danger'
}

export function EmptyState({ title, description, actionLabel, onAction, variant = 'info' }: EmptyStateProps) {
  const palettes = {
    info: 'border-slate-200 bg-slate-50 text-slate-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
  }

  return (
    <div className={`rounded-xl border p-5 ${palettes[variant]}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-4">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
