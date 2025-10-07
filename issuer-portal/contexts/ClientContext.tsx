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

      // Check if user is ADMIN or RELATIONSHIP_MANAGER - they have access to all clients
      if (
        session?.user?.type === 'RELATIONSHIP_MANAGER' ||
        session?.user?.type === 'ADMIN' ||
        Boolean(session?.user?.roles?.includes('ADMIN'))
      ) {
        return true
      }

      // In normal auth mode, check user's relationships or account access
      const userAccountId = session?.user?.account_id
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

      // Check if user's account_id matches the client id
      return userAccountId === targetClient.id
    },
    [session?.user?.account_id, session?.user?.type, session?.user?.roles, clients]
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
          } catch (error) {
            console.warn('Failed to parse selectedClient from localStorage:', error)
          }
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
    try {
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

      // Navigate to the equivalent page for the selected client using ticker-based routing
      if (client.ticker) {
        let newPath: string

        // Check the current route type and navigate to the equivalent page for the new client
        if (pathname.includes('/past-meetings')) {
          // For past-meetings page, navigate to the new client's past-meetings
          newPath = `/${client.ticker}/past-meetings`
        } else if (pathname.startsWith('/education')) {
          // Education pages are now at root level - stay on the same education page
          // No navigation needed when switching clients on education pages
          return
        } else if (pathname.startsWith('/products')) {
          // Products pages are now at root level - stay on the same products page
          // No navigation needed when switching clients on products pages
          return
        } else if (pathname.includes('/meeting/')) {
          // For meeting pages, extract the current route part after meetingId
          const meetingMatch = /^\/[A-Z]{2,5}\/meeting\/[^/]+(.*)$/.exec(pathname)
          const routeAfterMeeting = meetingMatch ? meetingMatch[1] : ''

          // Use the client's default meeting ID
          const defaultMeetingId = client.meeting_id
          if (defaultMeetingId) {
            newPath = `/${client.ticker}/meeting/${defaultMeetingId}${routeAfterMeeting}`
          } else {
            // Fallback if no meeting_id available
            newPath = `/${client.ticker}/past-meetings`
          }
        } else {
          // Default fallback: navigate to the client's default meeting based on meeting_id
          const defaultMeetingId = client.meeting_id
          if (defaultMeetingId) {
            newPath = `/${client.ticker}/meeting/${defaultMeetingId}`
          } else {
            // Fallback if no meeting_id available
            newPath = `/${client.ticker}/past-meetings`
          }
        }
        router.replace(newPath)
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
    console.log('ClientContext Debug:', {
      clientsCount: clients.length,
      clients: clients.map(c => ({ ticker: c.ticker, name: c.company_name })),
      currentClient: currentClient?.ticker,
      session: session?.user,
    })
  }, [clients, currentClient, session])

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
