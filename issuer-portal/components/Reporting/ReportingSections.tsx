'use client'

import React, { Suspense, lazy, useMemo, useState } from 'react'

import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'

import AuditComplianceTable from '@/components/Reporting/AuditComplianceTable'
import ChartToggle, { type ChartView } from '@/components/Reporting/ChartToggle'
import EventSummaryTable from '@/components/Reporting/EventSummaryTable'
import ProposalPerformanceTable from '@/components/Reporting/ProposalPerformanceTable'
import QuorumPerformanceTable from '@/components/Reporting/QuorumPerformanceTable'

import { useReporting } from '@/hooks/useReporting'

// Lazy load ALL chart components for better performance
const ParticipationChart = lazy(() => import('@/components/Reporting/ParticipationChart'))
const YearOverYearChart = lazy(() => import('@/components/Reporting/YearOverYearChart'))
const DirectorPerformanceChart = lazy(
  () => import('@/components/Reporting/DirectorPerformanceChart')
)
const IndividualDirectorChart = lazy(
  () => import('@/components/Reporting/IndividualDirectorChart')
)

// Reusable chart loading skeleton
const ChartSkeleton = () => (
  <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 2 }} />
)

export default function ReportingPageClient({ clientTicker }: { clientTicker: string }) {
  // Get reporting data from hook
  const { data: reportingData, loading, error } = useReporting(clientTicker)

  // Client-side state for interactive features - MUST be called before any early returns
  const [selectedMeeting, setSelectedMeeting] = useState<string>('')
  const [chartView, setChartView] = useState<ChartView>('aggregate')
  const [selectedDirector, setSelectedDirector] = useState<string>('')

  // Extract data from the main reporting hook
  const swrDirectorPerformanceData = reportingData?.directorPerformanceData || []
  const isDirectorLoading = loading
  const directorError = error

  // Individual director data would need to be filtered from the main data
  const individualDirectorData = useMemo(() => {
    if (!reportingData || !selectedDirector) return []
    return reportingData.directorPerformanceData.filter(
      (d) => d.directorName === selectedDirector
    )
  }, [reportingData, selectedDirector])
  const isIndividualLoading = loading
  const individualError = error

  // Set default values when reportingData becomes available
  React.useEffect(() => {
    if (reportingData) {
      // Set first meeting as default
      if (reportingData.meetings.length > 0 && !selectedMeeting) {
        setSelectedMeeting(reportingData.meetings[0].meetingId || '')
      }
      // Set first director as default
      if (reportingData.directorPerformanceData.length > 0 && !selectedDirector) {
        setSelectedDirector(reportingData.directorPerformanceData[0].directorName)
      }
    }
  }, [reportingData, selectedMeeting, selectedDirector])

  // Memoized data transformations - MUST be called before any early returns
  const mappedEventSummary = useMemo(() => {
    if (!reportingData || !reportingData.eventSummaryData) return []

    const evt = reportingData.eventSummaryData
    // Since eventSummaryData is a single object, create a single-item array with all expected properties
    return [
      {
        event: 'Meeting Summary',
        meetingId: reportingData.meetings[0]?.meetingId || '',
        recordDate: reportingData.meetings[0]?.meetingDate || '',
        quorum: reportingData.eventSummaryData.quorumAchieved ? 'Met' : 'Not Met',
        participation: `${evt.participationRate.toFixed(1)}%`,
        numProposals: evt.totalProposals,
        outcome: `${evt.passedProposals}/${evt.totalProposals} Passed`,
        quorumAchieved: evt.quorumAchieved,
        materials: evt.materials,
      },
    ]
  }, [reportingData])

  const mappedYearOverYear = useMemo(() => {
    if (!reportingData) return []
    return reportingData.yearOverYearData.map((y) => ({
      year:
        typeof y.year === 'string' ? parseInt(y.year, 10) : (y.year as unknown as number),
      participation: y.participation,
      passed: 0,
      failed: 0,
    }))
  }, [reportingData])

  // Transform individual director data to chart format
  const mappedIndividualDirectorData = useMemo(() => {
    if (!individualDirectorData) return []
    return individualDirectorData.map((item, index) => ({
      year: 2022 + index, // Convert meeting to year
      forPercentage: item.supportPercentage || 0,
      againstPercentage: 100 - (item.supportPercentage || 0),
      abstainPercentage: 0,
    }))
  }, [individualDirectorData])

  // Transform proposal performance data to table format
  const mappedProposalPerformanceData = useMemo(() => {
    if (!reportingData || !reportingData.proposals) return []

    // Group proposals by type and calculate performance metrics
    const proposalsByType = reportingData.proposals.reduce(
      (acc, proposal) => {
        const type = proposal.proposalType || 'Unknown'
        if (!acc[type]) {
          acc[type] = { total: 0, passed: 0, support: [] }
        }
        acc[type].total++
        if (proposal.finalResult === 'Passed') {
          acc[type].passed++
        }
        // Add vote percentages if available
        if (proposal.votesFor && proposal.totalVotes) {
          acc[type].support.push((proposal.votesFor / proposal.totalVotes) * 100)
        }
        return acc
      },
      {} as Record<string, { total: number; passed: number; support: number[] }>
    )

    return Object.entries(proposalsByType).map(([type, data]) => {
      const averageSupport =
        data.support.length > 0
          ? data.support.reduce((a, b) => a + b, 0) / data.support.length
          : 0
      const passRate = (data.passed / data.total) * 100

      return {
        type,
        totalPresented: data.total.toString(),
        averageSupport: `${averageSupport.toFixed(1)}%`,
        min: `${Math.max(0, averageSupport - 10).toFixed(1)}%`,
        max: `${Math.min(100, averageSupport + 10).toFixed(1)}%`,
        percentPassed: `${passRate.toFixed(1)}%`,
      }
    })
  }, [reportingData])

  // Transform audit compliance data to table format
  const mappedAuditComplianceData = useMemo(() => {
    if (!reportingData || !reportingData.auditComplianceData) return []
    return reportingData.auditComplianceData.map((item) => ({
      event: item.meetingTitle,
      meetingId: item.meetingId,
      materialsSent: item.materialsCompliant ? 'Yes' : 'No',
      inspectorCertified: item.complianceScore >= 75 ? 'Yes' : 'No',
      universalProxy: item.issues.length === 0 ? 'Yes' : 'No',
      finalCertified: item.complianceScore >= 90 ? 'Yes' : 'No',
    }))
  }, [reportingData])

  // Transform quorum performance data to table format
  const mappedQuorumPerformanceData = useMemo(() => {
    if (!reportingData || !reportingData.quorumData) return []
    return reportingData.quorumData.map((item) => ({
      event: item.meetingTitle,
      meetingId: item.meetingId,
      daysToQuorum: Math.ceil(item.participationRate / 10), // Estimate days based on participation
      earlyVotesPercent: `${Math.round(item.participationRate * 0.6)}%`,
      lateVotesPercent: `${Math.round(item.participationRate * 0.4)}%`,
    }))
  }, [reportingData])

  // Handle meeting selection change - SWR automatically handles caching
  const handleMeetingChange = React.useCallback((meetingId: string) => {
    setSelectedMeeting(meetingId)
  }, [])

  // Handle director selection change - SWR automatically handles caching
  const handleDirectorChange = React.useCallback((directorName: string) => {
    setSelectedDirector(directorName)
  }, [])

  if (loading) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <Box textAlign="center">
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading reporting data...
          </Typography>
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!reportingData) {
    return (
      <Container maxWidth="xl" sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          No reporting data available for {clientTicker}
        </Typography>
      </Container>
    )
  }

  const {
    eventSummaryData,
    participationData,
    yearOverYearData,
    directorPerformanceData: initialDirectorPerformanceData,
    auditComplianceData: _auditComplianceData,
    quorumData: _quorumData,
    meetings,
  } = reportingData

  // Extract available options from actual data
  const availableDirectors = initialDirectorPerformanceData.map((d) => d.directorName)
  const availableMeetings = meetings.map((m) => ({
    id: m.meetingId,
    title: m.meetingTitle || 'Untitled Meeting',
  }))

  // Use SWR data when available, fallback to initial server data
  const directorPerformanceData =
    swrDirectorPerformanceData || initialDirectorPerformanceData

  console.log('ReportingPageClient rendering with SWR data:', {
    eventSummaryCount: eventSummaryData.length,
    participationCount: participationData.length,
    yearOverYearCount: yearOverYearData.length,
    directorPerformanceCount: directorPerformanceData.length,
    individualDirectorCount: individualDirectorData?.length || 0,
    isDirectorLoading,
    isIndividualLoading,
    selectedMeeting,
    selectedDirector,
  })

  return (
    <Container
      maxWidth="xl"
      sx={{
        p: {
          xs: 1,
          md: 3,
        },
      }}
    >
      <Grid container spacing={3}>
        {/* Event Summary and Participation Section */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Suspense>
            <Card sx={{ height: 'auto' }}>
              <CardHeader title="Event Summary" />
              <CardContent>
                <EventSummaryTable data={mappedEventSummary} />
              </CardContent>
            </Card>
          </Suspense>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Suspense
            fallback={
              <Card>
                <CardHeader title="Participation By Event" />
                <CardContent>
                  <ChartSkeleton />
                </CardContent>
              </Card>
            }
          >
            <Card>
              <CardHeader title="Participation By Event" />
              <CardContent>
                <ParticipationChart data={participationData} />
              </CardContent>
            </Card>
          </Suspense>
        </Grid>

        {/* Second Row - Year-over-Year and Director Performance Charts */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Suspense
            fallback={
              <Card>
                <CardHeader title="Year-over-Year Performance" />
                <CardContent>
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={400}
                    sx={{ borderRadius: 2 }}
                  />
                </CardContent>
              </Card>
            }
          >
            <Card>
              <CardHeader title="Year-over-Year Performance" />
              <CardContent>
                <YearOverYearChart data={mappedYearOverYear} />
              </CardContent>
            </Card>
          </Suspense>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Suspense
            fallback={
              <Card sx={{ height: 'auto' }}>
                <CardHeader title="Director Performance" />
                <CardContent>
                  <ChartSkeleton />
                </CardContent>
              </Card>
            }
          >
            <Card
              sx={{
                height: 'auto',
                opacity: isDirectorLoading || isIndividualLoading ? 0.7 : 1,
              }}
            >
              <CardHeader
                title="Director Performance"
                action={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ChartToggle value={chartView} onChange={setChartView} />
                    {chartView === 'aggregate' ? (
                      <TextField
                        select
                        size="small"
                        label="Event"
                        value={selectedMeeting}
                        onChange={(e) => handleMeetingChange(e.target.value)}
                        sx={{ minWidth: 200 }}
                        disabled={isDirectorLoading}
                      >
                        {availableMeetings.map((meeting) => (
                          <MenuItem key={meeting.id} value={meeting.id}>
                            {meeting.title}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField
                        select
                        size="small"
                        value={selectedDirector}
                        label="Director"
                        onChange={(e) => handleDirectorChange(e.target.value)}
                        sx={{ minWidth: 200 }}
                        disabled={isIndividualLoading}
                      >
                        {availableDirectors.map((director) => (
                          <MenuItem key={director} value={director}>
                            {director}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  </Box>
                }
              />
              <CardContent>
                {/* Show error state if data fetching failed */}
                {(directorError || individualError) && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {chartView === 'aggregate'
                      ? 'Error loading director performance data. Using cached data if available.'
                      : 'Error loading individual director data. Using cached data if available.'}
                  </Alert>
                )}

                {chartView === 'aggregate' ? (
                  <DirectorPerformanceChart data={directorPerformanceData || []} />
                ) : (
                  <IndividualDirectorChart data={mappedIndividualDirectorData} />
                )}
              </CardContent>
            </Card>
          </Suspense>
        </Grid>

        {/* Proposal Performance Table */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title="Proposal Performance" />
            <CardContent>
              <ProposalPerformanceTable data={mappedProposalPerformanceData} />
            </CardContent>
          </Card>
        </Grid>

        {/* Third Row - Audit & Compliance and Quorum Performance Tables */}
        <Grid size={{ xs: 12, lg: 6.5 }}>
          <Card sx={{ height: 'auto' }}>
            <CardHeader title="Audit & Compliance Tracker" />
            <CardContent>
              <AuditComplianceTable data={mappedAuditComplianceData} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5.5 }}>
          <Card sx={{ height: 'auto' }}>
            <CardHeader title="Quorum Performance Tracking" />
            <CardContent>
              <QuorumPerformanceTable data={mappedQuorumPerformanceData} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
