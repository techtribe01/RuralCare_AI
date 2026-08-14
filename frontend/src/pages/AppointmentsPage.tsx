import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, Loader2, MapPin, Stethoscope } from 'lucide-react'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { PageContainer } from '../components/shared/PageContainer'
import { PageHeader } from '../components/shared/PageHeader'
import { AppointmentCard } from '../components/appointments/AppointmentCard'
import { ConfirmationDialog } from '../components/appointments/ConfirmationDialog'
import { DoctorCard } from '../components/appointments/DoctorCard'
import { EmptyState } from '../components/appointments/EmptyState'
import { HospitalCard } from '../components/appointments/HospitalCard'
import { SlotCard } from '../components/appointments/SlotCard'
import { StatusBadge } from '../components/appointments/StatusBadge'
import { StepIndicator } from '../components/appointments/StepIndicator'
import { PhoneAuthModal } from '../components/auth/PhoneAuthModal'
import {
  bookAppointment,
  cancelAppointment,
  checkSlots,
  fetchSpecialties,
  formatSlotLabel,
  rescheduleAppointment,
  searchDoctors,
  searchHospitals,
} from '../lib/appointments-api'
import { useAuth } from '../app/AuthContext'
import { cn } from '../lib/utils'
import type { ApiError, Appointment, AppointmentStep, Doctor, Hospital, Slot, Specialty } from '../types/appointments'

const STEP_DESCRIPTIONS: Record<AppointmentStep, string> = {
  need: 'Tell us what kind of care you need.',
  doctor: 'Choose a hospital and doctor.',
  time: 'Pick an available time.',
  confirm: 'Review and confirm your appointment.',
  success: 'Your appointment is confirmed.',
}

const SLOT_PERIOD_ORDER = ['Morning', 'Afternoon', 'Evening'] as const
type SlotPeriod = (typeof SLOT_PERIOD_ORDER)[number]

function slotPeriod(slot: Slot): SlotPeriod {
  const hour = Number.parseInt(slot.start_time.slice(0, 2), 10)
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}

function slotTimeRange(slot: Slot): string {
  return `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`
}

function groupSlots(slots: Slot[]): { date: string; periods: { period: SlotPeriod; slots: Slot[] }[] }[] {
  const byDate = new Map<string, Map<SlotPeriod, Slot[]>>()
  for (const slot of slots) {
    if (!byDate.has(slot.date)) byDate.set(slot.date, new Map())
    const periods = byDate.get(slot.date)!
    const period = slotPeriod(slot)
    if (!periods.has(period)) periods.set(period, [])
    periods.get(period)!.push(slot)
  }
  return Array.from(byDate.entries()).map(([date, periods]) => ({
    date,
    periods: SLOT_PERIOD_ORDER.filter((period) => periods.has(period)).map((period) => ({
      period,
      slots: periods.get(period)!,
    })),
  }))
}

function formatDateHeading(date: string): string {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

const stepMotionProps = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: [0.2, 0, 0, 1] as const },
}

