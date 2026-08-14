import { useEffect, useState } from 'react'
import { CheckCircle2, Phone, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../app/AuthContext'
import { Button } from '../ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Input } from '../ui/Input'
import type { ApiError } from '../../types/appointments'

type Step = 'phone' | 'otp' | 'success'

type PhoneAuthModalProps = {
  open: boolean
  onClose: () => void
  onVerified: () => void
}

const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/

function errorMessage(err: unknown, fallback: string): string {
  const apiError = err as ApiError
  return typeof apiError?.message === 'string' ? apiError.message : fallback
}

export function PhoneAuthModal({ open, onClose, onVerified }: PhoneAuthModalProps) {
  const { sendOtp, verifyOtp } = useAuth()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStep('phone')
      setPhone('')
      setCode('')
      setError(null)
      setLoading(false)
    }
  }, [open])

  const handleSendOtp = async () => {
    const trimmed = phone.trim()
    if (!PHONE_PATTERN.test(trimmed)) {
      setError('Enter a valid mobile number in international format, e.g. +91XXXXXXXXXX.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await sendOtp(trimmed)
      setStep('otp')
    } catch (err) {
      setError(errorMessage(err, 'Could not send the verification code. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    const trimmedCode = code.trim()
    if (!trimmedCode) {
      setError('Enter the code sent to your phone.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await verifyOtp(phone.trim(), trimmedCode)
      setStep('success')
      onVerified()
      window.setTimeout(onClose, 1100)
    } catch (err) {
      setError(errorMessage(err, 'That code is incorrect or has expired.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError(null)
    setLoading(true)
    try {
      await sendOtp(phone.trim())
    } catch (err) {
      setError(errorMessage(err, 'Could not resend the code. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {step === 'phone' ? 'Verify your mobile number' : step === 'otp' ? 'Enter the code' : 'Verified'}
          </DialogTitle>
          {step !== 'success' ? (
            <DialogDescription>
              Booking, cancelling, or rescheduling an appointment requires a quick one-time SMS verification.
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {step === 'phone' ? (
          <div className="space-y-4">
            <Input
              label="Mobile number"
              icon={<Phone className="h-4 w-4" aria-hidden="true" />}
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChange={setPhone}
              error={Boolean(error)}
              hint={error ?? 'We will text a 6-digit code to this number.'}
              disabled={loading}
              inputMode="tel"
              autoFocus
            />
            <DialogFooter>
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSendOtp} loading={loading}>
                Send code
              </Button>
            </DialogFooter>
          </div>
        ) : null}

        {step === 'otp' ? (
          <div className="space-y-4">
            <Input
              label="Verification code"
              icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              placeholder="123456"
              value={code}
              onChange={setCode}
              error={Boolean(error)}
              hint={error ?? `Enter the code sent to ${phone}.`}
              disabled={loading}
              inputMode="numeric"
              autoFocus
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                className="font-medium text-brand-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setStep('phone')}
                disabled={loading}
              >
                Change number
              </button>
              <button
                type="button"
                className="font-medium text-brand-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleResend}
                disabled={loading}
              >
                Resend code
              </button>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleVerify} loading={loading}>
                Verify
              </Button>
            </DialogFooter>
          </div>
        ) : null}

        {step === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-success-600" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Your mobile number is verified. Continuing...</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
