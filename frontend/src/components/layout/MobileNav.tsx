import { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { evaluatorNavItem, primaryNavItems } from './nav-items'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-muted lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="rc-overlay fixed inset-0 z-50 bg-slate-950/40" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface p-4 shadow-lg focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="mb-6 flex items-center justify-between">
            <DialogPrimitive.Title className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Menu
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-soft text-brand-700' : 'text-text-secondary hover:bg-surface-muted',
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 border-t border-border pt-4">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              For evaluators
            </p>
            <NavLink
              to={evaluatorNavItem.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  isActive ? 'bg-surface-muted text-text-primary' : 'text-text-secondary hover:bg-surface-muted',
                )
              }
            >
              <evaluatorNavItem.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {evaluatorNavItem.label}
            </NavLink>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
