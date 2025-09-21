'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Base meeting page - redirects to dashboard
export default function MeetingPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // Redirect to dashboard by default
    const clientTicker = params.clientTicker as string
    const meetingId = params.meetingId as string

    if (clientTicker && meetingId) {
      router.replace(`/${clientTicker}/meeting/${meetingId}/dashboard`)
    }
  }, [router, params])

  // Show nothing while redirecting
  return null
}
