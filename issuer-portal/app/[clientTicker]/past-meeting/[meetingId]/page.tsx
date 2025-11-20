'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { LinearProgress } from '@mui/material'

// This page handles the base past-meeting route and redirects to tabulation
export default function PastMeetingPage() {
  const router = useRouter()
  const params = useParams()
  const meetingId = params.meetingId as string
  const clientTicker = params.clientTicker as string

  useEffect(() => {
    // Redirect to tabulation for past meetings
    const targetPath = `/${clientTicker}/past-meeting/${meetingId}/tabulation`
    router.replace(targetPath)
  }, [clientTicker, meetingId, router])

  return <LinearProgress />
}
