import { useState, type FormEvent } from 'react'
import { MessageSquareText, Send } from 'lucide-react'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'

type MessageComposerProps = { onSubmit: (message: string) => Promise<void> | void; loading?: boolean }

export function MessageComposer({ onSubmit, loading = false }: MessageComposerProps) {
  const [value, setValue] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = value.trim()
    if (!next || loading) return
    setValue('')
    await onSubmit(next)
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-[24px] border border-brand-300 bg-surface shadow-sm focus-within:ring-2 focus-within:ring-brand-100">
        <Textarea ariaLabel="Message composer" placeholder="Write a message..." value={value} onChange={setValue} rows={4} disabled={loading} className="min-h-[132px] w-full resize-none rounded-none border-0 bg-surface px-5 py-4 text-base shadow-none focus:ring-0" />
        <div className="flex flex-wrap items-center gap-2 border-t border-border/70 px-4 py-3">
          <a href="sms:09513886363" className="inline-flex min-h-[36px] items-center gap-2 rounded-full px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-brand-50 hover:text-brand-800"><MessageSquareText className="size-4" aria-hidden="true" />SMS 095-138-86363</a>
        </div>
        <div className="border-t border-border/70 p-3">
          <Button type="submit" disabled={loading || !value.trim()} loading={loading} size="md" className="w-full rounded-xl"><Send className="size-4" aria-hidden="true" />Send this</Button>
        </div>
      </div>
    </form>
  )
}
