import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

type ToastVariant = 'success' | 'info' | 'warning' | 'error'

type ToastItem = {
  id: string
  title: string
  message?: string
  variant: ToastVariant
}

type ToastContextValue = {
  push: (toast: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const iconByVariant: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
}

const classByVariant: Record<ToastVariant, string> = {
  success: 'border-success-100 text-success-700',
  info: 'border-brand-200 text-brand-900',
  warning: 'border-warning-100 text-warning-700',
  error: 'border-critical-100 text-critical-700',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((current) => [...current, { ...toast, id }])
  }, [])

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((toast) => {
          const Icon = iconByVariant[toast.variant]
          return (
            <ToastPrimitive.Root
              key={toast.id}
              className={cn(
                'rc-toast flex items-start gap-3 rounded-lg border bg-surface p-4 shadow-md',
                classByVariant[toast.variant],
              )}
              onOpenChange={(open) => {
                if (!open) remove(toast.id)
              }}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <ToastPrimitive.Title className="text-sm font-semibold text-text-primary">
                  {toast.title}
                </ToastPrimitive.Title>
                {toast.message ? (
                  <ToastPrimitive.Description className="mt-0.5 text-sm text-text-secondary">
                    {toast.message}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 outline-none sm:bottom-4 sm:right-4" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
