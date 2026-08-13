export type Specialty = {
  specialty_id: string
  name: string
  description: string
  status: string
}

export type Hospital = {
  hospital_id: string
  name: string
  location: string
  hospital_type: string
  specialties: string[]
  languages: string[]
  contact: string
  status: string
  is_demo_data: boolean
  data_label: string
}

export type Doctor = {
  doctor_id: string
  name: string
  specialty: string
  hospital_id: string
  hospital_name: string
  location: string
  experience_years: number
  languages: string[]
  consultation_type: string
  next_available_slot: Slot | null
  status: string
  is_demo_data: boolean
  data_label: string
}

export type Slot = {
  slot_id: string
  doctor_id: string
  date: string
  start_time: string
  end_time: string
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'CANCELLED'
  is_demo_data: boolean
}

export type Appointment = {
  appointment_id: string
  booking_id: string
  user_id: string
  status: string
  doctor: Doctor
  hospital: Hospital
  slot: Slot
  created_at: string
  confirmed_at: string | null
  cancelled_at: string | null
  channel: string
  is_demo_data: boolean
  data_label: string
}

export type NotificationResult = {
  channel: string
  status: string
  message: string
  demo_mode: boolean
}

export type ApiError = {
  code: string
  message: string
}

export type AppointmentStep = 'need' | 'doctor' | 'time' | 'confirm' | 'success'

export type AppointmentPayload =
  | { type: 'collect_specialty'; specialties: string[] }
  | { type: 'hospital_options'; hospitals: Hospital[] }
  | { type: 'doctor_options'; doctors: Doctor[] }
  | { type: 'slot_options'; doctor_id: string; slots: Slot[] }
  | { type: 'confirm'; proposed: Record<string, string | null> }
  | { type: 'booked'; appointment: Appointment; notification: NotificationResult }
  | { type: 'no_hospitals_found' }
  | { type: 'no_doctors_found' }
  | { type: 'no_slots_available' }
  | { type: 'booking_failed'; reason: string }
  | { type: 'cancelled_by_user' }
