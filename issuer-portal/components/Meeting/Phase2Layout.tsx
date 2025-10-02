'use client'

import React from 'react'

import { Grid } from '@mui/material'

import KeyDatesCard from '@/components/Meeting/KeyDatesCard'
import MeetingDocuments from '@/components/Meeting/MeetingDocuments'
import TaskCard from '@/components/Meeting/TaskCard'

import type { Document, Meeting } from '@/types/api-exports'

interface Phase2LayoutProps {
  meetingId?: string
  meeting?: Meeting
  documents?: Document[]
  phase?: number
}

function Phase2Layout({ meetingId, meeting, phase = 2 }: Phase2LayoutProps) {
  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={{ xs: 12, md: 12 }}>
        <KeyDatesCard meeting={meeting} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TaskCard meetingId={meetingId} currentPhase={phase} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <MeetingDocuments meetingId={meeting?.id} meeting={meeting} />
      </Grid>
    </Grid>
  )
}

export default Phase2Layout
