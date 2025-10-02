'use client'

import React from 'react'

import { Box } from '@mui/material'

import Layout from '@/components/Layout/Layout'

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
