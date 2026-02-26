'use client'

import React, { Suspense } from 'react'

import { CalendarMonthOutlined } from '@mui/icons-material'
import { Grid } from '@mui/material'

import FeatureTile from '@/components/FeatureTile'
import DocumentHostingCard from '@/components/Meeting/DocumentHostingCard'
import KeyDatesCard from '@/components/Meeting/KeyDatesCard'
import MeetingDocuments from '@/components/Meeting/MeetingDocuments'

import type { Meeting } from '@/types/api-exports'
import { friendlyDate } from '@/utils/dateUtils'

interface Phase4LayoutProps {
  meeting?: Meeting
}

function Phase4Layout({ meeting }: Phase4LayoutProps) {
  const materialsDate = meeting?.meetingDate
    ? new Date(new Date(meeting.meetingDate).getTime() - 48 * 24 * 60 * 60 * 1000)
    : null
  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={{ xs: 12, md: 12 }}>
        <Suspense>
          <KeyDatesCard meeting={meeting} />
        </Suspense>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <MeetingDocuments meetingId={meeting?.id} meeting={meeting} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }} display="flex" flexDirection="column" gap={3}>
        <FeatureTile
          title="Material Quantities Expected By"
          description={materialsDate ? friendlyDate(materialsDate.toISOString()) : ''}
          icon={<CalendarMonthOutlined fontSize="large" color="secondary" />}
        />
        <DocumentHostingCard meeting={meeting} />
      </Grid>
    </Grid>
  )
}
export default Phase4Layout
