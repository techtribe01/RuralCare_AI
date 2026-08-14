import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '../ui/Dialog'

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
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{title}</DialogTitle>
        <div className="mt-3 text-sm leading-6 text-text-secondary">{children}</div>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'destructive' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
