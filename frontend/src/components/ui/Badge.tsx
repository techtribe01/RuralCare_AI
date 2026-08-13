import type { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  )
}