export default function AppointmentsPage() {
  const { isAuthenticated } = useAuth()
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const [step, setStep] = useState<AppointmentStep>('need')
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [specialtiesLoading, setSpecialtiesLoading] = useState(true)
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [locationFilter, setLocationFilter] = useState('')
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [hospitalsLoading, setHospitalsLoading] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null)
  const [notificationStatus, setNotificationStatus] = useState<string>('Demo mode')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showRescheduleMode, setShowRescheduleMode] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    setSpecialtiesLoading(true)
    fetchSpecialties()
      .then(setSpecialties)
      .catch(() => setError({ code: 'service_unavailable', message: 'We could not load specialties. Please try again.' }))
      .finally(() => setSpecialtiesLoading(false))
  }, [])

  const resetFlow = useCallback(() => {
    setStep('need')
    setSelectedSpecialty(null)
    setLocationFilter('')
    setHospitals([])
    setHospitalsLoading(false)
    setSelectedHospital(null)
    setDoctors([])
    setDoctorsLoading(false)
    setSelectedDoctor(null)
    setSlots([])
    setSelectedSlot(null)
    setBookedAppointment(null)
    setShowRescheduleMode(false)
    setError(null)
  }, [])

  const handleSpecialtySelect = async (specialtyName: string) => {
    setSelectedSpecialty(specialtyName)
    setError(null)
    setHospitals([])
    setSelectedHospital(null)
    setDoctors([])
    setSelectedDoctor(null)
    setHospitalsLoading(true)
    setStep('doctor')
    try {
      const hospitalResults = await searchHospitals({ specialty: specialtyName, location: locationFilter || undefined })
      setHospitals(hospitalResults)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setHospitalsLoading(false)
    }
  }

  const handleHospitalSelect = async (hospital: Hospital) => {
    setSelectedHospital(hospital)
    setDoctors([])
    setSelectedDoctor(null)
    setError(null)
    setDoctorsLoading(true)
    try {
      const doctorResults = await searchDoctors({
        specialty: selectedSpecialty ?? undefined,
        hospital_id: hospital.hospital_id,
      })
      setDoctors(doctorResults)
      if (doctorResults.length === 0) {
        setError({ code: 'no_doctors_found', message: 'No doctors found at this hospital for your need.' })
      }
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setDoctorsLoading(false)
    }
  }

  const handleDoctorSelect = async (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setLoading(true)
    setError(null)
    try {
      const slotResults = await checkSlots({ doctor_id: doctor.doctor_id })
      setSlots(slotResults)
      if (slotResults.length === 0) {
        setError({ code: 'no_slots_available', message: 'This doctor has no open slots right now.' })
      } else {
        setStep('time')
      }
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot)
    setStep('confirm')
  }

  const requireAuth = (action: () => void) => {
    if (isAuthenticated) {
      action()
      return
    }
    setPendingAction(() => action)
    setShowAuthModal(true)
  }

  const handleConfirmBooking = () =>
    requireAuth(async () => {
      if (!selectedDoctor || !selectedSlot) return
      setLoading(true)
      setError(null)
      try {
        const appointment = await bookAppointment({
          doctor_id: selectedDoctor.doctor_id,
          hospital_id: selectedDoctor.hospital_id,
          slot_id: selectedSlot.slot_id,
          confirmation: true,
          channel: 'chat',
        })
        setBookedAppointment(appointment)
        setNotificationStatus('Sent / Demo mode')
        setStep('success')
        setShowConfirmDialog(false)
      } catch (err) {
        const apiError = err as ApiError
        setError(apiError)
        if (apiError.code === 'slot_unavailable') {
          setSelectedSlot(null)
          setStep('time')
        }
        setShowConfirmDialog(false)
      } finally {
        setLoading(false)
      }
    })

  const handleCancel = () =>
    requireAuth(async () => {
      if (!bookedAppointment) return
      setLoading(true)
      try {
        await cancelAppointment(bookedAppointment.appointment_id, { confirmation: true })
        setShowCancelDialog(false)
        resetFlow()
      } catch (err) {
        setError(err as ApiError)
        setShowCancelDialog(false)
      } finally {
        setLoading(false)
      }
    })

  const handleReschedule = () =>
    requireAuth(async () => {
      if (!bookedAppointment || !selectedSlot) return
      setLoading(true)
      try {
        const updated = await rescheduleAppointment(bookedAppointment.appointment_id, {
          new_slot_id: selectedSlot.slot_id,
          confirmation: true,
        })
        setBookedAppointment(updated)
        setShowRescheduleMode(false)
        setStep('success')
      } catch (err) {
        setError(err as ApiError)
      } finally {
        setLoading(false)
      }
    })

  const startReschedule = async () => {
    if (!bookedAppointment) return
    setShowRescheduleMode(true)
    setLoading(true)
    try {
      const slotResults = await checkSlots({ doctor_id: bookedAppointment.doctor.doctor_id })
      setSlots(slotResults.filter((s) => s.slot_id !== bookedAppointment.slot.slot_id))
      setStep('time')
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }

  const errorPresentation = (() => {
    if (!error) return null
    switch (error.code) {
      case 'no_doctors_found':
        return {
          title: 'No doctors found',
          actionLabel: 'Choose a different hospital',
          onAction: () => {
            setError(null)
            setSelectedHospital(null)
            setDoctors([])
          },
          variant: 'warning' as const,
        }
      case 'no_slots_available':
      case 'slot_unavailable':
        return {
          title: 'No slots available',
          actionLabel: 'Try another doctor',
          onAction: () => {
            setError(null)
            setSelectedSlot(null)
            setStep('doctor')
          },
          variant: 'warning' as const,
        }
      case 'service_unavailable':
        return {
          title: 'Service unavailable',
          actionLabel: 'Start over',
          onAction: () => resetFlow(),
          variant: 'danger' as const,
        }
      default:
        return {
          title: 'Something went wrong',
          actionLabel: 'Start over',
          onAction: () => resetFlow(),
          variant: 'warning' as const,
        }
    }
  })()

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader
        eyebrow="Appointments"
        title="Book a doctor visit"
        description="Find a doctor, choose a time, and confirm your appointment step by step."
        actions={<StatusBadge status="demo" />}
      />

      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Your progress</p>
        <div className="mt-4">
          <StepIndicator currentStep={step} />
        </div>
        <p className="mt-4 text-sm text-text-secondary">{STEP_DESCRIPTIONS[step]}</p>
      </Card>

      {error && errorPresentation ? (
        <EmptyState
          title={errorPresentation.title}
          description={error.message}
          actionLabel={errorPresentation.actionLabel}
          onAction={errorPresentation.onAction}
          variant={errorPresentation.variant}
        />
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div key={step} {...stepMotionProps}>
          {step === 'need' ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>What kind of care do you need?</CardTitle>
                  <CardDescription>Pick a specialty to see hospitals and doctors near you.</CardDescription>
                </div>
              </CardHeader>

              <Input
                icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                placeholder="Filter by location (optional)"
                value={locationFilter}
                onChange={setLocationFilter}
                ariaLabel="Filter by location"
              />

              <div className="mt-5">
                {specialtiesLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : specialties.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {specialties.map((specialty) => {
                      const isSelected = selectedSpecialty === specialty.name
                      const isBusy = hospitalsLoading && isSelected
                      return (
                        <button
                          key={specialty.specialty_id}
                          type="button"
                          onClick={() => handleSpecialtySelect(specialty.name)}
                          disabled={hospitalsLoading}
                          className={cn(
                            'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60',
                            isSelected
                              ? 'border-brand-300 bg-brand-50 ring-2 ring-brand-200'
                              : 'border-border bg-surface hover:border-border-strong hover:shadow-sm',
                          )}
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
                            {isBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Stethoscope className="h-4 w-4" aria-hidden="true" />
                            )}
                          </span>
                          <span className="text-sm font-semibold text-text-primary">{specialty.name}</span>
                          {specialty.description ? (
                            <span className="line-clamp-2 text-xs text-text-muted">{specialty.description}</span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No specialties available"
                    description="We could not find any specialties to show right now."
                    variant="info"
                  />
                )}
              </div>
            </Card>
          ) : null}

          {step === 'doctor' ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Hospitals</CardTitle>
                </CardHeader>
                {hospitalsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : hospitals.length > 0 ? (
                  <div className="space-y-3">
                    {hospitals.map((hospital) => (
                      <HospitalCard
                        key={hospital.hospital_id}
                        name={hospital.name}
                        location={hospital.location}
                        specialties={hospital.specialties}
                        languages={hospital.languages}
                        selected={selectedHospital?.hospital_id === hospital.hospital_id}
                        isDemoData={hospital.is_demo_data}
                        onSelect={() => handleHospitalSelect(hospital)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No hospitals found"
                    description="Try a different specialty or location."
                    actionLabel="Go back"
                    onAction={() => setStep('need')}
                    variant="warning"
                  />
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Doctors</CardTitle>
                </CardHeader>
                {doctorsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : doctors.length > 0 ? (
                  <div className="space-y-3">
                    {doctors.map((doctor) => (
                      <DoctorCard
                        key={doctor.doctor_id}
                        name={doctor.name}
                        specialty={doctor.specialty}
                        location={doctor.hospital_name}
                        availability={doctor.next_available_slot ? formatSlotLabel(doctor.next_available_slot) : 'Check availability'}
                        languages={doctor.languages}
                        selected={selectedDoctor?.doctor_id === doctor.doctor_id}
                        onSelect={() => handleDoctorSelect(doctor)}
                      />
                    ))}
                  </div>
                ) : selectedHospital ? (
                  <p className="text-sm text-text-secondary">No doctors to show for this hospital yet.</p>
                ) : (
                  <p className="text-sm text-text-secondary">Select a hospital to see available doctors.</p>
                )}
              </Card>
            </div>
          ) : null}

          {step === 'time' ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Available times</CardTitle>
                  {selectedDoctor ? (
                    <CardDescription>
                      with {selectedDoctor.name} at {selectedDoctor.hospital_name}
                    </CardDescription>
                  ) : null}
                </div>
              </CardHeader>

              {slots.length > 0 ? (
                <div className="space-y-6">
                  {groupSlots(slots).map((dateGroup) => (
                    <div key={dateGroup.date}>
                      <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDateHeading(dateGroup.date)}
                      </p>
                      <div className="space-y-4">
                        {dateGroup.periods.map(({ period, slots: periodSlots }) => (
                          <div key={period}>
                            <p className="mb-2 text-xs font-medium text-text-secondary">{period}</p>
                            <div className="flex flex-wrap gap-2.5">
                              {periodSlots.map((slot) => (
                                <SlotCard
                                  key={slot.slot_id}
                                  time={slotTimeRange(slot)}
                                  selected={selectedSlot?.slot_id === slot.slot_id}
                                  onSelect={() => handleSlotSelect(slot)}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No slots available"
                  description="This doctor has no open times. Try another doctor."
                  actionLabel="Back to doctors"
                  onAction={() => setStep('doctor')}
                  variant="warning"
                />
              )}

              {showRescheduleMode && selectedSlot ? (
                <div className="mt-5">
                  <Button onClick={handleReschedule} loading={loading}>
                    Confirm new time
                  </Button>
                </div>
              ) : null}
            </Card>
          ) : null}

          {step === 'confirm' && selectedDoctor && selectedSlot ? (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Review your appointment</CardTitle>
                </CardHeader>
                <AppointmentCard
                  title="Appointment summary"
                  doctorName={selectedDoctor.name}
                  specialty={selectedDoctor.specialty}
                  hospitalName={selectedDoctor.hospital_name}
                  date={selectedSlot.date}
                  time={slotTimeRange(selectedSlot)}
                  location={selectedDoctor.location}
                />
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>What happens next?</CardTitle>
                </CardHeader>
                <p className="text-sm text-text-secondary">
                  Confirming will book this slot. You will receive a confirmation message.
                </p>
                <div className="mt-5 flex flex-col gap-2.5">
                  <Button size="lg" onClick={() => setShowConfirmDialog(true)}>
                    Confirm appointment
                  </Button>
                  <Button variant="secondary" onClick={() => setStep('time')}>
                    Change time
                  </Button>
                </div>
              </Card>
            </div>
          ) : null}

          {step === 'success' && bookedAppointment ? (
            <div className="space-y-5">
              <Alert title="Appointment confirmed" variant="success">
                Your appointment has been booked successfully.
              </Alert>
              <AppointmentCard
                title="Confirmed appointment"
                doctorName={bookedAppointment.doctor.name}
                specialty={bookedAppointment.doctor.specialty}
                hospitalName={bookedAppointment.hospital.name}
                date={bookedAppointment.slot.date}
                time={slotTimeRange(bookedAppointment.slot)}
                location={bookedAppointment.hospital.location}
                bookingId={bookedAppointment.booking_id}
                status="confirmed"
              />
              <Card>
                <p className="text-sm text-text-secondary">
                  Notification: <strong className="text-text-primary">{notificationStatus}</strong>
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2.5">
                    <Button size="lg" onClick={resetFlow}>
                      Book another appointment
                    </Button>
                    <Button variant="secondary" onClick={startReschedule}>
                      Reschedule
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-start text-critical-700 hover:bg-critical-50 hover:text-critical-700 sm:self-auto"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancel appointment
                  </Button>
                </div>
              </Card>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <ConfirmationDialog
        open={showConfirmDialog}
        title="Confirm your appointment"
        confirmLabel="Yes, book this appointment"
        onConfirm={handleConfirmBooking}
        onCancel={() => setShowConfirmDialog(false)}
        loading={loading}
      >
        <p>
          You are booking with <strong>{selectedDoctor?.name}</strong> ({selectedDoctor?.specialty}) at{' '}
          <strong>{selectedDoctor?.hospital_name}</strong> on <strong>{selectedSlot?.date}</strong> at{' '}
          <strong>{selectedSlot?.start_time.slice(0, 5)}</strong>.
        </p>
      </ConfirmationDialog>

      <ConfirmationDialog
        open={showCancelDialog}
        title="Cancel this appointment?"
        confirmLabel="Yes, cancel"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
        loading={loading}
        destructive
      >
        <p>This will release your time slot so others can book it.</p>
      </ConfirmationDialog>

      <PhoneAuthModal
        open={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          setPendingAction(null)
        }}
        onVerified={() => {
          pendingAction?.()
          setPendingAction(null)
        }}
      />
    </PageContainer>
  )
}
