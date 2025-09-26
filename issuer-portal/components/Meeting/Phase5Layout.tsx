'use client'

import { IconForFileType } from '@rolemodel/betanxt-design-system/components/icons/IconForFileType'
import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

import { CalendarMonthOutlined } from '@mui/icons-material'
import { Box, Grid, Skeleton, Stack } from '@mui/material'

import DocumentSiteCard from '@/components/Documents/DocumentSiteCard'

import type { Meeting } from '@/types/api'

import KeyDatesCard from './KeyDatesCard'

const MeetingDocuments = dynamic(() => import('@/components/Meeting/MeetingDocuments'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})
const VotingSharesCard = dynamic(() => import('@/components/Meeting/VotingSharesCard'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})
const SharesMultiplerCard = dynamic(
  () => import('@/components/Meeting/SharesMultiplierCard'),
  {
    loading: () => <Skeleton variant="rectangular" height={300} />,
    ssr: false,
  }
)

const FeatureTile = dynamic(() => import('@/components/FeatureTile'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})

interface Phase5LayoutProps {
  meetingId?: string
  meeting?: Meeting
  phase?: number
}

export default function Phase5Layout({ meetingId, meeting }: Phase5LayoutProps) {
  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Suspense>
        <KeyDatesCard meeting={meeting} />
      </Suspense>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 6 }}>
          <Stack direction={{ sm: 'row', lg: 'column' }} spacing={2} useFlexGap={true}>
            <MeetingDocuments meetingId={meetingId} meeting={meeting} />
            <VotingSharesCard meetingId={meetingId} />
          </Stack>
        </Grid>

        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 6 }}
          display="flex"
          flexDirection="column"
          gap={3}
        >
          <Stack direction={{ sm: 'row', lg: 'row' }} spacing={2} useFlexGap={true}>
            <FeatureTile
              flex={true}
              title="2025 Meeting Material Quantities"
              actionText="View Details"
              variant="default"
              icon={<IconForFileType fileType="XLSX" />}
            />

            <FeatureTile
              flex={true}
              title="Expected BMK PDF Delivery of 10-K/ AR and Proxy Statement"
              description="Aug 28"
              variant="default"
              icon={<CalendarMonthOutlined fontSize="large" />}
            />
          </Stack>
          <DocumentSiteCard />
          <SharesMultiplerCard />
        </Grid>
      </Grid>
    </Box>
  )
}
