type TextareaProps = {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  ariaLabel?: string
}

export function Textarea({ label, placeholder, value, onChange, ariaLabel }: TextareaProps) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      {label ? <span>{label}</span> : null}
      <textarea
        aria-label={ariaLabel || label || 'Textarea'}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        rows={4}
        className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
    </label>
  )
}
