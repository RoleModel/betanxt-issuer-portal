'use client'

import { useParams } from 'next/navigation'
import React from 'react'

import { Card, CardContent, CardHeader, Container } from '@mui/material'
import Grid from '@mui/material/Grid'

import EventSummaryTable from '@/components/Reporting/EventSummaryTable'
import QuorumPerformanceTable from '@/components/Reporting/QuorumPerformanceTable'
import YearOverYearChart from '@/components/Reporting/YearOverYearChart'

import { useReporting } from '@/hooks/useReporting'

export default function ReportsPage() {
  const params = useParams()
  const clientTicker = params.clientTicker as string

  const { data, loading } = useReporting(clientTicker)

  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12 }}>
          <EventSummaryTable
            data={data?.mappedEventSummary ?? []}
            loading={loading}
            clientTicker={clientTicker}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardHeader title="Year-over-Year Performance" />
            <CardContent>
              <YearOverYearChart
                data={data?.mappedYearOverYear ?? []}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <QuorumPerformanceTable
            data={data?.mappedQuorumPerformanceData ?? []}
            loading={loading}
            clientTicker={clientTicker}
          />
        </Grid>
      </Grid>
    </Container>
  )
}
