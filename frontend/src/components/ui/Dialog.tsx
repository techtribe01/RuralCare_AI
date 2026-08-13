import type { ReactNode } from 'react'

type DialogProps = {
  title: string
  children: ReactNode
}

export function Dialog({ title, children }: DialogProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 text-sm text-slate-600">{children}</div>
    </div>
  )
}
