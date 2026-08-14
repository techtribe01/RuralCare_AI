import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Check, Languages, MessageSquareText, Phone, Route, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/shared/PageContainer'

const CHANNELS = [
  { icon: MessageSquareText, label: 'Chat', detail: 'Talk through what you need' },
  { icon: Phone, label: 'Voice', detail: 'A familiar phone call' },
  { icon: Languages, label: 'SMS', detail: 'Works on a simple phone' },
]

const STEPS = [
  { number: '01', title: 'Tell us what is going on', copy: 'Describe a concern in your own words, in English or Telugu.' },
  { number: '02', title: 'Get the right next step', copy: 'RuralCare checks urgency and shares clear, trusted guidance.' },
  { number: '03', title: 'Move forward with care', copy: 'Find a suitable doctor or hospital and book only when you are ready.' },
]

const TRUST_ITEMS = [
  'Evidence-grounded health information',
  'Safety-aware escalation for urgent concerns',
  'One consistent experience across chat, voice, and SMS',
]

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="max-w-7xl">
      <motion.section
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="relative overflow-hidden rounded-[2rem] bg-brand-900 px-6 py-14 text-text-inverse shadow-lg sm:px-12 sm:py-20 lg:px-20 lg:py-24"
      >
        <div className="absolute -right-16 -top-20 size-72 rounded-full border-[28px] border-brand-700/50" aria-hidden="true" />
        <div className="absolute bottom-[-7rem] right-24 size-64 rounded-full bg-accent/20" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <motion.div variants={fadeUp} transition={{ duration: 0.45 }} className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-200">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> RuralCare AI
          </motion.div>
          <motion.h1 variants={fadeUp} transition={{ duration: 0.45 }} className="max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            A clearer path to the care you need.
          </motion.h1>
          <motion.p variants={fadeUp} transition={{ duration: 0.45 }} className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-brand-100 sm:text-xl">
            Trusted health guidance for rural and underserved communities — in a conversation that listens, explains, and helps you take the next step.
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.45 }} className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/assistant')} className="bg-accent text-white hover:bg-accent/90">
              Start a conversation <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/appointments')} className="border-brand-500 bg-transparent text-text-inverse hover:bg-brand-800 hover:text-text-inverse">
              Find a doctor
            </Button>
          </motion.div>
        </div>
        <div className="relative mt-14 grid gap-3 border-t border-brand-700 pt-6 sm:grid-cols-3">
          {CHANNELS.map(({ icon: Icon, label, detail }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 text-brand-300" aria-hidden="true" />
              <div><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-sm text-brand-200">{detail}</p></div>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="grid gap-8 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-brand-700">Care, without the maze</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] text-text-primary sm:text-4xl">Simple on the surface. Thoughtful underneath.</h2>
          <p className="mt-5 text-base leading-relaxed text-text-secondary">A generic chatbot can give you words. RuralCare is designed to help you understand what those words mean for your next safe action.</p>
          <ul className="mt-7 flex flex-col gap-4">
            {TRUST_ITEMS.map((item) => <li key={item} className="flex items-start gap-3 text-sm font-medium text-text-primary"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-700"><Check className="h-4 w-4" aria-hidden="true" /></span>{item}</li>)}
          </ul>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step) => <Card key={step.number} className="border-transparent bg-surface-muted p-6"><span className="font-mono text-sm font-semibold text-accent">{step.number}</span><h3 className="mt-10 text-lg font-semibold tracking-tight text-text-primary">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-text-secondary">{step.copy}</p></Card>)}
        </div>
      </section>

      <section className="grid gap-8 rounded-3xl border border-border bg-surface-muted p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-14">
        <div><div className="flex items-center gap-2 text-brand-700"><ShieldCheck className="h-5 w-5" aria-hidden="true" /><p className="text-sm font-semibold uppercase tracking-[0.14em]">Built with care</p></div><h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-text-primary">Calm guidance when the decision feels difficult.</h2><p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">RuralCare does not diagnose, prescribe, or replace a clinician. It is a working showcase for safer conversations, trusted sources, and care navigation.</p></div>
        <Button onClick={() => navigate('/help-safety')} variant="secondary" size="lg">How safety works <Route className="h-4 w-4" aria-hidden="true" /></Button>
      </section>
      <p className="px-2 py-8 text-center text-xs leading-relaxed text-text-muted">Showcase prototype · Hospitals, doctors, and appointments are fictional demo entities.</p>
    </PageContainer>
  )
}
