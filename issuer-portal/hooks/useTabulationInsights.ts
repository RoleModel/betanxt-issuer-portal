'use client'

import React from 'react'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'
import type { ProposalVoting, VotingSummary } from '@/types/phases'
import type { QuorumGaugeViewModel } from '@/utils/quorum'
import { buildQuorumGaugeModel } from '@/utils/quorum'
import { asArray, asRecord, asString } from '@/utils/typeUtils'

export interface TabulationPosition {
  id: string
  cusip: string
  accountType: string
  setKey: string
  name: string
  accountNumber: string
  accountEmail: string | null
  voteStatus: string
  controlNumber: string
  shares: number
  sharesVoted: number
  source: string
  dateVoted: string | null
  sentBy: string | null
}

interface PositionVoteRecord {
  positionId: string
  proposalId: string
  vote: 'FOR' | 'AGAINST' | 'ABSTAIN' | 'WITHHOLD'
  sharesVoting: number
}

interface ProposalVoteCounts {
  for: number
  against: number
  abstain: number
  total: number
}

const fetchPositionVotesForMeeting = async (meetingId: string): Promise<unknown[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api'
  const response = await fetch(
    `${baseUrl}/position_votes?meetingId=${encodeURIComponent(meetingId)}&limit=10000`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch position votes')
  }

  const data: unknown = await response.json()
  return asArray(data)
}

interface ProposalRecord {
  id: string
  proposalNumber: number
  proposalTitle: string
  proposalType?: string
  recommendation?: string
  directorName?: string
  totalVotesFor: number
  totalVotesAgainst: number
  totalVotesAbstain: number
}

export interface TabulationFilters {
  searchQuery: string
  voteStatus: 'All' | 'Voted' | 'Unvoted'
  holderType: 'all' | 'beneficial' | 'registered'
  accountType: string
  setKey: string
  directorProposalId: string
  controlNumber: string
  accountNumber: string
  positionName: string
  shareLow: string
  shareHigh: string
}

interface DirectorOption {
  id: string
  label: string
}

interface BeneficialRegisteredBreakdown {
  beneficial: number
  registered: number
}

interface TabulationInsightsResult {
  loading: boolean
  proposals: ProposalVoting[]
  filteredPositions: TabulationPosition[]
  summary: VotingSummary | null
  quorumGauge: QuorumGaugeViewModel | null
  filters: TabulationFilters
  setFilters: React.Dispatch<React.SetStateAction<TabulationFilters>>
  accountTypes: string[]
  setKeys: string[]
  directors: DirectorOption[]
  beneficialVsRegistered: BeneficialRegisteredBreakdown
  meetingTitle: string
  clientTicker: string
}

const DEFAULT_FILTERS: TabulationFilters = {
  searchQuery: '',
  voteStatus: 'All',
  holderType: 'all',
  accountType: '',
  setKey: '',
  directorProposalId: '',
  controlNumber: '',
  accountNumber: '',
  positionName: '',
  shareLow: '',
  shareHigh: '',
}

const isActiveFilterValue = (value: string): boolean => {
  return value !== '' && value !== 'All' && value !== 'all'
}

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  const parsed = asString(value)
  if (parsed) return parsed
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return String(value)
  }
  return ''
}

const toNullableString = (value: unknown): string | null => {
  const parsed = toStringValue(value)
  return parsed || null
}

const normalizePosition = (value: unknown): TabulationPosition | null => {
  const record = asRecord(value)
  if (!record) return null

  return {
    id: toStringValue(record.id),
    cusip: toStringValue(record.cusip),
    accountType: toStringValue(record.account_type ?? record.accountType),
    setKey: toStringValue(record.set_key ?? record.setKey),
    name: toStringValue(record.name),
    accountNumber: toStringValue(record.account_number ?? record.accountNumber),
    accountEmail: toNullableString(record.account_email ?? record.accountEmail),
    voteStatus: toStringValue(record.vote_status ?? record.voteStatus),
    controlNumber: toStringValue(record.control_number ?? record.controlNumber),
    shares: toFiniteNumber(record.shares),
    sharesVoted: toFiniteNumber(record.shares_voted ?? record.sharesVoted),
    source: toStringValue(record.source ?? record.votingSource),
    dateVoted: toNullableString(record.date_voted ?? record.dateVoted),
    sentBy: toNullableString(record.sent_by ?? record.sentBy),
  }
}

