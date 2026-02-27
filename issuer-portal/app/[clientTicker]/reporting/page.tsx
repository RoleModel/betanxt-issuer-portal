'use client'

import { useParams } from 'next/navigation'
import { Suspense } from 'react'

import { Alert, Card, CardContent, CardHeader, Container, Skeleton } from '@mui/material'
import Grid from '@mui/material/Grid'

import EventSummaryTable from '@/components/Reporting/EventSummaryTable'
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
  const mappedQuorumPerformanceData = reportingData?.mappedQuorumPerformanceData ?? []

  if (error) {
    return (
      <Container component="main" maxWidth="xl" sx={{ p: 3 }}>
        <Alert severity="error">{String(error)}</Alert>
      </Container>
    )
  }

  return (
    <Container
      component="main"
      maxWidth="xl"
      sx={{ p: { xs: 1, md: 3 } }}
    >
      <Grid container spacing={3}>
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
              <CardHeader title="Year-over-Year Performance" />
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
      </Grid>
    </Container>
  )
}
