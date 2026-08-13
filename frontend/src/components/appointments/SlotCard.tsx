type SlotCardProps = {
  time: string
  selected?: boolean
  disabled?: boolean
  onSelect?: () => void
}

export function SlotCard({ time, selected = false, disabled = false, onSelect }: SlotCardProps) {
  const state = disabled
    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
    : selected
      ? 'bg-sky-50 text-sky-700 border-sky-200 ring-2 ring-sky-200'
      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer'

  return (
    <button type="button" disabled={disabled} onClick={onSelect} className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${state}`}>
      {time}
    </button>
  )
}
