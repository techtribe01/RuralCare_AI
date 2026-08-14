import { Children, type ReactNode } from 'react'
import { MessageCircle } from 'lucide-react'

type ConversationPanelProps = {
  children?: ReactNode
  emptyState?: ReactNode
  status?: ReactNode
}

export function ConversationPanel({ children, emptyState, status }: ConversationPanelProps) {
  const hasMessages = Children.count(children) > 0

  return (
    <div className="flex min-h-[520px] flex-col rounded-xl border border-border bg-surface shadow-xs">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <MessageCircle className="h-4 w-4 text-text-muted" aria-hidden="true" />
            Conversation
          </p>
          {status ? <div className="text-xs text-text-secondary">{status}</div> : null}
        </div>
      </div>
      <div className={hasMessages ? 'flex-1 space-y-4 overflow-auto bg-canvas p-4' : 'flex flex-1 items-center justify-center overflow-auto bg-canvas p-4'}>
        {hasMessages ? children : emptyState}
      </div>
    </div>
  )
}
