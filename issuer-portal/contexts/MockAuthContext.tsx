'use client'

import { useSession } from 'next-auth/react'
import React, { createContext, useContext, useEffect, useState } from 'react'

// Types for user and authentication
interface User {
  id: string
  name: string
  email: string
  username: string
  type: string
  accountId: string
  client: {
    id: number
    name: string
  } | null
  roles: string[]
}

interface MockAuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  switchClient: (clientId: number, clientName: string) => Promise<void>
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined)

interface MockAuthProviderProps {
  children: React.ReactNode
}

export function MockAuthProvider({ children }: MockAuthProviderProps) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id ?? '',
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        username: (session.user as { username?: string }).username ?? '',
        type: (session.user as { type?: string }).type ?? 'user',
        accountId: (session.user as { accountId?: string }).accountId ?? '',
        client:
          (session.user as { client?: { id: number; name: string } | null }).client ||
          null,
        roles: (session.user as { roles?: string[] }).roles || [],
      })
    } else {
      setUser(null)
    }
  }, [session])

  // Must be async to match interface contract (returns Promise)
  // eslint-disable-next-line @typescript-eslint/require-await
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // This would typically call the NextAuth signIn function
      // For now, return true if we have mock credentials
      return username === 'admin' && password === 'admin'
    } catch (error) {
      console.error('Login failed in MockAuthContext', error)
      return false
    }
  }

  // Must be async to match interface contract (returns Promise)
  // eslint-disable-next-line @typescript-eslint/require-await
  const logout = async (): Promise<void> => {
    try {
      // This would typically call the NextAuth signOut function
      setUser(null)
    } catch (error) {
      console.error('Logout failed in MockAuthContext', error)
    }
  }

  const switchClient = async (clientId: number, clientName: string): Promise<void> => {
    try {
      // Update the user's current client
      if (user) {
        setUser({
          ...user,
          client: { id: clientId, name: clientName },
        })
      }

      // In a real app, this would call an API to update the session
      const response = await fetch('/api/auth/switch-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, clientName }),
      })

      if (!response.ok) {
        throw new Error('Failed to switch client')
      }
    } catch (error) {
      console.error('Client switch failed in MockAuthContext', error)
    }
  }

  const value: MockAuthContextType = {
    user,
    isLoading: status === 'loading',
    isAuthenticated: !!user,
    login,
    logout,
    switchClient,
  }

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>
}

export function useMockAuth() {
  const context = useContext(MockAuthContext)
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider')
  }
  return context
}

export default MockAuthContext
