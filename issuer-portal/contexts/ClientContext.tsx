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
      const tickerMatch = pathname.match(/^\/([A-Z]{2,5})\//)
      if (tickerMatch) {
        const ticker = tickerMatch[1]
        // Find client by ticker from available clients data
        const matchingClient = clients.find((client) => client.ticker === ticker)
        return matchingClient?.company_name || matchingClient?.short_name || null
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
    const determineClient = async () => {
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

        // 1. First check localStorage for manually selected client (takes priority)
        if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
          try {
            const selectedClientStr =
              typeof window !== 'undefined'
                ? localStorage.getItem('selectedClient')
                : null
            if (selectedClientStr) {
              const selectedClient = JSON.parse(selectedClientStr)
              targetClient = clients.find((c) => c.id === selectedClient.id) || null
              if (targetClient) {
              } else {
              }
            } else {
            }
          } catch (error) {}
        }

        // 2. If no localStorage client, check if URL implies a specific client (meeting page)
        // But only if we're in normal auth mode (not bypass) or no localStorage client exists
        if (!targetClient && process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'true') {
          const clientFromURL = extractClientFromURL(pathname)
          if (clientFromURL) {
            targetClient =
              clients.find(
                (c) => c.company_name === clientFromURL || c.short_name === clientFromURL
              ) || null
            if (targetClient) {
            }

            if (targetClient && !canAccessClient(targetClient.id)) {
              setError(
                `Access denied to ${targetClient.company_name || targetClient.short_name}`
              )
              setLoading(false)
              return
            }
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
              name: targetClient.company_name || targetClient.short_name,
              ticker: targetClient.ticker,
            })
          )
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to determine client')
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
    if (!canAccessClient(client.id)) {
      setError(`Access denied to ${client.company_name || client.short_name}`)
      return
    }

    // Set flag to prevent automatic client determination during switch
    setIsUserSwitching(true)

    // Update localStorage first
    localStorage.setItem(
      'selectedClient',
      JSON.stringify({
        id: client.id,
        name: client.company_name || client.short_name,
        ticker: client.ticker,
      })
    )

    // Update current client state immediately
    setCurrentClient(client)

    // Navigate to an appropriate meeting for the selected client using ticker-based routing
    // Use the client's ticker to generate the default meeting ID dynamically
    if (client.ticker) {
      const defaultMeetingId = `${client.ticker.toLowerCase()}-annual-meeting-2025`

      // Extract current route (everything after /[TICKER]/meeting/meetingId)
      const currentPath = pathname.replace(/^\/[A-Z]{2,5}\/meeting\/[^/]+/, '')
      const newPath =
        currentPath === ''
          ? `/${client.ticker}/meeting/${defaultMeetingId}`
          : `/${client.ticker}/meeting/${defaultMeetingId}${currentPath}`

      router.replace(newPath)
    }

    // Reset the switching flag after navigation completes
    setTimeout(() => {
      setIsUserSwitching(false)
    }, 500)
  }

  // Debug: Show current client state
  React.useEffect(() => {}, [currentClient])

  return (
    <ClientContext.Provider
      value={{
        currentClient,
        availableClients: clients,
        loading: loading || clientsLoading,
        error: error || clientsError,
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
    throw new Error('useClient must be used within a ClientProvider')
  }
  return context
}
