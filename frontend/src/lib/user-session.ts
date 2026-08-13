const USER_SESSION_KEY = 'ruralcare-ai-user-id'
const LEGACY_SESSION_KEY = 'ruralcare-ai-session-id'

/** Single stable ID for chat sessions and appointment ownership.

The backend stores appointments under AgentState.user_id, which is the chat
session_id. Every surface (Assistant, Appointments, Activity) must use the
same value or bookings made in chat will not appear in history.
*/
export function getOrCreateUserSessionId(): string {
  const stored = window.localStorage.getItem(USER_SESSION_KEY)
  if (stored) return stored

  const legacy = window.localStorage.getItem(LEGACY_SESSION_KEY)
  if (legacy) {
    window.localStorage.setItem(USER_SESSION_KEY, legacy)
    window.localStorage.removeItem(LEGACY_SESSION_KEY)
    return legacy
  }

  const next = globalThis.crypto?.randomUUID?.() ?? `user-${Date.now()}`
  window.localStorage.setItem(USER_SESSION_KEY, next)
  return next
}
