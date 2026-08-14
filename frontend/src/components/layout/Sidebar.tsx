import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { evaluatorNavItem, primaryNavItems } from './nav-items'

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-24 space-y-6">
        <nav aria-label="Main navigation" className="space-y-1">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-100 text-brand-800 shadow-xs'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border pt-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            For evaluators
          </p>
          <NavLink
            to={evaluatorNavItem.to}
            className={({ isActive }) =>
              cn(
                'flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-surface-muted text-text-primary'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
              )
            }
          >
            <evaluatorNavItem.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {evaluatorNavItem.label}
          </NavLink>
        </div>
      </div>
    </aside>
  )
}
