'use client'

import useSWR from 'swr'

import buildApiClient from '@/domain-models/apiClient'

import type { ProposalVoting, VotingSummary } from '@/types/phases'

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

  const proposalsData = proposalsResult.data || []
  // Handle different possible response formats
  const responseData = positionsResult.data
  const positions = Array.isArray(responseData)
    ? responseData
    : ((responseData as unknown as { positions?: any[] })?.positions ?? [])

  // Calculate voting summary
  const totalPositions = positions.length
  const positionsVoted = positions.filter((p: any) => p.voteStatus === 'Voted').length
  const totalShares = positions.reduce((sum: number, p: any) => sum + (p.shares || 0), 0)
  const sharesVoted = positions
    .filter((p: any) => p.voteStatus === 'Voted')
    .reduce((sum: number, p: any) => sum + (p.shares || 0), 0)

  const percentageVoted = totalShares > 0 ? (sharesVoted / totalShares) * 100 : 0

  // Count voting methods
  const webVotes = positions.filter((p: any) => p.votingSource === 'WEB').length
  const paperVotes = positions.filter((p: any) => p.votingSource === 'PAPER').length
  const phoneVotes = positions.filter((p: any) => p.votingSource === 'PHONE').length

  // Calculate real voting breakdown by aggregating all proposals
  let totalForShares = 0
  let totalAgainstShares = 0
  let totalAbstainShares = 0

  proposalsData.forEach((proposal: any) => {
    const proposalFor = proposal.totalVotesFor || proposal.total_votes_for || 0
    const proposalAgainst =
      proposal.totalVotesAgainst || proposal.total_votes_against || 0
    const proposalAbstain =
      proposal.totalVotesAbstain || proposal.total_votes_abstain || 0

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
    percentageVoted: Math.round(percentageVoted),
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
  const votingProposals: ProposalVoting[] = proposalsData.map((proposal: any) => {
    // Use actual voting data from the database
    const proposalForShares = proposal.totalVotesFor || proposal.total_votes_for || 0
    const proposalAgainstShares =
      proposal.totalVotesAgainst || proposal.total_votes_against || 0
    const proposalAbstainShares =
      proposal.totalVotesAbstain || proposal.total_votes_abstain || 0

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
      proposalNumber: proposal.proposalNumber || proposal.proposal_number || '',
      description:
        proposal.proposalTitle ||
        proposal.proposal_title ||
        proposal.description ||
        proposal.title ||
        '',
      directorName: proposal.directorName || proposal.director_name || undefined,
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
