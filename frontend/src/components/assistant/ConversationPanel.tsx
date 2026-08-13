import { Children, type ReactNode } from 'react'

type ConversationPanelProps = {
  children?: ReactNode
  emptyState?: ReactNode
  status?: ReactNode
}

export function ConversationPanel({ children, emptyState, status }: ConversationPanelProps) {
  return (
    <div className="flex min-h-[520px] flex-col rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
       <div className="flex items-center justify-between gap-3">
         <p className="text-sm font-medium text-slate-700">Conversation</p>
         {status ? <div className="text-xs text-slate-500">{status}</div> : null}
       </div>
      </div>
      <div className="flex-1 space-y-4 overflow-auto bg-slate-50 p-4">
       {Children.count(children) > 0 ? children : emptyState}
      </div>
    </div>
  )
}
