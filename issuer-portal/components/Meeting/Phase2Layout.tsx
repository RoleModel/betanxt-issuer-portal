'use client'

import React from 'react'

import { Grid } from '@mui/material'

import KeyDatesCard from '@/components/Meeting/KeyDatesCard'
import MeetingDocuments from '@/components/Meeting/MeetingDocuments'

import type { Meeting } from '@/types/api-exports'

interface Phase2LayoutProps {
  meeting?: Meeting
}

function Phase2Layout({ meeting }: Phase2LayoutProps) {
  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={{ xs: 12, md: 12 }}>
        <KeyDatesCard meeting={meeting} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <MeetingDocuments meetingId={meeting?.id} meeting={meeting} />
      </Grid>
    </Grid>
  )
}

export default Phase2Layout