const normalizeProposal = (value: unknown): ProposalRecord | null => {
  const record = asRecord(value)
  if (!record) return null

  return {
    id: toStringValue(record.id),
    proposalNumber: toFiniteNumber(record.proposalNumber ?? record.proposal_number),
    proposalTitle: toStringValue(record.proposalTitle ?? record.proposal_title ?? record.title),
    proposalType: toNullableString(record.proposalType ?? record.proposal_type) ?? undefined,
    recommendation: toNullableString(record.recommendation) ?? undefined,
    directorName: toNullableString(record.directorName ?? record.director_name) ?? undefined,
    totalVotesFor: toFiniteNumber(record.totalVotesFor ?? record.total_votes_for),
    totalVotesAgainst: toFiniteNumber(record.totalVotesAgainst ?? record.total_votes_against),
    totalVotesAbstain: toFiniteNumber(record.totalVotesAbstain ?? record.total_votes_abstain),
  }
}

const normalizePositionVote = (value: unknown): PositionVoteRecord | null => {
  const record = asRecord(value)
  if (!record) return null

  const vote = toStringValue(record.vote).toUpperCase()
  if (!['FOR', 'AGAINST', 'ABSTAIN', 'WITHHOLD'].includes(vote)) {
    return null
  }

  return {
    positionId: toStringValue(record.positionId ?? record.position_id),
    proposalId: toStringValue(record.proposalId ?? record.proposal_id),
    vote: vote as PositionVoteRecord['vote'],
    sharesVoting: toFiniteNumber(record.sharesVoting ?? record.shares_voting),
  }
}

const buildProposalVoting = (
  proposal: ProposalRecord,
  voteCounts?: ProposalVoteCounts
): ProposalVoting => {
  const totalVotes =
    proposal.totalVotesFor + proposal.totalVotesAgainst + proposal.totalVotesAbstain

  return {
    proposalId: proposal.id,
    proposalNumber: proposal.proposalNumber,
    description: proposal.proposalTitle,
    proposalTitle: proposal.proposalTitle,
    proposalType: proposal.proposalType,
    directorName: proposal.directorName,
    recommendation: proposal.recommendation,
    votingResults: {
      for: {
        shares: proposal.totalVotesFor,
        percentage: totalVotes > 0 ? (proposal.totalVotesFor / totalVotes) * 100 : 0,
      },
      against: {
        shares: proposal.totalVotesAgainst,
        percentage: totalVotes > 0 ? (proposal.totalVotesAgainst / totalVotes) * 100 : 0,
      },
      abstain: {
        shares: proposal.totalVotesAbstain,
        percentage: totalVotes > 0 ? (proposal.totalVotesAbstain / totalVotes) * 100 : 0,
      },
    },
    voteCounts,
    totalShares: totalVotes,
    status: 'active',
  }
}

const getHolderType = (position: TabulationPosition): 'beneficial' | 'registered' => {
  return position.accountType === 'DTC/CDS' ? 'registered' : 'beneficial'
}

const buildVotingSummary = (params: {
  positions: TabulationPosition[]
  proposals: ProposalVoting[]
  totalSharesOutstanding: number
  representedShares: number
}): VotingSummary => {
  const { positions, proposals, totalSharesOutstanding, representedShares } = params

  let forShares = 0
  let againstShares = 0
  let abstainShares = 0

  proposals.forEach((proposal) => {
    forShares += proposal.votingResults.for.shares
    againstShares += proposal.votingResults.against.shares
    abstainShares += proposal.votingResults.abstain.shares
  })

  const totalProposalVotes = forShares + againstShares + abstainShares

  return {
    totalSharesVoted: representedShares,
    totalSharesOutstanding,
    percentageVoted:
      totalSharesOutstanding > 0
        ? Math.round((representedShares / totalSharesOutstanding) * 10000) / 100
        : 0,
    positionsVoted: positions.filter((position) => position.voteStatus === 'Voted').length,
    totalPositions: positions.length,
    lastUpdated: new Date().toISOString(),
    votingMethods: {
      web: positions.filter((position) => position.source === 'WEB').length,
      paper: positions.filter((position) => position.source === 'PRINT').length,
      phone: positions.filter((position) => position.source === 'IVR').length,
    },
    votingBreakdown: {
      for: {
        shares: forShares,
        percentage: totalProposalVotes > 0 ? (forShares / totalProposalVotes) * 100 : 0,
      },
      against: {
        shares: againstShares,
        percentage:
          totalProposalVotes > 0 ? (againstShares / totalProposalVotes) * 100 : 0,
      },
      abstain: {
        shares: abstainShares,
        percentage:
          totalProposalVotes > 0 ? (abstainShares / totalProposalVotes) * 100 : 0,
      },
      withhold: {
        shares: 0,
        percentage: 0,
      },
    },
  }
}

