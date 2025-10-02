'use client'

import ChecklistDocumentIcon from '@rolemodel/betanxt-design-system/components/icons/brand/ChecklistDocumentIcon'
import React, { useEffect, useMemo, useState } from 'react'

import { Container, Stack } from '@mui/material'
import Grid from '@mui/material/Grid'

import EmptyState from '@/components/EmptyState'
import BeneficialVsRegisteredCard from '@/components/Tabulation/BeneficialVsRegisteredCard'
import PositionsTable from '@/components/Tabulation/PositionsTable'
import ProposalDetailsCard from '@/components/Tabulation/ProposalDetailsCard'
import SharesVotedCard from '@/components/Tabulation/SharesVotedCard'
import TabulationReportCard from '@/components/Tabulation/TabulationReportCard'
import VotingActivityCard from '@/components/Tabulation/VotingActivityCard'

import buildApiClient from '@/domain-models/apiClient'
import { components } from '@/domain-models/generated-schema'

import { useMeeting } from '@/contexts/MeetingContext'
import { usePhases } from '@/hooks/usePhases'
import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import { friendlyDate } from '@/utils/dateUtils'
import { exportTabulationPdf } from '@/utils/exportTabulationPdf'

const parsePhaseNumber = (phaseLabel?: string | null): number | null => {
  if (!phaseLabel) return null
  const match = phaseLabel.match(/(\d+)/)
  if (!match) return null
  const num = Number(match[1])
  return Number.isFinite(num) ? num : null
}

export default function TabulationPage() {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting()
  const meetingId = currentMeeting?.id ?? ''
  const { phases, loading: phasesLoading } = usePhases(meetingId)

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

  // Call hooks before any conditional returns
  const { proposals: votingProposals, votingSummary } = useVotingTabulation(
    currentMeeting?.id
  )
  const [rawProposals, setRawProposals] = useState<components['schemas']['Proposal'][]>(
    []
  )

  // Fetch raw proposal data to get all fields
  useEffect(() => {
    const fetchProposals = async () => {
      if (!currentMeeting?.id) return

      const apiClient = await buildApiClient()
      const { data } = await apiClient.GET('/meetings/{meetingId}/proposals', {
        params: { path: { meetingId: currentMeeting.id } },
      })

      if (data) {
        const proposals = Array.isArray(data) ? data : []
        setRawProposals(proposals)
      }
    }

    fetchProposals()
  }, [currentMeeting?.id])

  // Show loading state while data is being fetched
  if (meetingLoading || phasesLoading) {
    return null
  }

  const _handleDownload = async () => {
    if (!currentMeeting) {
      alert('Unable to generate report. Meeting data is not available.')
      return
    }
    // Map proposals to the format expected by the PDF export
    const proposalsForExport = votingProposals.map((vp) => {
      const rawProposal = rawProposals.find(
        (rp) =>
          ('proposalNumber' in rp && rp.proposalNumber === vp.proposalNumber) ||
          ('proposal_number' in rp && rp.proposal_number === vp.proposalNumber)
      ) as components['schemas']['Proposal'] | undefined

      return {
        proposalNumber: vp.proposalNumber,
        proposalTitle: vp.description || rawProposal?.proposalTitle || '',
        proposalType: rawProposal?.proposalType || '',
        directorName: vp.directorName || rawProposal?.directorName || '',
        recommendation: rawProposal?.recommendation || 'FOR',
        totalVotesFor: vp.votingResults.for.shares,
        totalVotesAgainst: vp.votingResults.against.shares,
        totalVotesAbstain: vp.votingResults.abstain.shares,
        forPercentage: vp.votingResults.for.percentage,
        againstPercentage: vp.votingResults.against.percentage,
        abstainPercentage: vp.votingResults.abstain.percentage,
      }
    })

    // Calculate quorum data
    const totalOutstanding = votingSummary?.totalSharesOutstanding || 0
    const votesRepresented = votingSummary?.totalSharesVoted || 0
    const quorumPercentage =
      totalOutstanding > 0 ? (votesRepresented / totalOutstanding) * 100 : 0
    const quorumRequirement = '50%' // Default, should come from meeting config
    const votesOverUnderQuorum = votesRepresented - totalOutstanding * 0.5

    // Prepare tabulation data in the format expected by the PDF export
    const tabulationData = {
      companyName:
        currentMeeting.title
          ?.replace(/\d{4}\s*/, '')
          .replace(/Annual.*Meeting.*/, '')
          .trim() ||
        currentMeeting.ticker ||
        'Company',
      meetingType: currentMeeting.meetingType || 'Annual Meeting',
      meetingDate: currentMeeting.meetingDate || '',
      recordDate: currentMeeting.recordDate || '',
      totalOutstanding,
      votesRepresentedForQuorum: votesRepresented,
      quorumPercentage,
      quorumRequirement,
      votesOverUnderQuorum,
      cusipList: currentMeeting.cusip || '', // Use cusip from meeting
      proposals: proposalsForExport.map((p) => {
        const totalVotes = p.totalVotesFor + p.totalVotesAgainst + p.totalVotesAbstain
        const totalOutstanding = votingSummary?.totalSharesOutstanding || 1 // Prevent division by zero

        return {
          proposalNumber: p.proposalNumber.toString(),
          title: p.proposalTitle,
          directorName: p.directorName,
          voteFor: p.totalVotesFor,
          voteAgainst: p.totalVotesAgainst,
          voteAbstain: p.totalVotesAbstain,
          percentFor: p.forPercentage,
          percentAgainst: p.againstPercentage,
          percentAbstain: p.abstainPercentage,
          percentOfOutstanding: (totalVotes / totalOutstanding) * 100,
          percentOfTotalVoted: (totalVotes / votesRepresented) * 100,
          percentOfProposalVotes: 100, // This proposal's votes as % of itself is always 100
        }
      }),
    }

    console.warn('Tabulation data being sent:', {
      companyName: tabulationData.companyName,
      proposalCount: tabulationData.proposals.length,
      firstProposal: tabulationData.proposals[0],
      votingSummary,
      totalOutstanding,
      votesRepresented,
    })

    await exportTabulationPdf({
      tabulationData,
      clientTicker: currentMeeting.ticker || undefined,
    })
  }

  if (phaseIsSevenOrGreater) {
    return (
      <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, lg: 9 }}>
            <Stack spacing={{ xs: 2, md: 3 }}>
              <PositionsTable meetingId={meetingId} />
              <ProposalDetailsCard meetingId={meetingId} />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 3 }}>
            <Stack spacing={{ xs: 2, md: 3 }}>
              <Stack
                spacing={{ xs: 2, md: 3 }}
                direction={{ xs: 'column', sm: 'row', lg: 'column' }}
              >
                <TabulationReportCard />
                <VotingActivityCard meetingId={meetingId} />
              </Stack>
              <Stack
                spacing={{ xs: 2, md: 3 }}
                direction={{ xs: 'column', sm: 'row', lg: 'column' }}
              >
                <BeneficialVsRegisteredCard meetingId={meetingId} />
                <SharesVotedCard meetingId={meetingId} />
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    )
  }
  if (!phaseIsSevenOrGreater) {
    return (
      <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
        <EmptyState
          title="Tabulation"
          icon={<ChecklistDocumentIcon />}
          description={`Tabulation data will be available starting on ${friendlyMeetingDate}. Check back then to review voting results and participation metrics.`}
        />
      </Container>
    )
  }
  return null
}
