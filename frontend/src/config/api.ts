const defaultBaseUrl = 'http://localhost:8000'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || defaultBaseUrl

export const CHAT_ENDPOINT = `${API_BASE_URL.replace(/\/$/, '')}/chat`

