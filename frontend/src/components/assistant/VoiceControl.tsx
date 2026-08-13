export function VoiceControl() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Voice</p>
          <p className="mt-1 text-sm font-medium text-slate-700">Idle</p>
        </div>
        <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-lg text-white ring-4 ring-sky-100">
          🎙️
        </button>
      </div>
    </div>
  )
}
