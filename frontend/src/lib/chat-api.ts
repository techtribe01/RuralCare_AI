import { CHAT_ENDPOINT } from '../config/api'
import type { ChatRequest, ChatResponse } from '../types/chat'

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = 'We could not reach the assistant right now.'
    try {
      const data = (await response.json()) as { detail?: string }
      if (typeof data.detail === 'string' && data.detail.trim()) {
        message = data.detail
      }
    } catch {
      // Keep the generic message when the body is not JSON.
    }
    throw new Error(message)
  }

  return (await response.json()) as ChatResponse
}

