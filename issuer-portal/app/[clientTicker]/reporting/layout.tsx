'use client'

import React from 'react'

import Layout from '@/components/Layout/Layout'

import { MeetingProvider } from '@/contexts/MeetingContext'

// Reporting layout with navigation
export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MeetingProvider>
      <Layout navBar={true}>
        {children}
      </Layout>
    </MeetingProvider>
  )
}