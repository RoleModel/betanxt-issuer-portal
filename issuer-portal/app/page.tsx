'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Box, LinearProgress, Typography } from '@mui/material'

import { useClient } from '@/contexts/ClientContext'

export default function HomePage() {
  const { currentClient, availableClients, loading: clientLoading, error } = useClient()
  const router = useRouter()
  const [showError, setShowError] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)

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
      // Loading complete but no clients available - redirect to login
      setHasRedirected(true)
      router.push('/login')
    }
  }, [router, currentClient, availableClients, clientLoading, hasRedirected])

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
