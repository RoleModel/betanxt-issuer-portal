'use client'

import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

import { LinearProgress } from '@mui/material'

import { useMeeting } from '@/contexts/MeetingContext'

// Dynamic import for the heavy documents component
const DocumentsComponent = dynamic(
  () => import('@/components/Documents/DocumentsSection'),
  {
    ssr: false,
  }
)

export default function DocumentsPage() {
  const { currentMeeting, getMeetingById: _getMeetingById } = useMeeting()

  return (
    <Suspense fallback={<LinearProgress />}>
      <DocumentsComponent
        params={Promise.resolve({ meetingId: `${currentMeeting?.id ?? ''}` })}
      />
    </Suspense>
  )
}
