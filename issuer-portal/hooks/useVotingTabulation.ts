'use client'

import useSWR from 'swr'

import buildApiClient from '@/domain-models/apiClient'
import { asArray, asRecord, asString } from '@/utils/typeUtils'
import type { ProposalVoting, VotingSummary } from '@/types/phases'

// Type for normalized position with guaranteed fields
export interface NormalizedPosition {
  id: string
  voteStatus: string
  shares: number
  sharesVoted: number
  votingSource?: string
}

// Type for normalized proposal
export interface NormalizedProposal {
  id: string
  proposalNumber: number
  title: string
  proposalType?: string
  recommendation?: string
  directorName?: string
  totalVotesFor: number
  totalVotesAgainst: number
  totalVotesAbstain: number
}

// Normalize position data to ensure consistent fields
function normalizePosition(position: unknown): NormalizedPosition | null {
  if (!position) return null

  const record = asRecord(position)
  if (!record) return null

  return {
    id: asString(record.id) || '',
    voteStatus: asString(record.voteStatus) || asString(record.vote_status) || 'UNVOTED',
    shares: Number(record.shares) || 0,
    sharesVoted: Number(record.sharesVoted) || Number(record.shares_voted) || 0,
    votingSource: asString(record.votingSource) || asString(record.voting_source) || asString(record.source) || undefined,
  }
}

// Normalize proposal data to ensure consistent fields
function normalizeProposal(proposal: unknown): NormalizedProposal | null {
  if (!proposal) return null

  const record = asRecord(proposal)
  if (!record) return null

  return {
    id: asString(record.id) || '',
    proposalNumber: Number(record.proposalNumber) || Number(record.proposal_number) || 0,
    title: asString(record.proposalTitle) || asString(record.title) || asString(record.proposal_title) || '',
    proposalType: asString(record.proposalType) || asString(record.proposal_type) || undefined,
    recommendation: asString(record.recommendation) || undefined,
    directorName: asString(record.directorName) || asString(record.director_name) || undefined,
    totalVotesFor: Number(record.totalVotesFor) || Number(record.total_votes_for) || 0,
    totalVotesAgainst: Number(record.totalVotesAgainst) || Number(record.total_votes_against) || 0,
    totalVotesAbstain: Number(record.totalVotesAbstain) || Number(record.total_votes_abstain) || 0,
  }
}

export interface UseVotingTabulationResult {
  proposals: ProposalVoting[]
  votingSummary: VotingSummary | null
  loading: boolean
  error: string | null
  refetch: () => void
}

