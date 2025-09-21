import React from 'react'

import { Box, Grid } from '@mui/material'

import DocumentHostingCard from '@/components/Meeting/DocumentHostingCard'

import type { Meeting } from '@/types/api'

import EventContactsCard from './EventContactsCard'
import KeyDatesCard from './KeyDatesCard'
import MeetingInformationCard from './MeetingInformationCard'
import TabulationTracker from './TabulationTracker'
import TaskCard from './TaskCard'

interface MeetingSectionProps {
  meetingId?: string
  meeting?: Meeting
}

export default function MeetingSection({ meetingId, meeting }: MeetingSectionProps) {
  return (
    <Box display="grid" padding={{ xs: 1, sm: 3 }} gap={3}>
      <TabulationTracker meetingId={meetingId} />
      <Box
        display="grid"
        gridTemplateAreas={{
          xs: `
              "keyDates"
              "tasks"
              "documentLinks"
            `,
          sm: `
              "keyDates"
              "tasks"
              "documentLinks"
            `,
          md: `
              "keyDates keyDates"
              "tasks documentLinks"
            `,
          lg: `
              "keyDates keyDates keydates"
              "tasks tasks documentLinks"
            `,
          xl: `
              "keyDates keyDates keyDates"
              "tasks tasks documentLinks"
            `,
        }}
        gridTemplateColumns={{
          xs: '1fr',
          sm: '1fr',
          lg: '0.9fr 1fr 1fr',
          xl: '0.9fr 1fr 1fr',
        }}
        gap={3}
        sx={{
          transition: 'grid-template-areas 0.3s ease, grid-template-columns 0.3s ease',
        }}
      >
        <KeyDatesCard meeting={meeting} />
        <TaskCard meetingId={meetingId || meeting?.id} />
        <DocumentHostingCard meeting={meeting} />
      </Box>
      <Grid container spacing={3}>
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
    </Box>
  )
}
