import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

type AlertProps = {
  title?: string
  children?: ReactNode
  variant?: AlertVariant
  className?: string
}

const config: Record<AlertVariant, { classes: string; icon: typeof Info; iconClass: string }> = {
  info: { classes: 'border-brand-200 bg-brand-50 text-brand-900', icon: Info, iconClass: 'text-brand-600' },
  success: {
    classes: 'border-success-100 bg-success-50 text-success-700',
    icon: CheckCircle2,
    iconClass: 'text-success-600',
  },
  warning: {
    classes: 'border-warning-100 bg-warning-50 text-warning-700',
    icon: AlertTriangle,
    iconClass: 'text-warning-600',
  },
  danger: {
    classes: 'border-critical-100 bg-critical-50 text-critical-700',
    icon: XCircle,
    iconClass: 'text-critical-600',
  },
}

export function Alert({ title, children, variant = 'info', className }: AlertProps) {
  const { classes, icon: Icon, iconClass } = config[variant]

  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', classes, className)} role="alert">
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconClass)} aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="text-sm font-semibold">{title}</p> : null}
        {children ? <div className="mt-0.5 text-sm leading-relaxed">{children}</div> : null}
      </div>
    </div>
  )
}
