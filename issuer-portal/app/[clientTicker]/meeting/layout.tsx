'use client'

import React from 'react'

import { Box } from '@mui/material'

import Layout from '@/components/Layout/Layout'

import { DocumentProvider } from '@/contexts/DocumentContext'
import { MeetingProvider } from '@/contexts/MeetingContext'
import type { LayoutProps } from '@/types/next-layout'

// Main meeting layout with normal nested routes
// EventTabs stay mounted while nested routes change
export default function MeetingLayout(props: LayoutProps<'/[clientTicker]/meeting'>) {
  return (
    <MeetingProvider>
      <DocumentProvider>
        <Layout eventTabs={true} navBar={true}>
          <Box sx={{ flexGrow: 1, flex: 1 }}>{props.children}</Box>
        </Layout>
      </DocumentProvider>
    </MeetingProvider>
  )
}
