'use client'

import PresentationBoardIcon from '@rolemodel/betanxt-design-system/components/icons/brand/PresentationBoardIcon'
import TeamPresentationIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TeamPresentationIcon'
import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Skeleton,
  Stack,
} from '@mui/material'

import DigitalShareholderMeetingCard from '@/components/Meeting/DigitalShareholderMeetingCard'

import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import type { Meeting } from '@/types/api-exports'

import KeyDatesCard from './KeyDatesCard'

// Dynamic imports for heavy components
const VotingTabulationTable = dynamic(
  () => import('@/components/Meeting/VotingTabulationTable'),
  {
    loading: () => <Skeleton variant="rectangular" height={400} />,
    ssr: false,
  }
)

const MeetingRolesCard = dynamic(() => import('@/components/Meeting/MeetingRolesCard'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})

const PreviewLinksCard = dynamic(() => import('@/components/Meeting/PreviewLinksCard'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})

const FeatureTile = dynamic(() => import('@/components/FeatureTile'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})

const SharesVotedChart = dynamic(() => import('@/components/Meeting/SharesVotedChart'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})

interface Phase7LayoutProps {
  meetingId?: string
  meeting?: Meeting
}

export default React.memo(function Phase7Layout({
  meetingId,
  meeting,
}: Phase7LayoutProps) {
  const { proposals, loading: votingLoading } = useVotingTabulation(meetingId)

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Suspense>
        <KeyDatesCard meeting={meeting} />
      </Suspense>
      <Grid container spacing={3}>
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 6 }}
          display="flex"
          flexDirection="column"
          gap={3}
        >
          <DigitalShareholderMeetingCard meetingId={meetingId} />
          <Grid container spacing={3} direction={{ sm: 'column', md: 'row' }}>
            <Grid size={{ sm: 12, md: 12, lg: 6 }}>
              <FeatureTile
                title="Schedule Logistics Call"
                description="Select a date and time for the call"
                actionText="Schedule Call"
                icon={<TeamPresentationIcon fontSize="3xl" />}
                variant="default"
              />
            </Grid>
            <Grid size={{ sm: 12, md: 12, lg: 6 }}>
              <FeatureTile
                title="Schedule Dry Run"
                description="Select a date and time for the dry run"
                actionText="Schedule Dry Run"
                icon={<PresentationBoardIcon fontSize="3xl" />}
                variant="default"
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 6 }}
          display="flex"
          flexDirection="column"
          gap={3}
        >
          <MeetingRolesCard meetingId={meetingId} />
          <PreviewLinksCard />
        </Grid>
      </Grid>
      <Grid container size={12} spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 12, lg: 9 }}>
          <Card>
            <CardHeader
              title="Tabulation"
              action={
                <Button
                  variant="outlined"
                  onClick={() => {}}
                  sx={{ textTransform: 'none' }}
                >
                  View Tabulation
                </Button>
              }
            />
            <CardContent sx={{ p: 0 }}>
              <VotingTabulationTable proposals={proposals} loading={votingLoading} />
            </CardContent>
          </Card>
        </Grid>
        <Grid
          container
          size={{ xs: 12, sm: 6, md: 12, lg: 3 }}
          spacing={3}
          display="flex"
          flexDirection="row"
          alignSelf="flex-start"
        >
          <Stack direction="column" spacing={3}>
            <FeatureTile
              title="Registered Holder Mailing Affidavit"
              titleVariant="h2"
              actionText="Download"
              variant="default"
              onClick={() => {}}
            />
            <FeatureTile
              title="Tabulation Report"
              description="Download the tabulation report"
              titleVariant="h2"
              actionText="Download"
              variant="primary"
              onClick={() => {}}
            />
          </Stack>

          <Grid size={{ xs: 12, sm: 6, md: 12 }}>
            <SharesVotedChart meetingId={meetingId} loading={votingLoading} />
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )
})
