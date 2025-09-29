'use client'

import React from 'react'

import Layout from '@/components/Layout/Layout'
import { Box } from '@mui/material'

import { MeetingProvider } from '@/contexts/MeetingContext'

// Reporting layout with navigation
export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MeetingProvider>
      <Layout navBar={true}>
        <Box sx={{ flexGrow: 1, flex: 1 }}>{children}</Box>
      </Layout>
    </MeetingProvider>
  )
}
