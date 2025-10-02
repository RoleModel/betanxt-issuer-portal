'use client'

import { useParams } from 'next/navigation'
import React, { Suspense, useMemo, useState } from 'react'

import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  MenuItem,
  Skeleton,
  TextField,
} from '@mui/material'
import Grid from '@mui/material/Grid'

import AuditComplianceTable from '@/components/Reporting/AuditComplianceTable'
import ChartToggle from '@/components/Reporting/ChartToggle'
import type { ChartView } from '@/components/Reporting/ChartToggle'
import DirectorPerformanceChart from '@/components/Reporting/DirectorPerformanceChart'
import EventSummaryTable from '@/components/Reporting/EventSummaryTable'
import IndividualDirectorChart from '@/components/Reporting/IndividualDirectorChart'
import ParticipationChart from '@/components/Reporting/ParticipationChart'
import ProposalPerformanceTable from '@/components/Reporting/ProposalPerformanceTable'
import QuorumPerformanceTable from '@/components/Reporting/QuorumPerformanceTable'
import YearOverYearChart from '@/components/Reporting/YearOverYearChart'

import { useReporting } from '@/hooks/useReporting'

// Reusable chart loading skeleton
const ChartSkeleton = () => (
  <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 2 }} />
)

// Helper function to extract director name from proposal title
function extractDirectorName(title: string): string | null {
  // Common patterns for director election proposals
  const patterns = [
    /Election of Director[:\s]+(.+?)(?:\s*$|\s*\()/i,
    /Election of (.+?) as Director/i,
    /Elect (.+?) as Director/i,
    /Director[:\s]+(.+?)(?:\s*$|\s*\()/i,
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) return match[1].trim()
  }

  return null
}

export default function ReportingPage() {
  const params = useParams()
  const clientTicker = params.clientTicker as string

  // Get reporting data from hook
  const { data: reportingData, loading, error } = useReporting(clientTicker)

  // Client-side state for interactive features - MUST be called before any early returns
  const [selectedMeeting, setSelectedMeeting] = useState<string>('')
  const [chartView, setChartView] = useState<ChartView>('aggregate')
  const [selectedDirector, setSelectedDirector] = useState<string>('')

  // Loading states
  const isDirectorLoading = loading
  const isIndividualLoading = loading

  // Set default values when reportingData becomes available
  React.useEffect(() => {
    if (reportingData) {
      // Set first director as default
      if (reportingData.availableDirectors.length > 0 && !selectedDirector) {
        setSelectedDirector(reportingData.availableDirectors[0])
      }
    }
  }, [reportingData, selectedDirector])

  // Use pre-transformed data from the hook
  const mappedEventSummary = reportingData?.mappedEventSummary || []
  const mappedYearOverYear = reportingData?.mappedYearOverYear || []

  // Transform individual director data to chart format (voting trends over years)
  const mappedIndividualDirectorData = useMemo(() => {
    if (!reportingData || !selectedDirector) return []

    // Get proposals for the selected director
    const directorProposals = (reportingData.proposals || []).filter(
      (p) => (p.directorName || '') === selectedDirector
    )

    // Group proposals by year (extract year from meeting ID)
    const proposalsByYear = directorProposals.reduce(
      (acc, proposal) => {
        // Extract year from meetingId (format: ticker-type-year)
        const yearMatch = proposal.meetingId?.match(/\d{4}$/)
        const year = yearMatch ? parseInt(yearMatch[0]) : null

        if (year) {
          if (!acc[year]) {
            acc[year] = []
          }
          acc[year].push(proposal)
        }
        return acc
      },
      {} as Record<number, typeof directorProposals>
    )

    // Calculate average percentages for each year
    return Object.entries(proposalsByYear)
      .map(([yearStr, proposals]) => {
        const year = parseInt(yearStr)

        // Calculate average voting percentages for this year
        let totalFor = 0
        let totalAgainst = 0
        let totalAbstain = 0
        let totalVotes = 0

        proposals.forEach((p) => {
          const forVotes = p.totalVotesFor || 0
          const againstVotes = p.totalVotesAgainst || 0
          const abstainVotes = p.totalVotesAbstain || 0
          const votes = forVotes + againstVotes + abstainVotes

          if (votes > 0) {
            totalFor += forVotes
            totalAgainst += againstVotes
            totalAbstain += abstainVotes
            totalVotes += votes
          }
        })

        return {
          year,
          forPercentage: totalVotes > 0 ? Math.round((totalFor / totalVotes) * 100) : 0,
          againstPercentage:
            totalVotes > 0 ? Math.round((totalAgainst / totalVotes) * 100) : 0,
          abstainPercentage:
            totalVotes > 0 ? Math.round((totalAbstain / totalVotes) * 100) : 0,
        }
      })
      .sort((a, b) => a.year - b.year)
  }, [reportingData, selectedDirector])

  // Filter director performance data by selected meeting
  const directorPerformanceData = useMemo(() => {
    if (!reportingData || !selectedMeeting) {
      return []
    }

    // Get director proposals for the selected meeting only
    const meetingProposals = (reportingData.proposals || []).filter(
      (p) =>
        p.meetingId === selectedMeeting &&
        (p.proposalType === 'Director Election' ||
          p.directorName ||
          /director/i.test(p.proposalTitle || ''))
    )

    // Group by director and calculate percentages
    const directorMap = new Map<
      string,
      {
        directorName: string
        forVotes: number
        againstVotes: number
        abstainVotes: number
        totalVotes: number
      }
    >()

    meetingProposals.forEach((proposal) => {
      const directorName =
        proposal.directorName || extractDirectorName(proposal.proposalTitle || '')

      if (!directorName) return

      const totalVotes =
        (proposal.totalVotesFor || 0) +
        (proposal.totalVotesAgainst || 0) +
        (proposal.totalVotesAbstain || 0)

      if (totalVotes > 0) {
        directorMap.set(directorName, {
          directorName,
          forVotes: proposal.totalVotesFor || 0,
          againstVotes: proposal.totalVotesAgainst || 0,
          abstainVotes: proposal.totalVotesAbstain || 0,
          totalVotes,
        })
      }
    })

    return Array.from(directorMap.values())
  }, [reportingData, selectedMeeting])

  // Use pre-transformed data from the hook
  const mappedProposalPerformanceData = reportingData?.mappedProposalPerformanceData || []
  const mappedAuditComplianceData = reportingData?.mappedAuditComplianceData || []
  const mappedQuorumPerformanceData = reportingData?.mappedQuorumPerformanceData || []

  // Handle meeting selection change - SWR automatically handles caching
  const handleMeetingChange = React.useCallback((meetingId: string) => {
    setSelectedMeeting(meetingId)
  }, [])

  // Handle director selection change - SWR automatically handles caching
  const handleDirectorChange = React.useCallback((directorName: string) => {
    setSelectedDirector(directorName)
  }, [])

  // Filter available meetings to only those with director data AND vote totals
  const meetingsWithDirectors = useMemo(() => {
    if (!reportingData) return []
    const availableMeetings = reportingData.availableMeetings || []

    return availableMeetings.filter((meeting) => {
      // Check if this meeting has any director proposals WITH vote data
      const hasDirectorProposals = (reportingData.proposals || []).some((p) => {
        if (p.meetingId !== meeting.id) return false

        const isDirectorProposal =
          p.proposalType === 'Director Election' ||
          p.directorName ||
          /director/i.test(p.proposalTitle || '')

        // Check if there are actual votes (not just null values)
        const hasVotes =
          (p.totalVotesFor || 0) +
            (p.totalVotesAgainst || 0) +
            (p.totalVotesAbstain || 0) >
          0

        return isDirectorProposal && hasVotes
      })
      return hasDirectorProposals
    })
  }, [reportingData])

  // Set default meeting when filtered meetings are available
  React.useEffect(() => {
    if (meetingsWithDirectors.length > 0 && !selectedMeeting) {
      setSelectedMeeting(meetingsWithDirectors[0].id)
    } else if (
      reportingData &&
      reportingData.availableMeetings.length > 0 &&
      !selectedMeeting
    ) {
      // Fallback: if no meetings with directors found, use first available meeting
      setSelectedMeeting(reportingData.availableMeetings[0].id)
    }
  }, [meetingsWithDirectors, selectedMeeting, reportingData])

  if (error) {
    return (
      <Container component="main" maxWidth="xl" sx={{ p: 3 }}>
        <Alert severity="error">{String(error)}</Alert>
      </Container>
    )
  }

  const availableDirectors = reportingData?.availableDirectors ?? []

  return (
    <Container
      component="main"
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
          <Suspense fallback={<ChartSkeleton />}>
            <EventSummaryTable data={mappedEventSummary} clientTicker={clientTicker} />
          </Suspense>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <Card sx={{ height: '100%' }}>
              <CardHeader title="Participation" />
              <CardContent
                sx={{
                  display: 'flex',
                  flexGrow: 1,
                  alignItems: 'center',
                  justifyItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ParticipationChart
                  data={{
                    meetings: mappedEventSummary.map((event) => ({
                      event: event.event,
                      participationRate: parseFloat(event.participation.replace('%', '')),
                      meetingYear: event.meetingYear,
                    })),
                  }}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </Suspense>
        </Grid>

        {/* Second Row - Year-over-Year and Director Performance Charts */}
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
                      {meetingsWithDirectors.map((meeting) => {
                        // Extract year from meetingId (format: ticker-type-year)
                        const yearMatch = meeting.id.match(/(\d{4})$/)
                        const year = yearMatch ? yearMatch[1] : ''
                        const displayTitle = year
                          ? `${meeting.title} ${year}`
                          : meeting.title
                        return (
                          <MenuItem key={meeting.id} value={meeting.id}>
                            {displayTitle}
                          </MenuItem>
                        )
                      })}
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
              {chartView === 'aggregate' ? (
                <DirectorPerformanceChart
                  data={directorPerformanceData || []}
                  loading={loading}
                />
              ) : (
                <IndividualDirectorChart
                  directorName={selectedDirector || ''}
                  data={mappedIndividualDirectorData}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Proposal Performance Table */}
        <Grid size={{ xs: 12 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <ProposalPerformanceTable data={mappedProposalPerformanceData} />
          </Suspense>
        </Grid>

        {/* Third Row - Audit & Compliance and Quorum Performance Tables */}
        <Grid size={{ xs: 12, lg: 6.5 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <AuditComplianceTable
              data={mappedAuditComplianceData}
              clientTicker={clientTicker}
            />
          </Suspense>
        </Grid>

        <Grid size={{ xs: 12, lg: 5.5 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <QuorumPerformanceTable
              data={mappedQuorumPerformanceData}
              clientTicker={clientTicker}
            />
          </Suspense>
        </Grid>
      </Grid>
    </Container>
  )
}
