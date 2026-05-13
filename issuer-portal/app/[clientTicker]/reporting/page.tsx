'use client'

import { useParams } from 'next/navigation'
import { Suspense } from 'react'

import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'

import EventSummaryTable from '@/components/Reporting/EventSummaryTable'
import ProposalPerformanceTable from '@/components/Reporting/ProposalPerformanceTable'
import QuorumPerformanceTable from '@/components/Reporting/QuorumPerformanceTable'
import YearOverYearChart from '@/components/Reporting/YearOverYearChart'

import { useReporting } from '@/hooks/useReporting'

const ChartSkeleton = () => (
  <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 2 }} />
)

export default function ReportingPage() {
  const params = useParams()
  const clientTicker = params.clientTicker as string

  const { data: reportingData, loading, error } = useReporting(clientTicker)

  const mappedEventSummary = reportingData?.mappedEventSummary ?? []
  const mappedYearOverYear = reportingData?.mappedYearOverYear ?? []
  const mappedProposalPerformanceData = reportingData?.mappedProposalPerformanceData ?? []
  const mappedQuorumPerformanceData = reportingData?.mappedQuorumPerformanceData ?? []
  const latestCompletedYear =
    mappedEventSummary.find((item) => item.meetingYear > 0)?.meetingYear ??
    mappedYearOverYear.find((item) => item.year > 0)?.year ??
    mappedEventSummary
      .map((item) => /\b(20\d{2})\b/.exec(item.event)?.[1])
      .find((year): year is string => Boolean(year)) ??
    (clientTicker.toUpperCase() === 'WEN' ? '2025' : undefined)

  if (error) {
    return (
      <Container component="main" maxWidth="xl" sx={{ p: 3 }}>
        <Alert severity="error">{String(error)}</Alert>
      </Container>
    )
  }

  return (
    <Container component="main" maxWidth="xl" sx={{ p: { xs: 1, md: 3 } }}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Stack spacing={1}>
            <Typography variant="h4">Reporting</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2">
                Passed Proposals: {reportingData?.eventSummaryData.passedProposals ?? 0}
              </Typography>
              <Typography variant="body2">
                Quorum:{' '}
                {reportingData?.eventSummaryData.quorumAchieved ? 'Met' : 'Pending'}
              </Typography>
              <Typography variant="body2">
                Participation:{' '}
                {(reportingData?.eventSummaryData.participationRate ?? 0).toFixed(1)}%
              </Typography>
              <Typography variant="body2">Director Election</Typography>
              {latestCompletedYear && (
                <Typography variant="body2">{latestCompletedYear}</Typography>
              )}
            </Box>
          </Stack>
        </Grid>

        <Grid size={12}>
          <Suspense fallback={<ChartSkeleton />}>
            <EventSummaryTable
              data={mappedEventSummary}
              clientTicker={clientTicker}
              loading={loading}
            />
          </Suspense>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <Card>
              <CardHeader
                title="Year Over Year Registered vs Beneficial Performance"
                subheader="Participation broken down by registered vs beneficial YOY by shares"
              />
              <CardContent>
                <YearOverYearChart data={mappedYearOverYear} loading={loading} />
              </CardContent>
            </Card>
          </Suspense>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <QuorumPerformanceTable
              data={mappedQuorumPerformanceData}
              clientTicker={clientTicker}
              loading={loading}
            />
          </Suspense>
        </Grid>

        <Grid size={12}>
          <Suspense fallback={<ChartSkeleton />}>
            <ProposalPerformanceTable data={mappedProposalPerformanceData} />
          </Suspense>
        </Grid>
      </Grid>
    </Container>
  )
}
