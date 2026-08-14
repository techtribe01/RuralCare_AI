import { CheckCircle2, XCircle, ShieldCheck, Stethoscope, Lock } from 'lucide-react'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { PageContainer } from '../components/shared/PageContainer'
import { PageHeader } from '../components/shared/PageHeader'

const CAN_HELP_WITH = [
  'Provide general health information from approved sources',
  'Guide you to the next appropriate care step for your situation',
  'Help you find doctors, hospitals, and available appointment times',
  'Escalate urgent cases so a human can review them',
]

const CANNOT_DO = [
  'Diagnose a medical condition',
  'Replace a clinical visit, exam, or prescription from a doctor',
  'Make autonomous emergency dispatch decisions',
  'Guarantee outcomes — future stages will refine production safety policy',
]

const RISK_LEVELS: Array<{
  level: string
  badge: 'success' | 'warning' | 'danger'
  description: string
}> = [
  {
    level: 'Low',
    badge: 'success',
    description: 'General questions and information requests are answered directly, with sources where relevant.',
  },
  {
    level: 'Moderate',
    badge: 'warning',
    description: 'The assistant recommends a specific next step, such as seeing a doctor within a few days.',
  },
  {
    level: 'High',
    badge: 'warning',
    description: 'The assistant urges prompt in-person care and surfaces care navigation options right away.',
  },
  {
    level: 'Emergency',
    badge: 'danger',
    description: 'The assistant tells you to contact local emergency services immediately and flags the conversation for human escalation.',
  },
]

export default function HelpSafetyPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Help & Safety"
        title="What RuralCare AI can and cannot do"
        description="Clear, honest guidance so you know what to expect from the assistant — and when to involve a human."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success-600" aria-hidden="true" />
                What it can help with
              </CardTitle>
            </div>
          </CardHeader>
          <ul className="space-y-3 text-sm text-text-secondary">
            {CAN_HELP_WITH.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-critical-600" aria-hidden="true" />
                What it cannot do
              </CardTitle>
            </div>
          </CardHeader>
          <ul className="space-y-3 text-sm text-text-secondary">
            {CANNOT_DO.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-critical-600" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden="true" />
              How safety works
            </CardTitle>
            <CardDescription>
              Every response is screened for urgency. The assistant routes each conversation to one of four risk
              levels, and responds accordingly.
            </CardDescription>
          </div>
        </CardHeader>
        <div className="space-y-4">
          {RISK_LEVELS.map((item) => (
            <div key={item.level} className="flex items-start gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
              <Badge variant={item.badge} className="mt-0.5 shrink-0">
                {item.level}
              </Badge>
              <p className="text-sm leading-relaxed text-text-secondary">{item.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-brand-700" aria-hidden="true" />
              When to seek professional help
            </CardTitle>
          </div>
        </CardHeader>
        <p className="text-sm leading-relaxed text-text-secondary">
          If your symptoms are severe, worsening, or you are unsure, see a doctor or visit the nearest hospital
          rather than relying solely on the assistant. RuralCare AI is a guide to the next step in care — it is not
          a substitute for a clinical evaluation.
        </p>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-text-muted" aria-hidden="true" />
              Privacy &amp; data
            </CardTitle>
          </div>
        </CardHeader>
        <p className="text-sm leading-relaxed text-text-secondary">
          This is a Stage 1 showcase build. Conversations and appointment data shown here are demo data used to
          illustrate the product experience, and production data-handling and privacy policies will be defined in a
          later stage.
        </p>
      </Card>

      <Alert title="In an emergency" variant="danger">
        If you or someone else is experiencing a medical emergency, contact local emergency services or go to the
        nearest emergency room immediately. Do not wait for a response from the assistant.
      </Alert>
    </PageContainer>
  )
}
