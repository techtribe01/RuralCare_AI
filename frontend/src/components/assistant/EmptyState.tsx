import { Activity, Building2, CalendarCheck, HeartPulse, Mic, Search, ShieldCheck } from 'lucide-react'
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

const tips = [
  { icon: Activity, title: 'Check in with yourself', text: 'Notice changes in sleep, appetite, energy, or mood.' },
  { icon: ShieldCheck, title: 'Know when to get help', text: 'Sudden chest pain, severe breathing trouble, or confusion needs urgent care.' },
  { icon: HeartPulse, title: 'Small steps count', text: 'Drink water, rest when you can, and keep medicines in one place.' },
]

export function AssistantEmptyState({ onSendStarter, onOpenVoice }: AssistantEmptyStateProps) {
  return (
    <div className="w-full max-w-3xl py-4 sm:py-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-3xl bg-brand-100 text-brand-800 shadow-xs">
          <HeartPulse className="size-7" aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Your calm care companion</p>
        <h2 className="mt-2 max-w-lg text-balance text-2xl font-semibold tracking-[-0.03em] text-text-primary sm:text-3xl">Start with whatever is on your mind.</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">Share a symptom, ask a question, or find your next care option. You do not need the perfect words.</p>
      </div>

      <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
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

      <div className="mt-8 border-t border-border/80 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-text-primary">Everyday health notes</p>
            <p className="mt-1 text-xs text-text-muted">Helpful reminders, not a diagnosis</p>
          </div>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-text-primary">Good to know</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {tips.map((tip) => {
            const TipIcon = tip.icon
            return (
              <div key={tip.title} className="rounded-2xl border border-border/70 bg-surface p-4 text-left shadow-xs">
                <TipIcon className="size-5 text-brand-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-text-primary">{tip.title}</p>
                <p className="mt-1 text-xs leading-5 text-text-secondary">{tip.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
