import { useState, type FormEvent } from 'react'
import { Mic, MessageSquareText, Send } from 'lucide-react'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { Tooltip } from '../ui/Tooltip'

type MessageComposerProps = {
  onSubmit: (message: string) => Promise<void> | void
  loading?: boolean
  voiceOpen?: boolean
  onToggleVoice?: () => void
}

export function MessageComposer({ onSubmit, loading = false, voiceOpen = false, onToggleVoice }: MessageComposerProps) {
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
    <form className="rounded-xl border border-border bg-surface p-3 shadow-xs" onSubmit={handleSubmit}>
      <div className="flex items-end gap-2">
        <Textarea
          ariaLabel="Message composer"
          placeholder="Describe your concern or ask about care options..."
          value={value}
          onChange={setValue}
          rows={2}
          disabled={loading}
          className="min-h-[48px]"
        />
        <Button type="submit" disabled={loading || !value.trim()} loading={loading} size="md">
          <Send className="h-4 w-4" aria-hidden="true" />
          Send
        </Button>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={voiceOpen ? 'primary' : 'secondary'}
          size="sm"
          onClick={onToggleVoice}
          aria-pressed={voiceOpen}
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
          Voice
        </Button>
        <Tooltip label="You can also text this assistant over SMS on a supported phone number.">
          <span className="inline-flex min-h-[36px] cursor-default items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-text-secondary">
            <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
            SMS available
          </span>
        </Tooltip>
      </div>
    </form>
  )
}
