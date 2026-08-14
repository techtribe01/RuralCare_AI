import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { AppointmentStep } from '../../types/appointments'

const STEPS: { id: AppointmentStep; label: string }[] = [
  { id: 'need', label: 'Specialty' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'time', label: 'Time' },
  { id: 'confirm', label: 'Review' },
  { id: 'success', label: 'Confirmed' },
]

type StepIndicatorProps = {
  currentStep: AppointmentStep
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep)

  return (
    <ol className="flex items-center" aria-label="Booking progress">
      {STEPS.map((step, index) => {
        const isActive = index === currentIndex
        const isComplete = index < currentIndex
        const isLast = index === STEPS.length - 1

        return (
          <li key={step.id} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  isComplete
                    ? 'bg-success-600 text-white'
                    : isActive
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface-muted text-text-muted',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </div>
              <span
                className={cn(
                  'hidden text-xs font-medium sm:block',
                  isActive || isComplete ? 'text-text-primary' : 'text-text-muted',
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast ? (
              <div className={cn('mx-2 h-px flex-1', isComplete ? 'bg-success-600' : 'bg-border')} />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
