import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

type Option = { label: string; value: string }

type SelectProps = {
  label?: string
  value?: string
  onChange?: (value: string) => void
  options: Option[] | string[]
  ariaLabel?: string
  placeholder?: string
}

function normalize(options: Option[] | string[]): Option[] {
  return options.map((option) => (typeof option === 'string' ? { label: option, value: option } : option))
}

export function Select({ label, value, onChange, options, ariaLabel, placeholder }: SelectProps) {
  const items = normalize(options)

  return (
    <div className="space-y-1.5">
      {label ? <span className="block text-sm font-medium text-text-primary">{label}</span> : null}
      <SelectPrimitive.Root value={value} onValueChange={onChange}>
        <SelectPrimitive.Trigger
          aria-label={ariaLabel || label || 'Select'}
          className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border-strong bg-surface px-3.5 text-sm text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 data-[placeholder]:text-text-muted"
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden="true" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-surface shadow-md"
          >
            <SelectPrimitive.Viewport className="p-1">
              {items.map((item) => (
                <SelectPrimitive.Item
                  key={item.value}
                  value={item.value}
                  className="relative flex h-10 cursor-pointer select-none items-center rounded-md px-3 pr-8 text-sm text-text-primary outline-none data-[highlighted]:bg-surface-muted"
                >
                  <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2.5 inline-flex items-center">
                    <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  )
}
