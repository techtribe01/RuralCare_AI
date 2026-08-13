type ToolActivityProps = {
  label: string
  status: string
}

export function ToolActivity({ label, status }: ToolActivityProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <span className="text-xs font-medium text-slate-500">{status}</span>
      </div>
    </div>
  )
}
