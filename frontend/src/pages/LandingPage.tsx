import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/shared/PageContainer'
import { PageHeader } from '../components/shared/PageHeader'

export default function LandingPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Home"
        title="Accessible care guidance for rural communities"
        description="A calm, multilingual health navigation experience designed for first-time digital users and care teams."
        actions={
          <>
            <Button variant="secondary">Book a doctor</Button>
            <Button>Start a conversation</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="bg-sky-50/40">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Care journey</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">Start with the right next step</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            RuralCare AI helps users understand symptoms, route to the right level of care, and navigate appointments without overwhelming the conversation.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button>Start a conversation</Button>
            <Button variant="secondary">Book a doctor</Button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-sky-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Channel</p>
              <p className="mt-2 text-base font-semibold text-slate-900">Chat</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Voice</p>
              <p className="mt-2 text-base font-semibold text-slate-900">Available</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Language</p>
              <p className="mt-2 text-base font-semibold text-slate-900">English + Hindi</p>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trust layer</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>• AI assistant</li>
            <li>• Evidence-grounded guidance</li>
            <li>• Human escalation available</li>
            <li>• Safety-aware routing</li>
          </ul>
        </Card>
      </div>
    </PageContainer>
  )
}
