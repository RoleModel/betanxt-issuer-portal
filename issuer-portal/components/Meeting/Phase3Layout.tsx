'use client'

import React, { Suspense } from 'react'

import { Grid } from '@mui/material'

import KeyDatesCard from '@/components/Meeting/KeyDatesCard'
import MeetingDocuments from '@/components/Meeting/MeetingDocuments'
import TaskCard from '@/components/Meeting/TaskCard'

import type { Document, Meeting } from '@/types/api'

interface Phase3LayoutProps {
  meetingId?: string
  meeting?: Meeting
  documents?: Document[]
  phase?: number
}

export default function Phase3Layout({
  meetingId,
  meeting,
  phase = 3,
}: Phase3LayoutProps) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 12 }}>
        <Suspense>
          <KeyDatesCard meeting={meeting} />
        </Suspense>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <MeetingDocuments meetingId={meeting?.id} meeting={meeting} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TaskCard meetingId={meetingId} currentPhase={phase} />
      </Grid>
    </Grid>
  )
}
