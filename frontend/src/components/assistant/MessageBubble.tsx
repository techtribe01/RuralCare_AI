import { motion } from 'motion/react'
import { cn } from '../../lib/utils'

type MessageBubbleProps = {
  role: 'user' | 'assistant' | 'system'
  text: string
  timestamp?: string
}

function formatTime(timestamp?: string) {
  if (!timestamp) return null
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function MessageBubble({ role, text, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user'
  const isSystem = role === 'system'
  const time = formatTime(timestamp)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed shadow-xs sm:max-w-[70%]',
          isUser && 'bg-brand-600 text-white',
          !isUser && !isSystem && 'border border-border bg-surface text-text-primary',
          isSystem && 'border border-warning-100 bg-warning-50 text-warning-700',
        )}
      >
        <p className="whitespace-pre-wrap">{text}</p>
        {time ? (
          <p className={cn('mt-1.5 font-mono text-[11px] tracking-tight', isUser ? 'text-white/70' : 'text-text-muted')}>
            {time}
          </p>
        ) : null}
      </div>
    </motion.div>
  )
}
