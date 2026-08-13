import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/shared/PageContainer'
import { PageHeader } from '../components/shared/PageHeader'

export default function HelpSafetyPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Help & Safety"
        title="What the assistant can and cannot do"
        description="Focused safety and trust guidance for patient-facing interactions."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Scope</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>• Provide general health information from approved sources</li>
            <li>• Guide users to the next appropriate care step</li>
            <li>• Facilitate navigation to doctors and appointments</li>
            <li>• Escalate urgent cases to human review</li>
          </ul>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Limits</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>• Not a diagnosis engine</li>
            <li>• Not a replacement for clinical care</li>
            <li>• No autonomous emergency dispatch decisions</li>
            <li>• Stage 2 will define production safety policies</li>
          </ul>
        </Card>
      </div>

      <Alert title="Urgent guidance" variant="danger">
        In a medical emergency, contact local emergency services or seek urgent care immediately. This Stage 1 view is a placeholder for future safety policy handling.
      </Alert>
    </PageContainer>
  )
}
