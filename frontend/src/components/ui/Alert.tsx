import type { ReactNode } from 'react'

type AlertProps = {
  title?: string
  children?: ReactNode
  variant?: 'info' | 'success' | 'warning' | 'danger'
}

export function Alert({ title, children, variant = 'info' }: AlertProps) {
  const palettes = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-green-200 bg-green-50 text-green-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
  }

  return (
    <div className={`rounded-lg border p-4 ${palettes[variant]}`} role="alert">
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      {children ? <div className="text-sm">{children}</div> : null}
    </div>
  )
}
