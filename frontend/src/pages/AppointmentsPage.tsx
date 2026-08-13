import { useCallback, useEffect, useState } from 'react'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
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
import { useChatSession } from '../app/ChatSessionContext'
import type { ApiError, Appointment, AppointmentStep, Doctor, Hospital, Slot, Specialty } from '../types/appointments'

export default function AppointmentsPage() {
  const { sessionId: userId } = useChatSession()

  const [step, setStep] = useState<AppointmentStep>('need')
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [locationFilter, setLocationFilter] = useState('')
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
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

  useEffect(() => {
    fetchSpecialties()
      .then(setSpecialties)
      .catch(() => setError({ code: 'service_unavailable', message: 'We could not load specialties. Please try again.' }))
  }, [])

  const resetFlow = useCallback(() => {
    setStep('need')
    setSelectedSpecialty(null)
    setLocationFilter('')
    setHospitals([])
    setSelectedHospital(null)
    setDoctors([])
    setSelectedDoctor(null)
    setSlots([])
    setSelectedSlot(null)
    setBookedAppointment(null)
    setShowRescheduleMode(false)
    setError(null)
  }, [])

  const handleSpecialtySelect = async (specialtyName: string) => {
    setSelectedSpecialty(specialtyName)
    setLoading(true)
    setError(null)
    try {
      const hospitalResults = await searchHospitals({ specialty: specialtyName, location: locationFilter || undefined })
      setHospitals(hospitalResults)
      setStep('doctor')
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }

  const handleHospitalSelect = async (hospital: Hospital) => {
    setSelectedHospital(hospital)
    setLoading(true)
    setError(null)
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
      setLoading(false)
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

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedSlot) return
    setLoading(true)
    setError(null)
    try {
      const appointment = await bookAppointment({
        user_id: userId,
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
  }

  const handleCancel = async () => {
    if (!bookedAppointment) return
    setLoading(true)
    try {
      await cancelAppointment(bookedAppointment.appointment_id, { user_id: userId, confirmation: true })
      setShowCancelDialog(false)
      resetFlow()
    } catch (err) {
      setError(err as ApiError)
      setShowCancelDialog(false)
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!bookedAppointment || !selectedSlot) return
    setLoading(true)
    try {
      const updated = await rescheduleAppointment(bookedAppointment.appointment_id, {
        user_id: userId,
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
  }

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

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Appointments"
        title="Book a doctor visit"
        description="Find a doctor, choose a time, and confirm your appointment step by step."
        actions={<StatusBadge status="demo" />}
      />

      <Card className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your progress</p>
        <div className="mt-3">
          <StepIndicator currentStep={step} />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {step === 'need' && 'Tell us what kind of care you need.'}
          {step === 'doctor' && 'Choose a hospital and doctor.'}
          {step === 'time' && 'Pick an available time.'}
          {step === 'confirm' && 'Review and confirm your appointment.'}
          {step === 'success' && 'Your appointment is confirmed.'}
        </p>
      </Card>

      {error ? (
        <div className="mb-6">
          <EmptyState
            title={
              error.code === 'no_doctors_found'
                ? 'No doctors found'
                : error.code === 'no_slots_available' || error.code === 'slot_unavailable'
                  ? 'No slots available'
                  : error.code === 'service_unavailable'
                    ? 'Service unavailable'
                    : 'Something went wrong'
            }
            description={error.message}
            actionLabel={error.code === 'slot_unavailable' ? 'Choose another time' : 'Start over'}
            onAction={() => {
              if (error.code === 'slot_unavailable') {
                setError(null)
                setStep('time')
              } else {
                resetFlow()
              }
            }}
            variant={error.code === 'service_unavailable' ? 'danger' : 'warning'}
          />
        </div>
      ) : null}

      {step === 'need' ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What do you need?</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Filter by location (optional)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            {specialties.map((specialty) => (
              <Button key={specialty.specialty_id} variant="secondary" loading={loading && selectedSpecialty === specialty.name} onClick={() => handleSpecialtySelect(specialty.name)}>
                {specialty.name}
              </Button>
            ))}
          </div>
        </Card>
      ) : null}

      {step === 'doctor' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          {hospitals.length > 0 ? (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hospitals</p>
              <div className="mt-4 space-y-3">
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
            </Card>
          ) : (
            <EmptyState
              title="No hospitals found"
              description="Try a different specialty or location."
              actionLabel="Go back"
              onAction={() => setStep('need')}
            />
          )}

          {doctors.length > 0 ? (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Doctors</p>
              <div className="mt-4 space-y-3">
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
            </Card>
          ) : selectedHospital ? (
            <Card>
              <p className="text-sm text-slate-600">Select a hospital to see available doctors.</p>
            </Card>
          ) : null}
        </div>
      ) : null}

      {step === 'time' ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Available times</p>
          {selectedDoctor ? (
            <p className="mt-2 text-sm text-slate-600">
              with {selectedDoctor.name} at {selectedDoctor.hospital_name}
            </p>
          ) : null}
          {slots.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {slots.map((slot) => (
                <SlotCard
                  key={slot.slot_id}
                  time={formatSlotLabel(slot)}
                  selected={selectedSlot?.slot_id === slot.slot_id}
                  onSelect={() => handleSlotSelect(slot)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState title="No slots available" description="This doctor has no open times. Try another doctor." actionLabel="Back to doctors" onAction={() => setStep('doctor')} />
            </div>
          )}
          {showRescheduleMode && selectedSlot ? (
            <div className="mt-4">
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review your appointment</p>
            <div className="mt-4">
              <AppointmentCard
                title="Appointment summary"
                doctorName={selectedDoctor.name}
                specialty={selectedDoctor.specialty}
                hospitalName={selectedDoctor.hospital_name}
                date={selectedSlot.date}
                time={`${selectedSlot.start_time.slice(0, 5)} – ${selectedSlot.end_time.slice(0, 5)}`}
                location={selectedDoctor.location}
              />
            </div>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What happens next?</p>
            <p className="mt-3 text-sm text-slate-600">Confirming will book this slot. You will receive a confirmation message.</p>
            <div className="mt-4 flex gap-3">
              <Button onClick={() => setShowConfirmDialog(true)}>Confirm appointment</Button>
              <Button variant="secondary" onClick={() => setStep('time')}>
                Change time
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {step === 'success' && bookedAppointment ? (
        <div className="space-y-5">
          <Alert title="✓ Appointment Confirmed" variant="success">
            Your appointment has been booked successfully.
          </Alert>
          <AppointmentCard
            title="Confirmed appointment"
            doctorName={bookedAppointment.doctor.name}
            specialty={bookedAppointment.doctor.specialty}
            hospitalName={bookedAppointment.hospital.name}
            date={bookedAppointment.slot.date}
            time={`${bookedAppointment.slot.start_time.slice(0, 5)} – ${bookedAppointment.slot.end_time.slice(0, 5)}`}
            location={bookedAppointment.hospital.location}
            bookingId={bookedAppointment.booking_id}
            status="confirmed"
          />
          <Card>
            <p className="text-sm text-slate-600">
              Notification: <strong>{notificationStatus}</strong>
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={startReschedule}>
                Reschedule
              </Button>
              <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                Cancel
              </Button>
              <Button variant="ghost" onClick={resetFlow}>
                Book another
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

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
    </PageContainer>
  )
}
