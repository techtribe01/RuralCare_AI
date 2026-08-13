type SelectProps = {
  label?: string
  value?: string
  options: string[]
  ariaLabel?: string
}

export function Select({ label, value, options, ariaLabel }: SelectProps) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      {label ? <span>{label}</span> : null}
      <select
        aria-label={ariaLabel || label || 'Select'}
        value={value}
        className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
