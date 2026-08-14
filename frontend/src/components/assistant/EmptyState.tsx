import { Building2, CalendarCheck, HeartPulse, Mic, Search } from 'lucide-react'
import { SuggestedAction } from './SuggestedAction'

type AssistantEmptyStateProps = {
  onSendStarter: (message: string) => void
  onOpenVoice: () => void
}

const actions = [
  {
    label: 'Understand a health concern',
    description: 'Describe symptoms and get guidance',
    icon: HeartPulse,
    message: 'I have a health concern I want to understand better.',
  },
  {
    label: 'Find a doctor',
    description: 'Search by specialty or location',
    icon: Search,
    message: 'I want to find a doctor.',
  },
  {
    label: 'Find a hospital',
    description: 'Browse nearby hospitals',
    icon: Building2,
    message: 'I want to find a hospital near me.',
  },
  {
    label: 'Book an appointment',
    description: 'Schedule a visit in a few steps',
    icon: CalendarCheck,
    message: 'I want to book an appointment.',
  },
]

export function AssistantEmptyState({ onSendStarter, onOpenVoice }: AssistantEmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-700">
        <HeartPulse className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-text-primary">RuralCare AI</h2>
      <p className="mt-1 text-sm text-text-secondary">Your healthcare navigation assistant</p>
      <p className="mt-5 text-sm font-medium text-text-primary">What can I help you with?</p>

      <div className="mt-5 grid w-full gap-2.5 sm:grid-cols-2">
        {actions.map((action) => (
          <SuggestedAction
            key={action.label}
            label={action.label}
            description={action.description}
            icon={action.icon}
            onClick={() => onSendStarter(action.message)}
          />
        ))}
        <SuggestedAction
          label="Talk by voice"
          description="Open the voice preview panel"
          icon={Mic}
          onClick={onOpenVoice}
          className="sm:col-span-2"
        />
      </div>
    </div>
  )
}
