import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import LandingPage from './pages/LandingPage'
import AssistantPage from './pages/AssistantPage'
import AppointmentsPage from './pages/AppointmentsPage'
import ActivityPage from './pages/ActivityPage'
import HelpSafetyPage from './pages/HelpSafetyPage'
import AgentConsolePage from './pages/AgentConsolePage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/help-safety" element={<HelpSafetyPage />} />
        <Route path="/agent-console" element={<AgentConsolePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
