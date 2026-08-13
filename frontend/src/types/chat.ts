export type LanguageCode = 'en' | 'te'

export type IntentLabel =
  | 'health_information'
  | 'symptom_guidance'
  | 'appointment_booking'
  | 'hospital_search'
  | 'doctor_search'
  | 'general_information'
  | 'emergency'
  | 'human_escalation'

export type AgentEventStatus = 'pending' | 'running' | 'completed' | 'failed'

export type AgentEvent = {
  node: string
  status: AgentEventStatus
  timestamp: string
  duration_ms?: number | null
  detail?: string | null
}

import type { AppointmentPayload } from './appointments'

export type RiskLevel = 'low' | 'moderate' | 'high' | 'emergency'

export type SourceReference = {
  document_id: string
  title: string
  source: string
  version: string
  topic: string
  section?: string | null
  relevance: number
}

export type ChatRequest = {
  session_id?: string
  message: string
  language?: LanguageCode
  selected_hospital_id?: string
  selected_doctor_id?: string
  selected_slot_id?: string
  confirm_booking?: boolean
}

export type ChatResponse = {
  session_id: string
  message: string
  language: LanguageCode
  intent: IntentLabel
  risk_level?: RiskLevel | null
  safety_reason_code?: string | null
  human_escalation_required?: boolean
  sources?: SourceReference[]
  appointment?: AppointmentPayload | null
  agent_events: AgentEvent[]
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  timestamp: string
}

