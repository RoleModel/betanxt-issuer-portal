'use client'

import React, { Suspense } from 'react'

import { Grid } from '@mui/material'

import DocumentHostingCard from '@/components/Meeting/DocumentHostingCard'
import EventContactsCard from '@/components/Meeting/EventContactsCard'
import KeyDatesCard from '@/components/Meeting/KeyDatesCard'
import MeetingInformationCard from '@/components/Meeting/MeetingInformationCard'
import TaskCard from '@/components/Meeting/TaskCard'

import type { Meeting } from '@/types/api'

interface Phase1LayoutProps {
  meetingId?: string
  meeting?: Meeting
  phase?: number
}

export default function Phase1Layout({
  meetingId,
  meeting,
  phase = 1,
}: Phase1LayoutProps) {
  return (
    <Suspense>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 12 }}>
          <KeyDatesCard meeting={meeting} />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <TaskCard meetingId={meetingId} currentPhase={phase} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DocumentHostingCard meeting={meeting} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <EventContactsCard
            meeting={{
              transferAgent: meeting?.transferAgent || undefined,
              planAdministrator: meeting?.planAdministrator || undefined,
              planAdministratorContactEmail:
                meeting?.planAdministratorContactEmail || undefined,
              solicitor: meeting?.solicitor || undefined,
              solicitorEmail: meeting?.solicitorEmail || undefined,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MeetingInformationCard
            meeting={{
              meetingType: meeting?.meetingType || undefined,
              inspector: meeting?.inspector ?? undefined,
              cusip: meeting?.cusip || undefined,
              ticker: meeting?.ticker || undefined,
              employeeStockPlans: meeting?.employeeStockPlans || undefined,
            }}
          />
        </Grid>
      </Grid>
    </Suspense>
  )
}
