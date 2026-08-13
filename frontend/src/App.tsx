import { BrowserRouter } from 'react-router-dom'
import { ChatSessionProvider } from './app/ChatSessionContext'
import { AppRoutes } from './routes'

function App() {
  return (
    <BrowserRouter>
      <ChatSessionProvider>
        <AppRoutes />
      </ChatSessionProvider>
    </BrowserRouter>
  )
}

export default App
