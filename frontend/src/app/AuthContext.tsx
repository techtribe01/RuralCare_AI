import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getSession, logout as logoutRequest, sendOtp as sendOtpRequest, verifyOtp as verifyOtpRequest } from '../lib/auth-api'

type AuthContextValue = {
  isAuthenticated: boolean
  userId: string | null
  checkingSession: boolean
  sendOtp: (phoneNumber: string) => Promise<void>
  verifyOtp: (phoneNumber: string, code: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    getSession()
      .then((session) => {
        if (session.is_authenticated) {
          setIsAuthenticated(true)
          setUserId(session.user_id)
        }
      })
      .catch(() => {
        // Treat an unreachable session check as unauthenticated rather than blocking the app.
      })
      .finally(() => setCheckingSession(false))
  }, [])

  const sendOtp = useCallback(async (phoneNumber: string) => {
    await sendOtpRequest(phoneNumber)
  }, [])

  const verifyOtp = useCallback(async (phoneNumber: string, code: string) => {
    const result = await verifyOtpRequest(phoneNumber, code)
    setIsAuthenticated(true)
    setUserId(result.user_id)
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setIsAuthenticated(false)
    setUserId(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, userId, checkingSession, sendOtp, verifyOtp, logout }),
    [isAuthenticated, userId, checkingSession, sendOtp, verifyOtp, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
