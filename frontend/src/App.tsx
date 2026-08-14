import { BrowserRouter } from 'react-router-dom'
import { ChatSessionProvider } from './app/ChatSessionContext'
import { AppRoutes } from './routes'
import { ToastProvider } from './components/ui/Toast'
import { TooltipProvider } from './components/ui/Tooltip'

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <ToastProvider>
          <ChatSessionProvider>
            <AppRoutes />
          </ChatSessionProvider>
        </ToastProvider>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
