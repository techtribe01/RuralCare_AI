import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { sendChatMessage } from '../lib/chat-api'
import { getOrCreateUserSessionId } from '../lib/user-session'
import type { AgentEvent, ChatMessage, ChatResponse, LanguageCode } from '../types/chat'
import type { AppointmentPayload } from '../types/appointments'

type ChatSelection = {
  selected_hospital_id?: string
  selected_doctor_id?: string
  selected_slot_id?: string
  confirm_booking?: boolean
}

type ChatSessionContextValue = {
  sessionId: string
  messages: ChatMessage[]
  latestResponse: ChatResponse | null
  latestEvents: AgentEvent[]
  latestAppointment: AppointmentPayload | null
  currentLanguage: LanguageCode
  currentIntent: string | null
  isThinking: boolean
  error: string | null
  sendMessage: (message: string, selection?: ChatSelection) => Promise<void>
  clearError: () => void
}

const ChatSessionContext = createContext<ChatSessionContextValue | undefined>(undefined)

function createTimestamp() {
  return new Date().toISOString()
}

function createMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `msg-${Date.now()}-${Math.random()}`
}

export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState(() => getOrCreateUserSessionId())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [latestResponse, setLatestResponse] = useState<ChatResponse | null>(null)
  const [latestEvents, setLatestEvents] = useState<AgentEvent[]>([])
  const [latestAppointment, setLatestAppointment] = useState<AppointmentPayload | null>(null)
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en')
  const [currentIntent, setCurrentIntent] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.localStorage.setItem('ruralcare-ai-user-id', sessionId)
  }, [sessionId])

  const clearError = useCallback(() => setError(null), [])

  const sendMessage = useCallback(
    async (message: string, selection?: ChatSelection) => {
      const trimmed = message.trim()
      const hasSelection = Boolean(
        selection?.selected_hospital_id || selection?.selected_doctor_id || selection?.selected_slot_id || selection?.confirm_booking,
      )

      if (!trimmed && !hasSelection) {
        setError('Please enter a message.')
        return
      }

      const displayText = trimmed || (selection?.confirm_booking ? 'YES' : 'Selected')

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        text: displayText,
        timestamp: createTimestamp(),
      }

      setMessages((current) => [...current, userMessage])
      setIsThinking(true)
      setError(null)

      try {
        const effectiveMessage =
          trimmed ||
          (selection?.confirm_booking ? 'YES' : selection?.selected_slot_id ? 'Selected time' : selection?.selected_doctor_id ? 'Selected doctor' : selection?.selected_hospital_id ? 'Selected hospital' : '')

        const response = await sendChatMessage({
          session_id: sessionId,
          message: effectiveMessage,
          language: currentLanguage,
          ...selection,
        })

        setSessionId(response.session_id)
        setCurrentLanguage(response.language)
        setCurrentIntent(response.intent)
        setLatestResponse(response)
        setLatestEvents(response.agent_events)
        setLatestAppointment(response.appointment ?? null)
        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: 'assistant',
            text: response.message,
            timestamp: createTimestamp(),
          },
        ])
      } catch (requestError) {
        const messageText = requestError instanceof Error ? requestError.message : 'We could not reach the assistant right now.'
        setError(messageText)
        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: 'system',
            text: messageText,
            timestamp: createTimestamp(),
          },
        ])
      } finally {
        setIsThinking(false)
      }
    },
    [currentLanguage, sessionId],
  )

  const value = useMemo<ChatSessionContextValue>(
    () => ({
      sessionId,
      messages,
      latestResponse,
      latestEvents,
      latestAppointment,
      currentLanguage,
      currentIntent,
      isThinking,
      error,
      sendMessage,
      clearError,
    }),
    [clearError, currentIntent, currentLanguage, error, isThinking, latestAppointment, latestEvents, latestResponse, messages, sendMessage, sessionId],
  )

  return <ChatSessionContext.Provider value={value}>{children}</ChatSessionContext.Provider>
}

export function useChatSession() {
  const context = useContext(ChatSessionContext)
  if (!context) {
    throw new Error('useChatSession must be used within a ChatSessionProvider')
  }
  return context
}
