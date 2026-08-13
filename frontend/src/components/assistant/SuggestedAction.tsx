type SuggestedActionProps = {
  label: string
}

export function SuggestedAction({ label }: SuggestedActionProps) {
  return (
    <button
      type="button"
      className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
    >
      {label}
    </button>
  )
}
