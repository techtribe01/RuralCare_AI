import type { ReactNode } from 'react'

type TooltipProps = {
  label: string
  children: ReactNode
}

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white group-hover:block">
        {label}
      </span>
    </div>
  )
}
