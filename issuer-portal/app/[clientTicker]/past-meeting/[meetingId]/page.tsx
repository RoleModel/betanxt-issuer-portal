'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { LinearProgress } from '@mui/material'

// This page handles the base past-meeting route and redirects to tabulation
export default function PastMeetingPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const meetingId = params.meetingId as string
  const clientTicker = params.clientTicker as string

  useEffect(() => {
    // Redirect to tabulation for past meetings
    const search = searchParams.toString()
    const targetPath = `/${clientTicker}/past-meeting/${meetingId}/tabulation${search ? `?${search}` : ''}`
    router.replace(targetPath)
  }, [clientTicker, meetingId, router, searchParams])

  return <LinearProgress />
}
