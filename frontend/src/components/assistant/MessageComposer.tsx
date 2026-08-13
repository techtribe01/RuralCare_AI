import { useState, type FormEvent } from 'react'

type MessageComposerProps = {
  onSubmit: (message: string) => Promise<void> | void
  loading?: boolean
}

export function MessageComposer({ onSubmit, loading = false }: MessageComposerProps) {
  const [value, setValue] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = value.trim()
    if (!next || loading) {
      return
    }
    setValue('')
    await onSubmit(next)
  }

  return (
    <form className="rounded-2xl border border-slate-200 bg-white p-3" onSubmit={handleSubmit}>
      <div className="flex items-end gap-3">
        <textarea
          aria-label="Message composer"
          placeholder="Describe your concern or ask about care options..."
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          rows={2}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" disabled={loading} className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
          🎙️ Voice
        </button>
        <button type="button" disabled={loading} className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
          📱 SMS
        </button>
        <button type="button" disabled={loading} className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
          Suggestion
        </button>
      </div>
    </form>
  )
}
