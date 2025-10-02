'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { Container, Stack } from '@mui/material'
import Grid from '@mui/material/Grid'

import EmptyState from '@/components/EmptyState'
import BrokerVotingChart from '@/components/Reporting/BrokerVotingChart'
import DownloadReportsTable from '@/components/Reporting/DownloadReportsTable'
import PositionsVotedChart from '@/components/Reporting/PositionsVotedChart'
import TabulationReportCard from '@/components/Reporting/TabulationReportCard'
import VoteDistributionChart from '@/components/Reporting/VoteDistributionChart'
import VoteStatusSummaryTable from '@/components/Reporting/VoteStatusSummaryTable'
import VotingPerformanceChart from '@/components/Reporting/VotingPerformanceChart'

import buildApiClient from '@/domain-models/apiClient'

import { useMeeting } from '@/contexts/MeetingContext'
import { usePhases } from '@/hooks/usePhases'
import { useReports } from '@/hooks/useReports'
import { friendlyDate } from '@/utils/dateUtils'
import { asArray, asRecord, asString } from '@/utils/typeUtils'

const parsePhaseNumber = (phaseLabel?: string | null): number | null => {
  if (!phaseLabel) return null
  const match = phaseLabel.match(/(\d+)/)
  if (!match) return null
  const num = Number(match[1])
  return Number.isFinite(num) ? num : null
}

interface Proposal {
  id: string
  proposalNumber: string
  proposalTitle: string
}

export default function ReportsPage() {
  const { currentMeeting } = useMeeting()
  const meetingId = currentMeeting?.id ?? ''
  const { phases } = usePhases(meetingId)
  const {
    brokerVotingByProposal,
    nonDtcVoteStatus,
    dtcVoteStatus,
    voteDistribution,
    setKeys,
    loading: reportsLoading,
  } = useReports(meetingId)

  // Create proper data structure for PositionsVotedChart using correct CEDE vs Registered categorization
  const positionsVotedData = useMemo(() => {
    if (setKeys.length === 0) return {}

    const firstSetKey = setKeys[0]

    // Based on actual CSV data:
    // - Beneficial = CEDE & CO positions (very few, ~3)
    // - Registered = Registered Account positions (thousands, 17,951)
    //
    // From vote status data:
    // - DTC (CEDE positions): 123 voted + 40 unvoted = 163 total
    // - Non-DTC (Registered positions): 1,689 voted + 16,262 unvoted = 17,951 total

    const dtcVotedItem = dtcVoteStatus.find((item) => item.category === 'Voted')
    const dtcUnvotedItem = dtcVoteStatus.find((item) => item.category === 'Unvoted')

    const nonDtcVotedItem = nonDtcVoteStatus.find(
      (item) => item.category === 'Voted Sub-Total'
    )
    const nonDtcUnvotedItem = nonDtcVoteStatus.find((item) => item.category === 'Unvoted')

    return {
      [firstSetKey]: {
        // Beneficial = CEDE positions (from DTC vote status)
        beneficial: {
          voted: dtcVotedItem?.shareholders || 0,
          notVoted: dtcUnvotedItem?.shareholders || 0,
        },
        // Registered = Registered Account positions (from Non-DTC vote status)
        registered: {
          voted: nonDtcVotedItem?.shareholders || 0,
          notVoted: nonDtcUnvotedItem?.shareholders || 0,
        },
      },
    }
  }, [setKeys, dtcVoteStatus, nonDtcVoteStatus])

  const [proposals, setProposals] = useState<Proposal[]>([])

  // Fetch proposals for the meeting
  useEffect(() => {
    if (!meetingId) return

    const fetchProposals = async () => {
      try {
        const apiClient = await buildApiClient()
        const { data, error } = await apiClient.GET('/meetings/{meetingId}/proposals', {
          params: { path: { meetingId } },
        })

        if (!error && data) {
          const proposalsRaw = Array.isArray(data)
            ? data
            : asArray(asRecord(data)?.proposals) || []

          const proposalsList = proposalsRaw.reduce<Proposal[]>((acc, item) => {
            const record = asRecord(item)
            if (!record) return acc

            const id = asString(record.id)
            if (!id) return acc

            acc.push({
              id,
              proposalNumber:
                asString(record.proposalNumber) || asString(record.proposal_number) || '',
              proposalTitle:
                asString(record.proposalTitle) || asString(record.proposal_title) || '',
            })

            return acc
          }, [])

          setProposals(proposalsList)
        }
      } catch (error) {
        console.error('Failed to fetch proposals:', error)
      }
    }

    fetchProposals()
  }, [meetingId])

  const currentPhaseLabel = useMemo(() => {
    if (!currentMeeting || typeof currentMeeting !== 'object') return undefined
    if ('currentPhase' in currentMeeting) {
      const val = (currentMeeting as Record<string, unknown>)['currentPhase']
      return typeof val === 'string' ? val : undefined
    }
    return undefined
  }, [currentMeeting])

  const currentPhaseNumber = useMemo(() => {
    const fromLabel = parsePhaseNumber(currentPhaseLabel)
    if (fromLabel) return fromLabel
    if (phases.length > 0) {
      return phases.reduce((m, p) => (p.orderIndex > m ? p.orderIndex : m), 0) || null
    }
    return null
  }, [currentPhaseLabel, phases])

  const phaseIsSevenOrGreater = (currentPhaseNumber ?? 0) >= 7

  const meetingDateStr = currentMeeting?.meetingDate
  const friendlyMeetingDate = meetingDateStr ? friendlyDate(meetingDateStr) : 'TBD'

  // Only show the empty state if we have phase data and it's less than 7
  if (phases.length > 0 && !phaseIsSevenOrGreater) {
    return (
      <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
        <EmptyState
          title="Reports"
          description={`Reports will be available starting on ${friendlyMeetingDate}. Check back after the meeting date to download voting reports and analytics.`}
        />
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid
          size={{ xs: 12, lg: 6 }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <BrokerVotingChart
            meetingId={meetingId}
            proposals={proposals}
            brokerData={brokerVotingByProposal}
          />
        </Grid>
        <Grid
          size={{ xs: 12, lg: 6 }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <VotingPerformanceChart meetingId={meetingId} />
        </Grid>
        <Grid
          order={{ xs: 2, lg: 1 }}
          size={{ xs: 12, lg: 6 }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <VoteStatusSummaryTable
            title="Non-DTC/CDS Vote Status Summary"
            data={nonDtcVoteStatus}
            loading={reportsLoading}
          />
          <VoteStatusSummaryTable
            title="DTC/CDS Vote Status Summary"
            data={dtcVoteStatus}
            loading={reportsLoading}
          />
          <DownloadReportsTable />
        </Grid>

        <Grid
          order={{ xs: 1, lg: 2 }}
          size={{ xs: 12, lg: 6 }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row', lg: 'column' }}
            spacing={{ xs: 2, md: 3 }}
          >
            <VoteDistributionChart data={voteDistribution} loading={reportsLoading} />
            <PositionsVotedChart
              meetingId={meetingId}
              setKeys={setKeys}
              data={positionsVotedData}
              loading={reportsLoading}
            />
          </Stack>
          <TabulationReportCard />
        </Grid>
      </Grid>
    </Container>
  )
}
