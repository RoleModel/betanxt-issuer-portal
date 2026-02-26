'use client'

import React, { Suspense } from 'react'

import { Grid } from '@mui/material'

import DocumentHostingCard from '@/components/Meeting/DocumentHostingCard'
import KeyDatesCard from '@/components/Meeting/KeyDatesCard'
import MeetingInformationCard from '@/components/Meeting/MeetingInformationCard'

import type { Meeting } from '@/types/api-exports'

interface Phase1LayoutProps {
  meetingId?: string
  meeting?: Meeting
}

function Phase1Layout({ meeting }: Phase1LayoutProps) {
  return (
    <Suspense>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 12 }}>
          <KeyDatesCard meeting={meeting} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DocumentHostingCard meeting={meeting} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MeetingInformationCard
            meeting={{
              meetingType: meeting?.meetingType ?? undefined,
              cusip: meeting?.cusip ?? undefined,
              ticker: meeting?.ticker ?? undefined,
            }}
          />
        </Grid>
      </Grid>
    </Suspense>
  )
}

export default Phase1Layout
