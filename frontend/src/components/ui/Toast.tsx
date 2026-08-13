type ToastProps = {
  title: string
  message: string
  variant?: 'success' | 'info' | 'warning' | 'error'
}

export function Toast({ title, message, variant = 'info' }: ToastProps) {
  const palette = {
    success: 'border-green-200 bg-green-50 text-green-900',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-900',
  }

  return (
    <div role="status" className={`rounded-lg border p-3 ${palette[variant]}`}>
      <p className="font-medium">{title}</p>
      <p className="text-sm opacity-80">{message}</p>
    </div>
  )
}
