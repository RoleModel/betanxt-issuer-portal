'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { LinearProgress } from '@mui/material'

import { useClient } from '@/contexts/ClientContext'

export default function HomePage() {
  const { currentClient, loading: clientLoading } = useClient()
  const router = useRouter()

  useEffect(() => {
    // Middleware already handles authentication, so just redirect to client meeting once loaded
    if (clientLoading) return // Still loading

    if (currentClient) {
      // Have a client, redirect to client meeting
      const defaultMeetingId = `${currentClient.ticker.toLowerCase()}-annual-meeting-2026`
      router.push(`/${currentClient.ticker}/meeting/${defaultMeetingId}`)
    }
  }, [router, currentClient, clientLoading])

  // Show loading spinner while determining client
  return <LinearProgress />
}
