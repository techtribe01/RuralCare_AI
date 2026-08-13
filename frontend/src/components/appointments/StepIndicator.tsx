import type { AppointmentStep } from '../../types/appointments'

const STEPS: { id: AppointmentStep; label: string }[] = [
  { id: 'need', label: 'Need' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'time', label: 'Time' },
  { id: 'confirm', label: 'Confirm' },
  { id: 'success', label: 'Done' },
]

type StepIndicatorProps = {
  currentStep: AppointmentStep
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep)

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {STEPS.map((step, index) => {
        const isActive = index === currentIndex
        const isComplete = index < currentIndex
        const styles = isActive
          ? 'bg-sky-100 text-sky-700'
          : isComplete
            ? 'bg-green-100 text-green-700'
            : 'bg-slate-100 text-slate-500'

        return (
          <span key={step.id} className={`rounded-full px-3 py-1 font-medium ${styles}`}>
            {isComplete ? '✓ ' : ''}
            {step.label}
          </span>
        )
      })}
    </div>
  )
}
