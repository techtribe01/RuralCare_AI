import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { primaryNavItems } from './nav-items'

export function BottomNav() {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid grid-cols-4">
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                isActive ? 'text-brand-700' : 'text-text-muted',
              )
            }
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
