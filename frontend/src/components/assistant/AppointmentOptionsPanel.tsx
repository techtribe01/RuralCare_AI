import { CheckCircle2 } from 'lucide-react'
import type { AppointmentPayload } from '../../types/appointments'
import type { Doctor, Hospital, Slot } from '../../types/appointments'
import { formatSlotLabel } from '../../lib/appointments-api'
import { DoctorCard } from '../appointments/DoctorCard'
import { EmptyState } from '../appointments/EmptyState'
import { HospitalCard } from '../appointments/HospitalCard'
import { SlotCard } from '../appointments/SlotCard'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type AppointmentOptionsPanelProps = {
  payload: AppointmentPayload
  onSelectSpecialty?: (specialty: string) => void
  onSelectHospital?: (hospitalId: string) => void
  onSelectDoctor?: (doctorId: string) => void
  onSelectSlot?: (slotId: string) => void
  onConfirmBooking?: () => void
  onVerifyPhone?: () => void
}

export function AppointmentOptionsPanel({
  payload,
  onSelectSpecialty,
  onSelectHospital,
  onSelectDoctor,
  onSelectSlot,
  onConfirmBooking,
  onVerifyPhone,
}: AppointmentOptionsPanelProps) {
  if (payload.type === 'collect_specialty') {
    return (
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">What type of doctor do you need?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {payload.specialties.map((specialty) => (
            <Button key={specialty} variant="secondary" size="sm" onClick={() => onSelectSpecialty?.(specialty)}>
              {specialty}
            </Button>
          ))}
        </div>
      </Card>
    )
  }

  if (payload.type === 'hospital_options') {
    return (
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Choose a hospital</p>
        <div className="mt-3 space-y-2">
          {payload.hospitals.map((hospital: Hospital) => (
            <HospitalCard
              key={hospital.hospital_id}
              name={hospital.name}
              location={hospital.location}
              specialties={hospital.specialties}
              languages={hospital.languages}
              isDemoData={hospital.is_demo_data}
              onSelect={() => onSelectHospital?.(hospital.hospital_id)}
            />
          ))}
        </div>
      </Card>
    )
  }

  if (payload.type === 'doctor_options') {
    return (
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Choose a doctor</p>
        <div className="mt-3 space-y-2">
          {payload.doctors.map((doctor: Doctor) => (
            <DoctorCard
              key={doctor.doctor_id}
              name={doctor.name}
              specialty={doctor.specialty}
              location={doctor.hospital_name}
              availability={doctor.next_available_slot ? formatSlotLabel(doctor.next_available_slot) : 'Available'}
              languages={doctor.languages}
              onSelect={() => onSelectDoctor?.(doctor.doctor_id)}
            />
          ))}
        </div>
      </Card>
    )
  }

  if (payload.type === 'slot_options') {
    return (
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Choose a time</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {payload.slots.map((slot: Slot) => (
            <SlotCard key={slot.slot_id} time={formatSlotLabel(slot)} onSelect={() => onSelectSlot?.(slot.slot_id)} />
          ))}
        </div>
      </Card>
    )
  }

  if (payload.type === 'confirm') {
    const proposed = payload.proposed
    return (
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Confirm your appointment</p>
        <ul className="mt-3 space-y-1 text-sm text-text-secondary">
          <li>Doctor: {proposed.doctor_name}</li>
          <li>Specialty: {proposed.specialty}</li>
          <li>Hospital: {proposed.hospital_name}</li>
          <li>Date: {proposed.date}</li>
          <li>Time: {proposed.start_time}</li>
        </ul>
        <div className="mt-4">
          <Button onClick={onConfirmBooking}>Confirm booking</Button>
        </div>
      </Card>
    )
  }

  if (payload.type === 'auth_required') {
    return (
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Verify your mobile number</p>
        <p className="mt-2 text-sm text-text-secondary">
          Before I can book this appointment, I need to verify your mobile number with a quick SMS code.
        </p>
        <div className="mt-4">
          <Button onClick={onVerifyPhone}>Verify mobile number</Button>
        </div>
      </Card>
    )
  }

  if (payload.type === 'booked') {
    const appt = payload.appointment
    return (
      <Card>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-success-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Appointment confirmed
        </p>
        <ul className="mt-3 space-y-1 text-sm text-text-secondary">
          <li>Doctor: {appt.doctor.name}</li>
          <li>Specialty: {appt.doctor.specialty}</li>
          <li>Hospital: {appt.hospital.name}</li>
          <li>Date: {appt.slot.date}</li>
          <li>Time: {appt.slot.start_time}</li>
          <li>Booking ID: {appt.booking_id}</li>
          <li>Notification: {payload.notification.demo_mode ? 'Demo mode' : 'Sent'}</li>
        </ul>
      </Card>
    )
  }

  if (payload.type === 'no_hospitals_found') {
    return (
      <EmptyState
        variant="warning"
        title="No hospitals found"
        description="We couldn't find a hospital matching that request. Try a different specialty or location."
      />
    )
  }

  if (payload.type === 'no_doctors_found') {
    return (
      <EmptyState
        variant="warning"
        title="No doctors available"
        description="No doctors matched that specialty right now. Try a different specialty or hospital."
      />
    )
  }

  if (payload.type === 'no_slots_available') {
    return (
      <EmptyState
        variant="warning"
        title="No time slots available"
        description="This doctor has no open slots at the moment. Try another doctor or check back later."
      />
    )
  }

  if (payload.type === 'booking_failed') {
    return <EmptyState variant="danger" title="Booking could not be completed" description={payload.reason} />
  }

  if (payload.type === 'cancelled_by_user') {
    return (
      <EmptyState
        variant="info"
        title="Booking cancelled"
        description="No appointment was booked. Let me know if you'd like to start over."
      />
    )
  }

  return null
}
