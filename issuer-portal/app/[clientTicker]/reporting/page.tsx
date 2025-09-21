'use client'

import { useParams } from 'next/navigation'
import React from 'react'

import { Box } from '@mui/material'

import Layout from '@/components/Layout/Layout'
import ReportingPageClient from '@/components/Reporting/ReportingSections'

import { MeetingProvider } from '@/contexts/MeetingContext'

export default function PastMeetingsPage() {
  const params = useParams()
  const clientTicker = params.clientTicker as string

  return (
    <MeetingProvider>
      <Layout navBar={true}>
        <Box sx={{ p: 3 }}>
          <ReportingPageClient clientTicker={clientTicker} />
        </Box>
      </Layout>
    </MeetingProvider>
  )
}
