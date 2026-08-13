import { NavLink } from 'react-router-dom'

const mobileNavItems = [
  { label: 'Home', to: '/' },
  { label: 'Assistant', to: '/assistant' },
  { label: 'Appointments', to: '/appointments' },
  { label: 'Activity', to: '/activity' },
  { label: 'Help & Safety', to: '/help-safety' },
  { label: 'Agent Console', to: '/agent-console' },
]

export function TopBar() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-sm font-bold text-white">RC</div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">RuralCare AI</p>
            <p className="text-sm font-semibold text-slate-900">Stage 2 core agent</p>
          </div>
        </div>

        <nav aria-label="Mobile navigation" className="flex gap-2 lg:hidden">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium min-h-[44px] ${
                  isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button type="button" className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            English
          </button>
          <NavLink
            to="/assistant"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Start a conversation
          </NavLink>
        </div>
      </div>
    </header>
  )
}
