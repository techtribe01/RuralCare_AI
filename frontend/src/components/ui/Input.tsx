type InputProps = {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  ariaLabel?: string
  error?: boolean
}

export function Input({ label, placeholder, value, onChange, ariaLabel, error = false }: InputProps) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      {label ? <span>{label}</span> : null}
      <input
        aria-label={ariaLabel || label || 'Input'}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className={`min-h-[44px] w-full rounded-lg border bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
          error ? 'border-red-300' : 'border-slate-200'
        }`}
      />
    </label>
  )
}
