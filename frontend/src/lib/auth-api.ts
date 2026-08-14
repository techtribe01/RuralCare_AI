import { API_BASE_URL } from '../config/api'
import type { ApiError } from '../types/appointments'

const BASE = `${API_BASE_URL.replace(/\/$/, '')}/api/auth`

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    credentials: 'include',
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

export type SessionInfo =
  | { is_authenticated: false }
  | { is_authenticated: true; user_id: string; phone_verified: boolean }

export async function sendOtp(phoneNumber: string): Promise<void> {
  await request<{ status: string }>('/send-otp', { method: 'POST', body: JSON.stringify({ phone_number: phoneNumber }) })
}

export async function verifyOtp(phoneNumber: string, code: string): Promise<{ verified: boolean; user_id: string }> {
  return request('/verify-otp', { method: 'POST', body: JSON.stringify({ phone_number: phoneNumber, code }) })
}

export async function getSession(): Promise<SessionInfo> {
  return request<SessionInfo>('/session')
}

export async function logout(): Promise<void> {
  await request<{ status: string }>('/logout', { method: 'POST' })
}
