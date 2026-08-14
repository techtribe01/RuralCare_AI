import { cn } from '../../lib/utils'

type SlotCardProps = {
  time: string
  selected?: boolean
  disabled?: boolean
  onSelect?: () => void
}

export function SlotCard({ time, selected = false, disabled = false, onSelect }: SlotCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'min-h-[44px] rounded-lg border px-3.5 py-2 text-sm font-medium transition-all',
        disabled
          ? 'cursor-not-allowed border-border bg-surface-muted text-text-muted line-through'
          : selected
            ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
            : 'cursor-pointer border-border-strong bg-surface text-text-primary hover:border-brand-300 hover:bg-brand-50',
      )}
    >
      {time}
    </button>
  )
}
