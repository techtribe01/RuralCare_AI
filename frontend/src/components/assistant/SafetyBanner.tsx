import { NavLink } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Alert } from '../ui/Alert'
import type { RiskLevel } from '../../types/chat'

type SafetyBannerProps = {
  riskLevel?: RiskLevel | null
  humanEscalationRequired?: boolean
  reasonCode?: string | null
}

/**
 * Renders the appropriate safety-state UI for an assistant turn based on the
 * response risk level. `low` renders nothing. `moderate`/`high` render an
 * inline Alert. `emergency` (or human_escalation_required) renders a dedicated
 * interstitial that is intentionally NOT chat-bubble shaped, so it reads as a
 * structurally distinct, directive moment rather than another message.
 */
export function SafetyBanner({ riskLevel, humanEscalationRequired, reasonCode }: SafetyBannerProps) {
  const isEmergency = riskLevel === 'emergency' || humanEscalationRequired === true

  if (isEmergency) {
    return (
      <div role="alert" className="rounded-xl border border-critical-100 bg-critical-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-critical-600 text-white">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-critical-700">This may need urgent care</p>
            <p className="mt-1 text-sm leading-relaxed text-critical-700">
              Based on what you&apos;ve shared, please seek in-person medical attention promptly or contact your local
              emergency services.
              {reasonCode ? ` Reference: ${reasonCode.replaceAll('_', ' ')}.` : ''}
            </p>
            <div className="mt-4">
              <NavLink
                to="/help-safety"
                className="inline-flex min-h-[40px] items-center rounded-lg bg-critical-600 px-4 text-sm font-medium text-white hover:bg-critical-700"
              >
                View safety guidance
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (riskLevel === 'high') {
    return (
      <Alert variant="danger" title="Elevated risk detected">
        This pattern warrants prompt medical evaluation. Please consult a doctor or visit urgent care as soon as
        possible.
      </Alert>
    )
  }

  if (riskLevel === 'moderate') {
    return (
      <Alert variant="warning" title="Care recommendation">
        Consider scheduling a visit with a doctor to have this checked, and keep monitoring your symptoms in the
        meantime.
      </Alert>
    )
  }

  return null
}
