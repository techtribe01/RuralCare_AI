import { AlertTriangle, Info, SearchX } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  variant?: 'info' | 'warning' | 'danger'
}

const config = {
  info: { classes: 'border-border bg-surface-muted text-text-secondary', icon: Info, iconClass: 'text-text-muted' },
  warning: {
    classes: 'border-warning-100 bg-warning-50 text-warning-700',
    icon: SearchX,
    iconClass: 'text-warning-600',
  },
  danger: {
    classes: 'border-critical-100 bg-critical-50 text-critical-700',
    icon: AlertTriangle,
    iconClass: 'text-critical-600',
  },
}

export function EmptyState({ title, description, actionLabel, onAction, variant = 'info' }: EmptyStateProps) {
  const { classes, icon: Icon, iconClass } = config[variant]

  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-xl border p-8 text-center', classes)}>
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-full bg-white/60', iconClass)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold text-text-primary">{title}</p>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button variant="secondary" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
