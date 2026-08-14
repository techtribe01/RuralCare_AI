import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { MessageSquareText, Phone, MessageSquare, ShieldCheck, Languages, Route } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { PageContainer } from '../components/shared/PageContainer'

const CHANNELS = [
  { icon: MessageSquareText, label: 'Chat', detail: 'Available now' },
  { icon: Phone, label: 'Voice', detail: 'Available' },
  { icon: MessageSquare, label: 'SMS', detail: 'Coming soon' },
]

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Safety-aware routing',
    description: 'Every conversation is screened for urgency and escalated to a human when it matters.',
  },
  {
    icon: Route,
    title: 'Evidence-grounded guidance',
    description: 'Answers are drawn from approved health information sources, not open-ended speculation.',
  },
  {
    icon: Languages,
    title: 'Meets you in your language',
    description: 'Built for first-time digital users, with support for English and Hindi today.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="max-w-6xl">
      <motion.section
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="border-b border-border pb-10 pt-4 text-center sm:pt-8"
      >
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.35 }}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700"
        >
          RuralCare AI
        </motion.p>
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.35 }}
          className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl"
        >
          Healthcare guidance that speaks your language
        </motion.h1>
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.35 }}
          className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-secondary"
        >
          Get trusted health information, navigate to the right level of care, and find appointments — through
          chat, voice, or SMS. Built for rural and underserved communities.
        </motion.p>
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }} className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => navigate('/assistant')}>
            Start a conversation
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/appointments')}>
            Find a doctor
          </Button>
        </motion.div>
      </motion.section>

      <section className="grid gap-6 pt-10 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Start with the right next step</CardTitle>
              <CardDescription>
                RuralCare AI helps you understand symptoms, routes you to the right level of care, and manages
                appointments without overwhelming the conversation.
              </CardDescription>
            </div>
          </CardHeader>

          <div className="grid gap-3 sm:grid-cols-3">
            {CHANNELS.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="rounded-lg border border-border bg-surface-muted p-4">
                <Icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-text-primary">{label}</p>
                <p className="mt-1 text-xs text-text-muted">{detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Why it's trustworthy</CardTitle>
            </div>
          </CardHeader>
          <ul className="space-y-4">
            {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </PageContainer>
  )
}
