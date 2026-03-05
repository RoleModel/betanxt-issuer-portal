'use client'

import React, { useEffect, useState } from 'react'

import {
  Card,
  CardContent,
  Container,
  LinearProgress,
  Skeleton,
  Stack,
} from '@mui/material'
import Grid from '@mui/material/Grid'

import FeatureTile from '@/components/FeatureTile'
import MailingDataCard from '@/components/Meeting/MailingDataCard'
import MailingTimelineCard from '@/components/Meeting/MailingTimelineCard'

import type { components } from '@/domain-models/generated-schema'

import { useMeeting } from '@/contexts/MeetingContext'
import { useMailing } from '@/hooks/useMailing'

type MailingData = components['schemas']['Mailing']

const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0'
  return num.toLocaleString('en-US')
}

export default function MailingPage() {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting()
  const meetingId = currentMeeting?.id
  const { getMailingByMeetingId, loading: mailingLoading } = useMailing()
  const [mailingData, setMailingData] = useState<MailingData | null>(null)

  useEffect(() => {
    if (meetingId) {
      void getMailingByMeetingId(meetingId).then((data) => {
        setMailingData(data)
      })
    }
  }, [meetingId, getMailingByMeetingId])

  // Show loading state while data is being fetched
  if (meetingLoading || (meetingId && !currentMeeting)) {
    return (
      <LinearProgress
        sx={{
          height: 4,
        }}
      />
    )
  }

  return (
    <Container
      maxWidth="xl"
      sx={{ my: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 12, lg: 9 }}>
          <Stack spacing={2}>
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    {mailingLoading ? (
                      <Skeleton variant="rounded" height={80} />
                    ) : (
                      <FeatureTile
                        height="auto"
                        variant="base"
                        title={formatNumber(mailingData?.fullsetMailPositions)}
                        subtitle="Full Set"
                      />
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    {mailingLoading ? (
                      <Skeleton variant="rounded" height={80} />
                    ) : (
                      <FeatureTile
                        height="auto"
                        variant="base"
                        title={formatNumber(mailingData?.naaMailPositions)}
                        subtitle="NAA"
                      />
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    {mailingLoading ? (
                      <Skeleton variant="rounded" height={80} />
                    ) : (
                      <FeatureTile
                        height="auto"
                        variant="base"
                        title={formatNumber(mailingData?.electronicSuppressedPositions)}
                        subtitle="Electronic"
                      />
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <MailingDataCard meetingId={meetingId} />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 3 }}>
          <MailingTimelineCard
            currentStatus={
              currentMeeting?.mailingStatus as
                | React.ComponentProps<typeof MailingTimelineCard>['currentStatus']
                | undefined
            }
            statusDate={currentMeeting?.updatedAt}
          />
        </Grid>
      </Grid>
    </Container>
  )
}
