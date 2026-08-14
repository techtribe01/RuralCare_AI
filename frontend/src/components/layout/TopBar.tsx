import { NavLink } from 'react-router-dom'
import { Languages } from 'lucide-react'
import { useChatSession } from '../../app/ChatSessionContext'
import { MobileNav } from './MobileNav'

const languageLabels: Record<string, string> = {
  en: 'English',
  te: 'తెలుగు',
}

export function TopBar() {
  const { currentLanguage } = useChatSession()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <MobileNav />
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              RC
            </div>
            <span className="hidden text-[15px] font-semibold tracking-tight text-text-primary sm:inline">
              RuralCare AI
            </span>
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-secondary sm:inline-flex"
            title="Detected conversation language"
          >
            <Languages className="h-3.5 w-3.5" aria-hidden="true" />
            {languageLabels[currentLanguage] ?? currentLanguage.toUpperCase()}
          </span>
          <NavLink
            to="/assistant"
            className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Start a conversation
          </NavLink>
        </div>
      </div>
    </header>
  )
}
