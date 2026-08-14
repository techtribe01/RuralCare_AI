import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-150 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 active:bg-brand-900',
        secondary:
          'border border-border-strong bg-surface text-text-primary shadow-xs hover:border-brand-300 hover:bg-brand-50',
        ghost: 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
        destructive: 'border border-critical-100 bg-critical-50 text-critical-700 hover:bg-critical-100',
        link: 'text-brand-700 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11 shrink-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
    children: ReactNode
  }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, loading = false, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
