'use client'

import React, { useEffect, useState } from 'react'

import FeatureTile from '@/components/FeatureTile'

import buildApiClient from '@/domain-models/apiClient'
import { components } from '@/domain-models/generated-schema'

import { useMeeting } from '@/contexts/MeetingContext'
import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import { exportTabulationPdf } from '@/utils/exportTabulationPdf'

export default function TabulationReportCard() {
  const { currentMeeting } = useMeeting()
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

  const handleDownload = async () => {
    if (!currentMeeting) {
      console.error('Missing meeting data:', currentMeeting)
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

  const isDataReady = !!(currentMeeting && votingProposals.length > 0)

  return (
    <FeatureTile
      title="Tabulation Report"
      variant="info"
      flex={true}
      description="Voting results for each proposal, showing vote counts, percentages, and quorum status."
      actionText={isDataReady ? 'Download' : 'Loading...'}
      onClick={isDataReady ? handleDownload : undefined}
      sx={{
        opacity: isDataReady ? 1 : 0.6,
        cursor: isDataReady ? 'pointer' : 'default',
      }}
    />
  )
}
