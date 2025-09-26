'use client'

import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

import { Box, Grid, Skeleton, Stack } from '@mui/material'

import DigitalShareholderMeetingCard from '@/components/Meeting/DigitalShareholderMeetingCard'

import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import type { Meeting } from '@/types/api'

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

const FeatureTile = dynamic(() => import('@/components/FeatureTile'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})

const SharesVotedChart = dynamic(() => import('@/components/Meeting/SharesVotedChart'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})

interface Phase6LayoutProps {
  meetingId?: string
  meeting?: Meeting
  phase?: number
}

export default function Phase6Layout({ meetingId, meeting }: Phase6LayoutProps) {
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
        </Grid>
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 6 }}
          display="flex"
          flexDirection="column"
          gap={3}
        >
          <MeetingRolesCard meetingId={meetingId} />
        </Grid>
      </Grid>
      <Grid container spacing={3} direction={{ sm: 'column', md: 'row' }}>
        <Grid size={{ sm: 12, md: 6, lg: 6 }}>
          <FeatureTile
            title="Official Master Tabulation Total"
            subtitle="3,000,987"
            description="Comprehensive tabulation data available 15 days ahead of Meeting Date"
            variant="default"
          />
        </Grid>
        <Grid size={{ sm: 12, md: 6, lg: 6 }}>
          <FeatureTile
            title="Registered Holder Mailing Affidavit"
            actionText="Download"
            variant="default"
          />
        </Grid>
      </Grid>
      <Grid container size={12} spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 12, lg: 9 }}>
          <VotingTabulationTable
            proposals={proposals}
            loading={votingLoading}
            onViewTabulation={() => {}}
          />
        </Grid>
        <Grid
          container
          size={{ xs: 12, lg: 3 }}
          spacing={3}
          display="flex"
          flexDirection="row"
          alignSelf="flex-start"
        >
          <Grid size={{ xs: 12, sm: 6, md: 12 }}>
            <Stack direction={{ sm: 'row', lg: 'column' }} spacing={2} useFlexGap={true}>
              <FeatureTile
                title="Registered Holder Mailing Affidavit"
                titleVariant="h2"
                flex={true}
                actionText="Download"
                variant="default"
                onClick={() => {}}
              />
              <FeatureTile
                title="Tabulation Report"
                description="Download the tabulation report"
                titleVariant="h2"
                flex={true}
                actionText="Download"
                variant="primary"
                onClick={() => {}}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 12 }}>
            <SharesVotedChart meetingId={meetingId} loading={votingLoading} />
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )
}
