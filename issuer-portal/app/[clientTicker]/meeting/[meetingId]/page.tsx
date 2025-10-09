'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { LinearProgress } from '@mui/material'

// This page handles the base meeting route and redirects to the dashboard
export default function MeetingPage() {
  const router = useRouter()
  const params = useParams()
  const meetingId = params.meetingId as string
  const clientTicker = params.clientTicker as string

  useEffect(() => {
    // Redirect to dashboard which will then redirect to the active phase
    const targetPath = `/${clientTicker}/meeting/${meetingId}/dashboard`
    router.replace(targetPath)
  }, [clientTicker, meetingId, router])

  return <LinearProgress />
}
