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

export default function ReportingPage() {
  const params = useParams()
  const clientTicker = params.clientTicker as string

  // Get reporting data from hook
  const reportingResult = useReporting(clientTicker)
  const { data: reportingData, loading, error } = reportingResult

  // Client-side state for interactive features - MUST be called before any early returns
  const [selectedMeeting, setSelectedMeeting] = useState<string>('')
  const [selectedDirector, setSelectedDirector] = useState<string>('')

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
  const mappedEventSummary = reportingData?.mappedEventSummary ?? []
  const mappedYearOverYear = reportingData?.mappedYearOverYear ?? []

  // Transform individual director data to chart format (voting trends over years)
  const mappedIndividualDirectorData = useMemo(() => {
    if (!reportingData || !selectedDirector) return []

    // Get proposals for the selected director
    const directorProposals = (reportingData.proposals ?? []).filter(
      (p) => (p.directorName ?? '') === selectedDirector
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
          const forVotes = p.totalVotesFor ?? 0
          const againstVotes = p.totalVotesAgainst ?? 0
          const abstainVotes = p.totalVotesAbstain ?? 0
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

  // Use pre-transformed data from the hook
  const mappedAuditComplianceData = reportingData?.mappedAuditComplianceData ?? []
  const mappedQuorumPerformanceData = reportingData?.mappedQuorumPerformanceData ?? []

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
    const availableMeetings = reportingData.availableMeetings ?? []

    return availableMeetings.filter((meeting) => {
      // Check if this meeting has any director proposals WITH vote data
      const hasDirectorProposals = (reportingData.proposals ?? []).some((p) => {
        if (p.meetingId !== meeting.id) return false

        const isDirectorProposal =
          p.proposalType === 'Director Election' ||
          Boolean(p.directorName) ||
          /director/i.test(p.proposalTitle ?? '')

        // Check if there are actual votes (not just null values)
        const hasVotes =
          (p.totalVotesFor ?? 0) +
            (p.totalVotesAgainst ?? 0) +
            (p.totalVotesAbstain ?? 0) >
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
        <Grid size={12}>
          <Suspense fallback={<ChartSkeleton />}>
            <EventSummaryTable
              data={mappedEventSummary}
              clientTicker={clientTicker}
              loading={loading}
            />
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

        {/* Proposal Performance Table 
        <Grid size={{ xs: 12 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <ProposalPerformanceTable
              data={mappedProposalPerformanceData}
              loading={loading}
            />
          </Suspense>
        </Grid>
        */}

        {/* Third Row - Audit & Compliance and Quorum Performance Tables 
        <Grid size={{ xs: 12, lg: 6.5 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <AuditComplianceTable
              data={mappedAuditComplianceData}
              clientTicker={clientTicker}
              loading={loading}
            />
          </Suspense>
        </Grid>
        */}

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
