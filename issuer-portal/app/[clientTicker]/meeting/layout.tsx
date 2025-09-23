'use client'

import React from 'react'

import Layout from '@/components/Layout/Layout'
import { EventTabs } from '@/components/Navigation/EventTabs'

import { DocumentProvider } from '@/contexts/DocumentContext'
import { MeetingProvider } from '@/contexts/MeetingContext'

// Main meeting layout with normal nested routes
// EventTabs stay mounted while nested routes change
export default function MeetingLayout(props: LayoutProps<'/[clientTicker]/meeting'>) {
  return (
    <MeetingProvider>
      <DocumentProvider>
        <Layout navBar={true}>
          <EventTabs />
          {props.children}
        </Layout>
      </DocumentProvider>
    </MeetingProvider>
  )
}
