import { CalendarDays, HeartPulse, Hospital, Phone, Search } from 'lucide-react'
import { SuggestedAction } from './SuggestedAction'

type AssistantEmptyStateProps = { onSendStarter: (message: string) => void }

const actions = [
  { label: 'Describe a concern', description: 'Get a clear next step', icon: HeartPulse, message: 'I have a health concern I want to understand better.' },
  { label: 'Find a doctor', description: 'Search by specialty or location', icon: Search, message: 'I want to find a doctor.' },
  { label: 'Find a hospital', description: 'Browse nearby hospitals', icon: Hospital, message: 'I want to find a hospital near me.' },
  { label: 'Book an appointment', description: 'Schedule a visit', icon: CalendarDays, message: 'I want to book an appointment.' },
]

export function AssistantEmptyState({ onSendStarter }: AssistantEmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col justify-center py-5 sm:py-12">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-800"><HeartPulse className="size-6" aria-hidden="true" /></span>
        <div><p className="text-sm font-semibold text-text-primary">Start here</p><p className="mt-1 text-xs text-text-muted">Choose a shortcut or type below</p></div>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => <SuggestedAction key={action.label} label={action.label} description={action.description} icon={action.icon} onClick={() => onSendStarter(action.message)} />)}
      </div>
      <a href="tel:09513886363" className="mt-3 flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 transition-colors hover:border-brand-300 hover:bg-brand-100"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-700 text-white"><Phone className="size-5" aria-hidden="true" /></span><span><span className="block text-sm font-semibold text-text-primary">Talk by voice</span><span className="mt-1 block text-xs text-text-secondary">Call 095-138-86363</span></span></a>
      <p className="mt-8 border-t border-border/70 pt-5 text-xs leading-5 text-text-muted">For urgent symptoms, call local emergency services. This assistant offers general information and does not replace a clinician.</p>
    </div>
  )
}
