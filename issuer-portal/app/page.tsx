'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { LinearProgress } from '@mui/material'

import { ClientProvider, useClient } from '@/contexts/ClientContext'

const HomePageContent = () => {
  const { data: session, status } = useSession()
  const { currentClient, loading: clientLoading } = useClient()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading' || clientLoading) return // Still loading

    if (!session) {
      // Not authenticated, redirect to login
      router.push('/login')
    } else if (currentClient) {
      // Authenticated and have a client, redirect to client meeting
      const defaultMeetingId = `${currentClient.ticker.toLowerCase()}-annual-meeting-2025`
      router.push(`/${currentClient.ticker}/meeting/${defaultMeetingId}`)
    }
  }, [session, status, router, currentClient, clientLoading])

  // Show loading spinner while checking authentication and client determination
  return <LinearProgress />
}

const HomePage = () => {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ClientProvider>
        <HomePageContent />
      </ClientProvider>
    </SessionProvider>
  )
}

export default HomePage
