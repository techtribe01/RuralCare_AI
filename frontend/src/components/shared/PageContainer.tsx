import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type PageContainerProps = {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn('mx-auto w-full max-w-5xl space-y-6', className)}>{children}</div>
}
