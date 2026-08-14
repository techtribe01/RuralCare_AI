import { useState, type FormEvent } from 'react'
import { MessageSquareText, Phone, Send } from 'lucide-react'
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
      <div className="rounded-[22px] border border-border bg-canvas p-2 shadow-xs focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100">
        <div className="flex items-end gap-2">
          <Textarea ariaLabel="Message composer" placeholder="Write a message..." value={value} onChange={setValue} rows={2} disabled={loading} className="min-h-[52px] border-0 bg-transparent shadow-none focus:ring-0" />
          <Button type="submit" disabled={loading || !value.trim()} loading={loading} size="md" className="mb-1 rounded-xl"><Send className="size-4" aria-hidden="true" />Send</Button>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border/60 px-2 pt-2">
          <a href="tel:09513886363" className="inline-flex min-h-[34px] items-center gap-2 rounded-full px-3 text-xs font-medium text-text-secondary hover:bg-brand-50 hover:text-brand-800"><Phone className="size-3.5" aria-hidden="true" />Call 095-138-86363</a>
          <a href="sms:09513886363" className="inline-flex min-h-[34px] items-center gap-2 rounded-full px-3 text-xs font-medium text-text-secondary hover:bg-brand-50 hover:text-brand-800"><MessageSquareText className="size-3.5" aria-hidden="true" />SMS 095-138-86363</a>
        </div>
      </div>
    </form>
  )
}
