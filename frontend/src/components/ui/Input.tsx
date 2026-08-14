import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label?: string
  value?: string
  onChange?: (value: string) => void
  ariaLabel?: string
  error?: boolean
  hint?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, value, onChange, ariaLabel, error = false, hint, icon, className, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className="space-y-1.5">
        {label ? (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        ) : null}
        <div className="relative">
          {icon ? (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            aria-label={ariaLabel || label || undefined}
            aria-invalid={error || undefined}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            className={cn(
              'h-11 w-full rounded-lg border bg-surface px-3.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500',
              icon && 'pl-9',
              error ? 'border-critical-600' : 'border-border-strong',
              className,
            )}
            {...props}
          />
        </div>
        {hint ? (
          <p className={cn('text-xs', error ? 'text-critical-600' : 'text-text-muted')}>{hint}</p>
        ) : null}
      </div>
    )
  },
)
Input.displayName = 'Input'
