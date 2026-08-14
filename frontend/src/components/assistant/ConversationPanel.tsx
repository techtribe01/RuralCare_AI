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
    <section className="flex min-h-[560px] flex-col overflow-hidden rounded-[28px] border border-border/80 bg-surface shadow-md">
      <div className="flex items-center justify-between gap-4 border-b border-border/80 bg-surface px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
            <MessageCircle className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">RuralCare assistant</p>
            <p className="text-xs text-text-muted">A gentle place to start</p>
          </div>
        </div>
        {status ? <div className="hidden max-w-[220px] text-right text-xs leading-relaxed text-text-secondary sm:block">{status}</div> : null}
      </div>
      <div className={hasMessages ? 'flex-1 space-y-5 overflow-auto bg-canvas/70 p-4 sm:p-6' : 'flex flex-1 items-center justify-center overflow-auto bg-canvas/70 p-4 sm:p-6'}>
        {hasMessages ? children : emptyState}
      </div>
    </section>
  )
}
