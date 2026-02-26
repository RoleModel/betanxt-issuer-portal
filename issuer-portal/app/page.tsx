'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Box, LinearProgress, Typography } from '@mui/material'

import { useClient } from '@/contexts/ClientContext'

export default function HomePage() {
  const { data: session, status } = useSession()
  const { currentClient, availableClients, loading: clientLoading, error } = useClient()
  const router = useRouter()
  const [showError, setShowError] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)
  const bypassSignInAttempted = useRef(false)

  // Auto sign-in when bypass auth is enabled but no session exists
  useEffect(() => {
    const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
    if (bypassAuth && status === 'unauthenticated' && !bypassSignInAttempted.current) {
      bypassSignInAttempted.current = true
      void signIn('credentials', {
        redirect: false,
        username: 'bypass',
        password: 'bypass',
      })
    }
  }, [status])

  useEffect(() => {
    // Show error after 5 seconds if still loading
    const timer = setTimeout(() => {
      if (clientLoading && !currentClient) {
        setShowError(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [clientLoading, currentClient])

  useEffect(() => {
    // Middleware already handles authentication, so just redirect to client meeting once loaded
    if (clientLoading || hasRedirected) return // Still loading or already redirected
    if (status !== 'authenticated') return // Wait for session to be ready

    const userType = session?.user?.type

    // PARENT_CLIENT, SOLICITOR, and CSM users go to the events overview dashboard
    if (userType === 'PARENT_CLIENT' || userType === 'SOLICITOR' || userType === 'CSM') {
      setHasRedirected(true)
      router.push('/events')
      return
    }

    if (currentClient) {
      // Have a client, redirect to client meeting
      const defaultMeetingId = `${currentClient.ticker.toLowerCase()}-annual-meeting-2026`
      setHasRedirected(true)
      router.push(`/${currentClient.ticker}/meeting/${defaultMeetingId}`)
    } else if (availableClients.length > 0) {
      // No current client but have available clients - redirect to first one
      const firstClient = availableClients[0]
      const defaultMeetingId = `${firstClient.ticker.toLowerCase()}-annual-meeting-2026`
      setHasRedirected(true)
      router.push(`/${firstClient.ticker}/meeting/${defaultMeetingId}`)
    } else if (!clientLoading) {
      // Loading complete but no clients available
      // For ADMIN users without a specific client, redirect to first available client
      // For other users, this is an error state - should not happen
      if (userType === 'ADMIN') {
        // Redirect to WEN as default for admins
        setHasRedirected(true)
        router.push('/WEN/meeting/wen-annual-meeting-2026')
      } else {
        setHasRedirected(true)
        router.push('/login')
      }
    }
  }, [
    router,
    currentClient,
    availableClients,
    clientLoading,
    hasRedirected,
    session,
    status,
  ])

  if (error || showError) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <Typography variant="h6" color="error">
          {error || 'Failed to load client data'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please refresh the page or contact support.
        </Typography>
      </Box>
    )
  }

  // Show loading spinner while determining client
  return <LinearProgress />
}
