import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

type SuggestedActionProps = {
  label: string
  description?: string
  icon?: LucideIcon
  onClick?: () => void
  className?: string
}

export function SuggestedAction({ label, description, icon: Icon, onClick, className }: SuggestedActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[44px] items-start gap-3 rounded-lg border border-border bg-surface p-3.5 text-left shadow-xs transition-colors duration-150 hover:border-border-strong hover:bg-surface-muted',
        className,
      )}
    >
      {Icon ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-700">
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-text-secondary">{description}</span> : null}
      </span>
    </button>
  )
}