export function useTabulationInsights(
  meetingId?: string,
  meeting?: components['schemas']['Meeting'] | null
): TabulationInsightsResult {
  const [loading, setLoading] = React.useState(true)
  const [positions, setPositions] = React.useState<TabulationPosition[]>([])
  const [proposals, setProposals] = React.useState<ProposalRecord[]>([])
  const [positionVotes, setPositionVotes] = React.useState<PositionVoteRecord[]>([])
  const [meetingTitle, setMeetingTitle] = React.useState('')
  const [clientTicker, setClientTicker] = React.useState('')
  const [filters, setFilters] = React.useState<TabulationFilters>(DEFAULT_FILTERS)

  React.useEffect(() => {
    if (!meetingId) return

    const fetchTabulationData = async () => {
      setLoading(true)

      try {
        const apiClient = await buildApiClient()

        const [positionsResult, proposalsResult, meetingResult] = await Promise.all([
          apiClient.GET('/positions', {
            params: {
              query: {
                meetingId,
                limit: 5000,
              },
            },
          }),
          apiClient.GET('/meetings/{meetingId}/proposals', {
            params: {
              path: { meetingId },
            },
          }),
          apiClient.GET('/meetings/{meetingId}', {
            params: {
              path: { meetingId },
            },
          }),
        ])

        const rawPositions = Array.isArray(positionsResult.data)
          ? positionsResult.data
          : asArray(asRecord(positionsResult.data)?.positions)
        const normalizedPositions = rawPositions.reduce<TabulationPosition[]>(
          (acc, item) => {
            const normalized = normalizePosition(item)
            if (normalized) acc.push(normalized)
            return acc
          },
          []
        )

        const rawProposals = Array.isArray(proposalsResult.data) ? proposalsResult.data : []
        const normalizedProposals = rawProposals.reduce<ProposalRecord[]>((acc, item) => {
          const normalized = normalizeProposal(item)
          if (normalized) acc.push(normalized)
          return acc
        }, [])

        const positionIds = normalizedPositions.map((position) => position.id).filter(Boolean)
        const positionIdSet = new Set(positionIds)
        const proposalIds = new Set(normalizedProposals.map((proposal) => proposal.id))
        const rawPositionVotes =
          positionIdSet.size > 0 ? await fetchPositionVotesForMeeting(meetingId) : []
        const normalizedVotes = rawPositionVotes
          .map((item) => normalizePositionVote(item))
          .filter((vote): vote is PositionVoteRecord => vote !== null)
          .filter((vote) => proposalIds.has(vote.proposalId))
          .filter((vote) => positionIdSet.has(vote.positionId))

        setPositions(normalizedPositions)
        setProposals(normalizedProposals)
        setPositionVotes(normalizedVotes)

        const meetingRecord = asRecord(meetingResult.data)
        setMeetingTitle(asString(meetingRecord?.title) || '')
        setClientTicker(asString(meetingRecord?.ticker) || '')
      } catch (error) {
        console.error('Failed to fetch tabulation insights:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchTabulationData()
  }, [meetingId])

  const accountTypes = React.useMemo(
    () => [...new Set(positions.map((position) => position.accountType).filter(Boolean))].sort(),
    [positions]
  )

  const setKeys = React.useMemo(
    () => [...new Set(positions.map((position) => position.setKey).filter(Boolean))].sort(),
    [positions]
  )

  const directors = React.useMemo(
    () =>
      proposals
        .filter((proposal) => proposal.directorName)
        .map((proposal) => ({
          id: proposal.id,
          label: proposal.directorName || proposal.proposalTitle,
        })),
    [proposals]
  )

  const filteredPositions = React.useMemo(() => {
    const directorPositionIds = new Set(
      positionVotes
        .filter(
          (vote) =>
            !filters.directorProposalId || vote.proposalId === filters.directorProposalId
        )
        .map((vote) => vote.positionId)
    )

    return positions.filter((position) => {
      const matchesSearch =
        !filters.searchQuery ||
        position.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        position.accountNumber.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        position.controlNumber.toLowerCase().includes(filters.searchQuery.toLowerCase())

      const matchesVoteStatus =
        filters.voteStatus === 'All' || position.voteStatus === filters.voteStatus
      const matchesHolderType =
        filters.holderType === 'all' || getHolderType(position) === filters.holderType
      const matchesAccountType =
        !filters.accountType || position.accountType === filters.accountType
      const matchesSetKey = !filters.setKey || position.setKey === filters.setKey
      const matchesDirector =
        !filters.directorProposalId || directorPositionIds.has(position.id)
      const matchesControlNumber =
        !filters.controlNumber ||
        position.controlNumber.toLowerCase().includes(filters.controlNumber.toLowerCase())
      const matchesAccountNumber =
        !filters.accountNumber ||
        position.accountNumber.toLowerCase().includes(filters.accountNumber.toLowerCase())
      const matchesPositionName =
        !filters.positionName ||
        position.name.toLowerCase().includes(filters.positionName.toLowerCase())
      const shareLow = filters.shareLow ? Number.parseFloat(filters.shareLow) : null
      const shareHigh = filters.shareHigh ? Number.parseFloat(filters.shareHigh) : null
      const matchesShareRange =
        (shareLow === null || position.shares >= shareLow) &&
        (shareHigh === null || position.shares <= shareHigh)

      return (
        matchesSearch &&
        matchesVoteStatus &&
        matchesHolderType &&
        matchesAccountType &&
        matchesSetKey &&
        matchesDirector &&
        matchesControlNumber &&
        matchesAccountNumber &&
        matchesPositionName &&
        matchesShareRange
      )
    })
  }, [filters, positionVotes, positions])

  const proposalsForDisplay = React.useMemo(() => {
    const filtersForProposalAggregation = {
      ...filters,
      voteStatus: 'All' as const,
    }
    const hasActiveProposalFilters = Object.values(filtersForProposalAggregation).some(
      (value) => isActiveFilterValue(value)
    )

    if (!hasActiveProposalFilters) {
      const voteCountsByProposalId = new Map<string, ProposalVoteCounts>()

      positionVotes.forEach((vote) => {
        const currentCounts = voteCountsByProposalId.get(vote.proposalId) ?? {
          for: 0,
          against: 0,
          abstain: 0,
          total: 0,
        }

        if (vote.vote === 'FOR') {
          currentCounts.for += 1
        } else if (vote.vote === 'ABSTAIN') {
          currentCounts.abstain += 1
        } else {
          currentCounts.against += 1
        }

        currentCounts.total += 1
        voteCountsByProposalId.set(vote.proposalId, currentCounts)
      })

      return proposals.map((proposal) =>
        buildProposalVoting(proposal, voteCountsByProposalId.get(proposal.id))
      )
    }

    const filteredPositionIds = new Set(
      positions
        .filter((position) => {
          const matchesSearch =
            !filtersForProposalAggregation.searchQuery ||
            position.name
              .toLowerCase()
              .includes(filtersForProposalAggregation.searchQuery.toLowerCase()) ||
            position.accountNumber
              .toLowerCase()
              .includes(filtersForProposalAggregation.searchQuery.toLowerCase()) ||
            position.controlNumber
              .toLowerCase()
              .includes(filtersForProposalAggregation.searchQuery.toLowerCase())

          const matchesHolderType =
            filtersForProposalAggregation.holderType === 'all' ||
            getHolderType(position) === filtersForProposalAggregation.holderType
          const matchesAccountType =
            !filtersForProposalAggregation.accountType ||
            position.accountType === filtersForProposalAggregation.accountType
          const matchesSetKey =
            !filtersForProposalAggregation.setKey ||
            position.setKey === filtersForProposalAggregation.setKey
          const matchesControlNumber =
            !filtersForProposalAggregation.controlNumber ||
            position.controlNumber
              .toLowerCase()
              .includes(filtersForProposalAggregation.controlNumber.toLowerCase())
          const matchesAccountNumber =
            !filtersForProposalAggregation.accountNumber ||
            position.accountNumber
              .toLowerCase()
              .includes(filtersForProposalAggregation.accountNumber.toLowerCase())
          const matchesPositionName =
            !filtersForProposalAggregation.positionName ||
            position.name
              .toLowerCase()
              .includes(filtersForProposalAggregation.positionName.toLowerCase())
          const shareLow = filtersForProposalAggregation.shareLow
            ? Number.parseFloat(filtersForProposalAggregation.shareLow)
            : null
          const shareHigh = filtersForProposalAggregation.shareHigh
            ? Number.parseFloat(filtersForProposalAggregation.shareHigh)
            : null
          const matchesShareRange =
            (shareLow === null || position.shares >= shareLow) &&
            (shareHigh === null || position.shares <= shareHigh)

          return (
            matchesSearch &&
            matchesHolderType &&
            matchesAccountType &&
            matchesSetKey &&
            matchesControlNumber &&
            matchesAccountNumber &&
            matchesPositionName &&
            matchesShareRange
          )
        })
        .map((position) => position.id)
    )

    return proposals
      .filter(
        (proposal) =>
          !filtersForProposalAggregation.directorProposalId ||
          proposal.id === filtersForProposalAggregation.directorProposalId
      )
      .map((proposal) => {
        let forVotes = 0
        let againstVotes = 0
        let abstainVotes = 0
        let forCount = 0
        let againstCount = 0
        let abstainCount = 0

        positionVotes.forEach((vote) => {
          if (vote.proposalId !== proposal.id || !filteredPositionIds.has(vote.positionId)) {
            return
          }

          if (vote.vote === 'FOR') {
            forVotes += vote.sharesVoting
            forCount += 1
          } else if (vote.vote === 'ABSTAIN') {
            abstainVotes += vote.sharesVoting
            abstainCount += 1
          } else {
            againstVotes += vote.sharesVoting
            againstCount += 1
          }
        })

        const totalVotes = forVotes + againstVotes + abstainVotes
        const totalCount = forCount + againstCount + abstainCount

        return {
          proposalId: proposal.id,
          proposalNumber: proposal.proposalNumber,
          description: proposal.proposalTitle,
          proposalTitle: proposal.proposalTitle,
          proposalType: proposal.proposalType,
          directorName: proposal.directorName,
          recommendation: proposal.recommendation,
          votingResults: {
            for: {
              shares: forVotes,
              percentage: totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0,
            },
            against: {
              shares: againstVotes,
              percentage: totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0,
            },
            abstain: {
              shares: abstainVotes,
              percentage: totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0,
            },
          },
          voteCounts: {
            for: forCount,
            against: againstCount,
            abstain: abstainCount,
            total: totalCount,
          },
          totalShares: totalVotes,
          status: 'active' as const,
        }
      })
  }, [filters, positionVotes, positions, proposals])

  const totalSharesOutstanding = React.useMemo(() => {
    const fallbackOutstanding = filteredPositions.reduce(
      (sum, position) => sum + position.shares,
      0
    )

    return toFiniteNumber(meeting?.totalSharesOutstanding) || fallbackOutstanding
  }, [filteredPositions, meeting?.totalSharesOutstanding])

  const representedShares = React.useMemo(() => {
    const hasActiveFilters = Object.values(filters).some((value) => isActiveFilterValue(value))

    if (!hasActiveFilters) {
      return positions
        .filter((position) => position.voteStatus === 'Voted')
        .reduce((sum, position) => sum + position.sharesVoted, 0)
    }

    if (filters.directorProposalId) {
      return proposalsForDisplay[0]?.totalShares ?? 0
    }

    return filteredPositions
      .filter((position) => position.voteStatus === 'Voted')
      .reduce((sum, position) => sum + position.sharesVoted, 0)
  }, [filteredPositions, filters, positions, proposalsForDisplay])

  const summary = React.useMemo(() => {
    return buildVotingSummary({
      positions: filteredPositions,
      proposals: proposalsForDisplay,
      totalSharesOutstanding,
      representedShares,
    })
  }, [filteredPositions, proposalsForDisplay, representedShares, totalSharesOutstanding])

  const quorumGauge = React.useMemo(() => {
    return buildQuorumGaugeModel({
      totalOutstandingShares: totalSharesOutstanding,
      representedShares,
      quorumRequirementPercent: meeting?.quorumRequirement ?? 50,
    })
  }, [meeting?.quorumRequirement, representedShares, totalSharesOutstanding])

  const beneficialVsRegistered = React.useMemo(
    () => ({
      beneficial: filteredPositions
        .filter((position) => getHolderType(position) === 'beneficial')
        .reduce((sum, position) => sum + position.shares, 0),
      registered: filteredPositions
        .filter((position) => getHolderType(position) === 'registered')
        .reduce((sum, position) => sum + position.shares, 0),
    }),
    [filteredPositions]
  )

  return {
    loading,
    proposals: proposalsForDisplay,
    filteredPositions,
    summary,
    quorumGauge,
    filters,
    setFilters,
    accountTypes,
    setKeys,
    directors,
    beneficialVsRegistered,
    meetingTitle,
    clientTicker,
  }
}
