import { BookOpenCheck, ExternalLink } from 'lucide-react'
import type { SourceReference } from '../../types/chat'

type SourceCardProps = {
  source: SourceReference
}

export function SourceCard({ source }: SourceCardProps) {
  const relevancePercent = Math.round(Math.min(Math.max(source.relevance, 0), 1) * 100)

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-700">
          <BookOpenCheck className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">{source.source}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-text-primary">{source.title}</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            {source.topic}
            {source.section ? ` · ${source.section}` : ''} · v{source.version}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Relevance</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-muted" role="presentation">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${relevancePercent}%` }} />
          </div>
          <span className="text-xs font-medium text-text-secondary">{relevancePercent}%</span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
          View source
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}
