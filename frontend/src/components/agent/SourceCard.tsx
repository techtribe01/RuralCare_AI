type SourceCardProps = {
  name: string
  title: string
  topic: string
  relevance: string
}

export function SourceCard({ name, title, topic, relevance }: SourceCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{name}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{topic}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Relevance</span>
        <span className="font-medium text-slate-700">{relevance}</span>
      </div>
    </div>
  )
}
