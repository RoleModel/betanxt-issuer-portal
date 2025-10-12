'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { type Client, useClients } from '@/hooks/useClients'

interface ClientContextType {
  currentClient: Client | null
  availableClients: Client[]
  loading: boolean
  error: string | null
  switchClient: (client: Client) => void
  canAccessClient: (clientId: string) => boolean
  isHydrated: boolean
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const { clients, loading: clientsLoading, error: clientsError } = useClients()
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUserSwitching, setIsUserSwitching] = useState(false)

  // Extract client from ticker-based URL structure
  const extractClientFromURL = useCallback(
    (pathname: string): string | null => {
      // New format: /[TICKER]/meeting/meeting-id
      const tickerMatch = /^\/([A-Z]{2,5})\//.exec(pathname)
      if (tickerMatch) {
        const ticker = tickerMatch[1]
        // Find client by ticker from available clients data
        const matchingClient = clients.find((client) => client.ticker === ticker)
        return matchingClient?.company_name ?? matchingClient?.short_name ?? null
      }
      return null
    },
    [clients]
  )

  // Check if user can access a specific client
  const canAccessClient = useCallback(
    (clientId: string): boolean => {
      if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
        return true // Auth bypass allows access to all clients
      }

      // In normal auth mode, check user's relationships or account access
      const userAccountId = session?.user?.accountId
      if (!userAccountId) return false

      // Find client that matches the clientId
      const targetClient = clients.find(
        (c) =>
          c.id === clientId ||
          c.company_name === clientId ||
          c.short_name === clientId ||
          c.ticker === clientId
      )
      if (!targetClient) return false

      // Check if user has access (simplified - could be more complex with relationships)
      return (
        userAccountId === targetClient.id ||
        session?.user?.type === 'RELATIONSHIP_MANAGER' ||
        Boolean(session?.user?.roles?.includes('ADMIN'))
      )
    },
    [session?.user?.accountId, session?.user?.type, session?.user?.roles, clients]
  )

  // Determine current client based on URL and user context
  useEffect(() => {
    const determineClient = () => {
      try {
        setLoading(true)
        setError(null)

        if (clients.length === 0) {
          setLoading(false)
          return
        }

        // If user is manually switching clients, don't re-determine automatically
        if (isUserSwitching) {
          setLoading(false)
          return
        }

        let targetClient: Client | null = null

        // 1. First check if URL implies a specific client (takes priority for client access control)
        const clientFromURL = extractClientFromURL(pathname)
        if (clientFromURL) {
          targetClient =
            clients.find(
              (c) => c.company_name === clientFromURL || c.short_name === clientFromURL
            ) ?? null

          // If URL specifies a client, use it and update localStorage
          if (targetClient && process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem('selectedClient', JSON.stringify({ id: targetClient.id }))
              }
            } catch (error) {
              console.warn('Failed to update selectedClient in localStorage:', error)
            }
          }
        }

        // 2. If no URL client, check localStorage for manually selected client
        if (!targetClient && process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
          try {
            const selectedClientStr =
              typeof window !== 'undefined'
                ? localStorage.getItem('selectedClient')
                : null
            if (selectedClientStr) {
              const selectedClient = JSON.parse(selectedClientStr) as { id: string }
              targetClient = clients.find((c) => c.id === selectedClient.id) ?? null
            }
          } catch (parseError) {
            console.warn('Failed to parse selectedClient from localStorage:', parseError)
          }
        }

        // 3. For authenticated users, check access to URL client
        if (targetClient && process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'true') {
          if (!canAccessClient(targetClient.id)) {
            setError(
              `Access denied to ${targetClient.company_name ?? targetClient.short_name}`
            )
            setLoading(false)
            return
          }
        }

        // 3. Fallback to first available client
        if (!targetClient && clients.length > 0) {
          targetClient = clients[0]
        }

        setCurrentClient(targetClient)

        // Update localStorage if in auth bypass mode
        if (targetClient && process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
          localStorage.setItem(
            'selectedClient',
            JSON.stringify({
              id: targetClient.id,
              name: targetClient.company_name ?? targetClient.short_name,
              ticker: targetClient.ticker,
            })
          )
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to determine client'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (!clientsLoading) {
      determineClient()
    }
  }, [
    pathname,
    clients,
    clientsLoading,
    session?.user?.accountId,
    isUserSwitching,
    extractClientFromURL,
    canAccessClient,
  ])

  // Handle client switching
  const switchClient = (client: Client) => {
    try {
      console.log('🔄 switchClient called with:', {
        id: client.id,
        ticker: client.ticker,
        name: client.name,
        company_name: client.company_name,
        short_name: client.short_name,
      })

      if (!canAccessClient(client.id)) {
        setError(`Access denied to ${client.company_name ?? client.short_name}`)
        return
      }

      // Set flag to prevent automatic client determination during switch
      setIsUserSwitching(true)

      // Update localStorage first
      localStorage.setItem(
        'selectedClient',
        JSON.stringify({
          id: client.id,
          name: client.company_name ?? client.short_name,
          ticker: client.ticker,
        })
      )

      // Update current client state immediately
      console.log('🔄 Setting current client to:', client.ticker)
      setCurrentClient(client)

      // Navigate to the equivalent page for the selected client using ticker-based routing
      if (client.ticker) {
        // Only navigate if on a ticker-based route
        if (pathname.startsWith('/education') || pathname.startsWith('/products')) {
          // Education and products pages are at root level - just switch the client, no navigation
          return
        }

        // For ticker-based routes, replace the old ticker with the new ticker
        const tickerMatch = /^\/([A-Z]{2,5})\//.exec(pathname)
        if (tickerMatch) {
          const oldTicker = tickerMatch[1]
          const newPath = pathname.replace(`/${oldTicker}/`, `/${client.ticker}/`)

          // If on a meeting route, verify the new client has a meeting_id
          if (pathname.includes('/meeting/') && !client.meeting_id) {
            // Redirect to past-meetings if switching to a client without an active meeting
            router.replace(`/${client.ticker}/past-meetings`)
          } else {
            router.replace(newPath)
          }
        } else {
          // Not on a ticker-based route - navigate to client's default meeting if available
          const defaultMeetingId = client.meeting_id
          if (defaultMeetingId) {
            router.replace(`/${client.ticker}/meeting/${defaultMeetingId}`)
          } else {
            router.replace(`/${client.ticker}/past-meetings`)
          }
        }
      }

      // Reset the switching flag after navigation completes
      setTimeout(() => {
        setIsUserSwitching(false)
      }, 500)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to switch client'
      setError(errorMessage)
      console.error('Client switch error:', error)
      // Reset the switching flag on error
      setIsUserSwitching(false)
    }
  }

  // Debug: Show current client state
  React.useEffect(() => {
    // Client state logging can be added here if needed
  }, [currentClient])

  return (
    <ClientContext.Provider
      value={{
        currentClient,
        availableClients: clients,
        loading: loading || clientsLoading,
        error: error ?? clientsError,
        switchClient,
        canAccessClient,
        isHydrated: !loading && !clientsLoading && !!currentClient,
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export const useClient = () => {
  const context = useContext(ClientContext)
  if (context === undefined) {
    // Return default values when not within a ClientProvider (e.g., on login page)
    return {
      currentClient: null,
      availableClients: [],
      loading: false,
      error: null,
      switchClient: () => {},
      canAccessClient: () => false,
      isHydrated: true,
    }
  }
  return context
}
