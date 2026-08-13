import type { ReactNode } from 'react'

type TabsProps = {
  children: ReactNode
}

export function Tabs({ children }: TabsProps) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

export function TabItem({
  label,
  active = false,
}: {
  label: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium ${
        active ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700'
      }`}
    >
      {label}
    </button>
  )
}
