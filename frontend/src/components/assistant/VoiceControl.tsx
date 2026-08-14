import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Loader2, Mic, Volume2, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

const stateConfig: Record<VoiceState, { label: string; description: string }> = {
  idle: { label: 'Idle', description: 'Tap the microphone to preview a voice session.' },
  listening: { label: 'Listening', description: 'Speak naturally — capturing your voice.' },
  processing: { label: 'Processing', description: 'Understanding what you said…' },
  speaking: { label: 'Speaking', description: 'Playing the assistant response.' },
  error: { label: 'Something went wrong', description: 'The voice session could not be completed.' },
}

type VoiceControlProps = {
  onClose?: () => void
}

/**
 * Voice is a backend telephony channel — there is no real browser microphone
 * capture wired up in this app. This component is an intentionally
 * non-functional, demonstration-only visual preview of the voice states. It
 * never claims to send anything to the backend.
 */
export function VoiceControl({ onClose }: VoiceControlProps) {
  const [state, setState] = useState<VoiceState>('idle')

  function handleCentralClick() {
    if (state !== 'idle') {
      setState('idle')
      return
    }
    setState('listening')
    window.setTimeout(() => setState('processing'), 1600)
    window.setTimeout(() => setState('speaking'), 2800)
    window.setTimeout(() => setState('idle'), 4600)
  }

  const config = stateConfig[state]
  const isActive = state === 'listening' || state === 'speaking'

  return (
    <div className="rounded-xl border border-border bg-surface-sunken p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Voice preview</p>
          <p className="mt-0.5 text-xs text-text-secondary">Demonstration only — not connected to a live call.</p>
        </div>
        {onClose ? (
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close voice panel">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-3 py-4">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <AnimatePresence>
            {isActive ? (
              <motion.span
                key={state}
                initial={{ opacity: 0.45, scale: 0.85 }}
                animate={{ opacity: 0, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.3, repeat: 3, ease: 'easeOut' }}
                className={cn(
                  'absolute inset-0 rounded-full',
                  state === 'listening' ? 'bg-brand-300' : 'bg-success-100',
                )}
                aria-hidden="true"
              />
            ) : null}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleCentralClick}
            aria-label={state === 'idle' ? 'Start voice preview' : 'Stop voice preview'}
            className={cn(
              'relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-md transition-colors duration-150',
              state === 'error' && 'bg-critical-600',
              state === 'idle' && 'bg-brand-600 hover:bg-brand-700',
              (state === 'listening' || state === 'processing' || state === 'speaking') && 'bg-brand-700',
            )}
          >
            {state === 'processing' ? (
              <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
            ) : state === 'speaking' ? (
              <Volume2 className="h-7 w-7" aria-hidden="true" />
            ) : state === 'error' ? (
              <AlertCircle className="h-7 w-7" aria-hidden="true" />
            ) : (
              <Mic className="h-7 w-7" aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text-primary">{config.label}</p>
          <p className="mx-auto mt-0.5 max-w-[240px] text-xs text-text-secondary">{config.description}</p>
        </div>
      </div>
    </div>
  )
}
