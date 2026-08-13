import { API_BASE_URL } from '../config/api'
import type { ApiError, Appointment, Doctor, Hospital, NotificationResult, Slot, Specialty } from '../types/appointments'

const BASE = `${API_BASE_URL.replace(/\/$/, '')}/appointments`

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })

  if (!response.ok) {
    let error: ApiError = { code: 'request_failed', message: 'Something went wrong. Please try again.' }
    try {
      const data = (await response.json()) as { detail?: ApiError | string }
      if (typeof data.detail === 'object' && data.detail?.message) {
        error = data.detail
      } else if (typeof data.detail === 'string') {
        error = { code: 'request_failed', message: data.detail }
      }
    } catch {
      // Keep generic message.
    }
    throw error
  }

  return (await response.json()) as T
}

export async function fetchSpecialties(): Promise<Specialty[]> {
  return request<Specialty[]>('/specialties')
}

export async function searchHospitals(params: {
  location?: string
  specialty?: string
  hospital_type?: string
  language?: string
}): Promise<Hospital[]> {
  const query = new URLSearchParams()
  if (params.location) query.set('location', params.location)
  if (params.specialty) query.set('specialty', params.specialty)
  if (params.hospital_type) query.set('hospital_type', params.hospital_type)
  if (params.language) query.set('language', params.language)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return request<Hospital[]>(`/hospitals${suffix}`)
}

export async function searchDoctors(params: {
  specialty?: string
  location?: string
  hospital_id?: string
  language?: string
  date?: string
}): Promise<Doctor[]> {
  const query = new URLSearchParams()
  if (params.specialty) query.set('specialty', params.specialty)
  if (params.location) query.set('location', params.location)
  if (params.hospital_id) query.set('hospital_id', params.hospital_id)
  if (params.language) query.set('language', params.language)
  if (params.date) query.set('date', params.date)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return request<Doctor[]>(`/doctors${suffix}`)
}

export async function checkSlots(params: { doctor_id: string; date?: string }): Promise<Slot[]> {
  const query = new URLSearchParams({ doctor_id: params.doctor_id })
  if (params.date) query.set('date', params.date)
  return request<Slot[]>(`/slots?${query.toString()}`)
}

export async function bookAppointment(payload: {
  user_id: string
  doctor_id: string
  hospital_id: string
  slot_id: string
  confirmation: boolean
  channel?: string
}): Promise<Appointment> {
  return request<Appointment>('/book', { method: 'POST', body: JSON.stringify(payload) })
}

export async function cancelAppointment(appointmentId: string, payload: { user_id: string; confirmation: boolean }): Promise<Appointment> {
  return request<Appointment>(`/${appointmentId}/cancel`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function rescheduleAppointment(
  appointmentId: string,
  payload: { user_id: string; new_slot_id: string; confirmation: boolean },
): Promise<Appointment> {
  return request<Appointment>(`/${appointmentId}/reschedule`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function listAppointments(userId: string): Promise<Appointment[]> {
  return request<Appointment[]>(`?user_id=${encodeURIComponent(userId)}`)
}

export async function fetchAppointmentNotifications(appointmentId: string): Promise<NotificationResult[]> {
  return request<NotificationResult[]>(`/${appointmentId}/notifications`)
}

export function formatSlotTime(slot: Slot): string {
  return `${slot.date} · ${slot.start_time.slice(0, 5)}`
}

export function formatSlotLabel(slot: Slot): string {
  const date = new Date(`${slot.date}T${slot.start_time}`)
  const day = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const time = slot.start_time.slice(0, 5)
  return `${day}, ${time}`
}
