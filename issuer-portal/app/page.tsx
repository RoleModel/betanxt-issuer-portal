'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { LinearProgress } from '@mui/material'

import { useClient } from '@/contexts/ClientContext'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const { data: session, status } = useSession()
  const { currentClient, availableClients, loading: clientLoading } = useClient()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading' || clientLoading) return // Still loading

    if (!session) {
      // Not authenticated, redirect to login
      router.push('/login')
      return
    }

    if (currentClient) {
      // Authenticated and have a client, redirect to client meeting
      const defaultMeetingId = currentClient.meeting_id || `${currentClient.ticker.toLowerCase()}-annual-meeting-2026`
      router.push(`/${currentClient.ticker}/meeting/${defaultMeetingId}`)
      return
    }

    // If we have no current client but have available clients, pick the first one
    if (availableClients.length > 0) {
      const firstClient = availableClients[0]
      const defaultMeetingId = firstClient.meeting_id || `${firstClient.ticker.toLowerCase()}-annual-meeting-2026`
      router.push(`/${firstClient.ticker}/meeting/${defaultMeetingId}`)
      return
    }

    // No clients available - this shouldn't happen in normal operation
    // Redirect to login as fallback
    console.error('No clients available for authenticated user')
    router.push('/login')
  }, [session, status, router, currentClient, availableClients, clientLoading])

  // Show loading spinner while checking authentication and client determination
  return <LinearProgress />
}