const fetchVotingData = async (meetingId: string) => {
  const apiClient = await buildApiClient()

  // Fetch proposals and positions in parallel
  const [proposalsResult, positionsResult] = await Promise.all([
    apiClient.GET('/meetings/{meetingId}/proposals', {
      params: { path: { meetingId } },
    }),
    apiClient.GET('/positions', {
      params: { query: { meetingId } },
    }),
  ])

  if (proposalsResult.error) {
    throw new Error('Failed to fetch proposals')
  }

  const proposalsRaw = Array.isArray(proposalsResult.data)
    ? proposalsResult.data
    : asArray(asRecord(proposalsResult.data)?.proposals)
  const proposals = proposalsRaw
    .map((proposal) => normalizeProposal(proposal))
    .filter((proposal): proposal is NormalizedProposal => proposal !== null)

  const positionsRaw = Array.isArray(positionsResult.data)
    ? positionsResult.data
    : asArray(asRecord(positionsResult.data)?.positions)
  const positions = positionsRaw
    .map((position) => normalizePosition(position))
    .filter((position): position is NormalizedPosition => position !== null)

  // Calculate voting summary
  const totalPositions = positions.length
  const positionsVoted = positions.filter((p) => p.voteStatus === 'Voted').length
  const totalShares = positions.reduce((sum, p) => sum + p.shares, 0)
  const sharesVoted = positions
    .filter((p) => p.voteStatus === 'Voted')
    .reduce((sum, p) => sum + p.sharesVoted, 0)

  const percentageVoted = totalShares > 0 ? (sharesVoted / totalShares) * 100 : 0

  // Count voting methods
  const webVotes = positions.filter((p) => p.votingSource === 'WEB').length
  const paperVotes = positions.filter((p) => p.votingSource === 'PRINT').length
  const phoneVotes = positions.filter((p) => p.votingSource === 'IVR').length

  // Calculate real voting breakdown by aggregating all proposals
  let totalForShares = 0
  let totalAgainstShares = 0
  let totalAbstainShares = 0

  proposals.forEach((proposal) => {
    const proposalFor = proposal.totalVotesFor
    const proposalAgainst = proposal.totalVotesAgainst
    const proposalAbstain = proposal.totalVotesAbstain

    totalForShares += proposalFor
    totalAgainstShares += proposalAgainst
    totalAbstainShares += proposalAbstain
  })

  // Use the aggregate totals for the chart (not averages)
  const forShares = totalForShares
  const againstShares = totalAgainstShares
  const abstainShares = totalAbstainShares
  const withholdShares = 0 // No withhold in the actual data

  // Calculate total shares from actual voting data
  const totalVotingShares = forShares + againstShares + abstainShares + withholdShares

  const votingBreakdown = {
    for: {
      shares: forShares,
      percentage: totalVotingShares > 0 ? (forShares / totalVotingShares) * 100 : 0,
    },
    against: {
      shares: againstShares,
      percentage: totalVotingShares > 0 ? (againstShares / totalVotingShares) * 100 : 0,
    },
    abstain: {
      shares: abstainShares,
      percentage: totalVotingShares > 0 ? (abstainShares / totalVotingShares) * 100 : 0,
    },
    withhold: {
      shares: withholdShares,
      percentage: totalVotingShares > 0 ? (withholdShares / totalVotingShares) * 100 : 0,
    },
  }

  const summary: VotingSummary = {
    totalSharesVoted: sharesVoted,
    totalSharesOutstanding: totalShares,
    percentageVoted: Math.round(percentageVoted * 100) / 100, // Round to 2 decimal places
    positionsVoted,
    totalPositions,
    lastUpdated: new Date().toISOString(),
    votingMethods: {
      web: webVotes,
      paper: paperVotes,
      phone: phoneVotes,
    },
    votingBreakdown,
  }

  // Transform proposals data for voting display
  const votingProposals: ProposalVoting[] = proposals.map((proposal) => {
    // Use actual voting data from the database
    const proposalForShares = proposal.totalVotesFor
    const proposalAgainstShares = proposal.totalVotesAgainst
    const proposalAbstainShares = proposal.totalVotesAbstain

    const proposalTotalVoted =
      proposalForShares + proposalAgainstShares + proposalAbstainShares

    const realVotingResults = {
      for: {
        shares: proposalForShares,
        percentage:
          proposalTotalVoted > 0 ? (proposalForShares / proposalTotalVoted) * 100 : 0,
      },
      against: {
        shares: proposalAgainstShares,
        percentage:
          proposalTotalVoted > 0 ? (proposalAgainstShares / proposalTotalVoted) * 100 : 0,
      },
      abstain: {
        shares: proposalAbstainShares,
        percentage:
          proposalTotalVoted > 0 ? (proposalAbstainShares / proposalTotalVoted) * 100 : 0,
      },
    }

    return {
      proposalId: proposal.id || '',
      proposalNumber: proposal.proposalNumber,
      description: proposal.title,
      directorName: proposal.directorName,
      votingResults: realVotingResults,
      totalShares: proposalTotalVoted,
      status: 'active' as const,
    }
  })

  return {
    proposals: votingProposals,
    votingSummary: summary,
  }
}

export const useVotingTabulation = (meetingId?: string): UseVotingTabulationResult => {
  const { data, error, isLoading, mutate } = useSWR(
    meetingId ? `/voting/${meetingId}` : null,
    () => fetchVotingData(meetingId!),
    {
      // Cache for 30 seconds
      refreshInterval: 30000,
      // Don't revalidate on focus
      revalidateOnFocus: false,
      // Keep previous data while revalidating
      keepPreviousData: true,
      // Dedupe multiple requests in 2 second window
      dedupingInterval: 2000,
    }
  )

  return {
    proposals: data?.proposals || [],
    votingSummary: data?.votingSummary || null,
    loading: isLoading,
    error: error ? error.message : null,
    refetch: () => mutate(),
  }
}
