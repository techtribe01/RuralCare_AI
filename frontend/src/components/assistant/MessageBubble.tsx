type MessageBubbleProps = {
  role: 'user' | 'assistant' | 'system'
  text: string
  meta?: string
}

export function MessageBubble({ role, text, meta }: MessageBubbleProps) {
  const align = role === 'user' ? 'justify-end' : 'justify-start'
  const style =
    role === 'user'
      ? 'bg-sky-600 text-white'
      : role === 'assistant'
        ? 'bg-white text-slate-800 border border-slate-200'
        : 'bg-slate-100 text-slate-700 border border-slate-200'

  return (
    <div className={`flex ${align}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${style}`}>
        {text}
        {meta ? <p className="mt-2 text-xs opacity-70">{meta}</p> : null}
      </div>
    </div>
  )
}
