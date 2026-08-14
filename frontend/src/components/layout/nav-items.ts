import { MessageSquareText, CalendarClock, Activity, ShieldQuestion, Terminal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const primaryNavItems: NavItem[] = [
  { label: 'Assistant', to: '/assistant', icon: MessageSquareText },
  { label: 'Appointments', to: '/appointments', icon: CalendarClock },
  { label: 'Activity', to: '/activity', icon: Activity },
  { label: 'Help & Safety', to: '/help-safety', icon: ShieldQuestion },
]

export const evaluatorNavItem: NavItem = {
  label: 'Agent Console',
  to: '/agent-console',
  icon: Terminal,
}
