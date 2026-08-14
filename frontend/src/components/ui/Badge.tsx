import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none',
  {
    variants: {
      variant: {
        default: 'bg-surface-muted text-text-secondary',
        brand: 'bg-brand-soft text-brand-700',
        success: 'bg-success-100 text-success-700',
        warning: 'bg-warning-100 text-warning-700',
        danger: 'bg-critical-100 text-critical-700',
        outline: 'border border-border-strong text-text-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    children: ReactNode
    dotClassName?: string
  }

export function Badge({ children, variant, className, dotClassName, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dotClassName ? <span className={cn('h-1.5 w-1.5 rounded-full', dotClassName)} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
