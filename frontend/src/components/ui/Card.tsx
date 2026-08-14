import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-border/80 bg-surface p-5 shadow-xs',
        interactive && 'transition-shadow duration-150 hover:shadow-sm',
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex items-start justify-between gap-3', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-text-primary', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-text-secondary', className)} {...props} />
}
