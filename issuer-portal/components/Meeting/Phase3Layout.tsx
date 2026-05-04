'use client'

import React, { Suspense } from 'react'

import { Grid } from '@mui/material'

import KeyDatesCard from '@/components/Meeting/KeyDatesCard'
import MeetingDocuments from '@/components/Meeting/MeetingDocuments'

import type { Meeting } from '@/types/api-exports'

interface Phase3LayoutProps {
  meeting?: Meeting
}

function Phase3Layout({ meeting }: Phase3LayoutProps) {
  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={{ xs: 12, md: 12 }}>
        <Suspense>
          <KeyDatesCard meeting={meeting} />
        </Suspense>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <MeetingDocuments meetingId={meeting?.id} meeting={meeting} />
      </Grid>
    </Grid>
  )
}
export default Phase3Layout
