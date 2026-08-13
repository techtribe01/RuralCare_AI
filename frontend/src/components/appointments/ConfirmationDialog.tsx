import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

type ConfirmationDialogProps = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  destructive?: boolean
}

export function ConfirmationDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go back',
  onConfirm,
  onCancel,
  loading = false,
  destructive = false,
}: ConfirmationDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close dialog" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 id="confirmation-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h3>
        <div className="mt-3 text-sm leading-6 text-slate-600">{children}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant={destructive ? 'destructive' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
