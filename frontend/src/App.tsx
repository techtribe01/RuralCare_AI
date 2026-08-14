import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './app/AuthContext'
import { ChatSessionProvider } from './app/ChatSessionContext'
import { AppRoutes } from './routes'
import { ToastProvider } from './components/ui/Toast'
import { TooltipProvider } from './components/ui/Tooltip'

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <ToastProvider>
          <AuthProvider>
            <ChatSessionProvider>
              <AppRoutes />
            </ChatSessionProvider>
          </AuthProvider>
        </ToastProvider>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
