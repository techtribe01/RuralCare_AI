import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Assistant', to: '/assistant' },
  { label: 'Appointments', to: '/appointments' },
  { label: 'Activity', to: '/activity' },
  { label: 'Help & Safety', to: '/help-safety' },
  { label: 'Agent Console', to: '/agent-console' },
]

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 lg:block">
      <div className="mb-6 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">RuralCare AI</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Care navigator</h2>
      </div>

      <nav aria-label="Main navigation" className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
                  : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
