'use client'

import React from 'react'

import Layout from '@/components/Layout/Layout'
import { EventTabs } from '@/components/Navigation/EventTabs'

import { MeetingProvider } from '@/contexts/MeetingContext'

// Main meeting layout with normal nested routes
// EventTabs stay mounted while nested routes change
export default function MeetingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MeetingProvider>
      <Layout navBar={true}>
        <EventTabs />
        {children}
      </Layout>
    </MeetingProvider>
  )
}
