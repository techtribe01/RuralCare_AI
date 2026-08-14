import { forwardRef, useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  label?: string
  value?: string
  onChange?: (value: string) => void
  ariaLabel?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, value, onChange, ariaLabel, className, id, rows = 4, ...props }, ref) => {
    const generatedId = useId()
    const textareaId = id ?? generatedId

    return (
      <div className="space-y-1.5">
        {label ? (
          <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          aria-label={ariaLabel || label || undefined}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          rows={rows}
          className={cn(
            'w-full resize-none rounded-lg border border-border-strong bg-surface px-3.5 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500',
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
