'use client'

import { useMemo } from 'react'
import useSWR from 'swr'

import { listMeetings, listPositions, listProposals } from '@/domain-models/api'
import type { components } from '@/domain-models/generated-schema'

type Meeting = components['schemas']['Meeting']
type Proposal = components['schemas']['Proposal']
type Position = components['schemas']['Position']

interface ReportingData {
  meetings: Meeting[]
  proposals: Proposal[]
  positions: Position[]
  directorPerformanceData: DirectorPerformanceData[]
  participationData: ParticipationData
  yearOverYearData: YearOverYearData[]
  eventSummaryData: EventSummaryData
  auditComplianceData: AuditComplianceData[]
  quorumData: QuorumData[]
}

interface DirectorPerformanceData {
  directorName: string
  forVotes: number
  againstVotes: number
  abstainVotes: number
  totalVotes: number
}

interface ParticipationData {
  webVoting: number
  printVoting: number
  ivrVoting: number
  totalVotes: number
}

interface YearOverYearData {
  year: number
  participationRate: number
  proposalsCount: number
  passedCount: number
  failedCount: number
}

interface EventSummaryData {
  totalProposals: number
  passedProposals: number
  failedProposals: number
  participationRate: number
  quorumAchieved: boolean
  materials: {
    sent: number
    total: number
    sentDate: string
  }
}

interface AuditComplianceData {
  meetingId: string
  meetingTitle: string
  complianceScore: number
  issues: string[]
  materialsCompliant: boolean
}

interface QuorumData {
  meetingId: string
  meetingTitle: string
  requiredShares: number
  actualShares: number
  quorumMet: boolean
  participationRate: number
}

export function useReporting(clientTicker: string) {
  const fetcher = async (): Promise<ReportingData> => {
    // OPTIMIZATION 1: Parallel meeting fetch (5 API calls in parallel to ensure historical data)
    const currentYear = new Date().getFullYear()
    const meetingPromises = [
      listMeetings({ ticker: clientTicker }),
      listMeetings({ ticker: clientTicker, meetingYear: currentYear - 1 }).catch(() => ({
        data: { meetings: [] },
      })),
      listMeetings({ ticker: clientTicker, meetingYear: currentYear - 2 }).catch(() => ({
        data: { meetings: [] },
      })),
      listMeetings({ ticker: clientTicker, meetingYear: currentYear - 3 }).catch(() => ({
        data: { meetings: [] },
      })),
      listMeetings({ ticker: clientTicker, meetingYear: currentYear - 4 }).catch(() => ({
        data: { meetings: [] },
      })),
    ]

    const meetingResults = await Promise.all(meetingPromises)

    // Flatten and dedupe meetings
    const allMeetings = meetingResults
      .flatMap((result) => result.data?.meetings || [])
      .filter(
        (meeting, index, self) =>
          index === self.findIndex((m) => m.meetingId === meeting.meetingId)
      )

    // Filter to only completed meetings with voting data
    const completedMeetings = allMeetings.filter(
      (meeting) =>
        meeting.status === 'Completed' ||
        (meeting.meetingDate && new Date(meeting.meetingDate) < new Date())
    )

    // OPTIMIZATION 2: Parallel fetch of proposals and positions for completed meetings only
    const meetingIds = completedMeetings.slice(0, 6).map((m) => m.meetingId) // Limit to most recent 6 meetings

    const proposalPromises = meetingIds.map((id) =>
      listProposals(id).catch(() => ({ data: [] }))
    )
    const positionPromises = meetingIds.map((id) =>
      listPositions({ meetingId: id }).catch(() => ({ data: { positions: [] } }))
    )

    const [proposalResults, positionResults] = await Promise.all([
      Promise.all(proposalPromises),
      Promise.all(positionPromises),
    ])

    const allProposals = proposalResults.flatMap((result) => result.data || [])
    const allPositions = positionResults.flatMap((result) => result.data?.positions || [])

    // CALCULATION 1: Director Performance Data
    const directorPerformanceData = calculateDirectorPerformance(allProposals)

    // CALCULATION 2: Participation Data (voting method distribution)
    const participationData = calculateParticipationData(allPositions)

    // CALCULATION 3: Year over Year Data
    const yearOverYearData = calculateYearOverYearData(
      completedMeetings,
      allProposals,
      allPositions
    )

    // CALCULATION 4: Event Summary Data
    const eventSummaryData = calculateEventSummaryData(
      completedMeetings,
      allProposals,
      allPositions
    )

    // CALCULATION 5: Audit Compliance Data
    const auditComplianceData = calculateAuditComplianceData(
      completedMeetings,
      allProposals
    )

    // CALCULATION 6: Quorum Data
    const quorumData = calculateQuorumData(completedMeetings, allPositions)

    return {
      meetings: completedMeetings,
      proposals: allProposals,
      positions: allPositions,
      directorPerformanceData,
      participationData,
      yearOverYearData,
      eventSummaryData,
      auditComplianceData,
      quorumData,
    }
  }

  const { data, error, isLoading } = useSWR(
    clientTicker ? `reporting-${clientTicker}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 2,
    }
  )

  return {
    data,
    loading: isLoading,
    error,
  }
}

// Helper calculation functions
function calculateDirectorPerformance(proposals: Proposal[]): DirectorPerformanceData[] {
  const directorProposals = proposals.filter(
    (p) =>
      p.proposalType === 'Director Election' ||
      p.directorName ||
      /Election of Director/i.test(p.proposalTitle || '')
  )

  const directorMap = new Map<string, DirectorPerformanceData>()

  directorProposals.forEach((proposal) => {
    const directorName =
      proposal.directorName || extractDirectorNameFromTitle(proposal.proposalTitle || '')
    if (!directorName) return

    const existing = directorMap.get(directorName) || {
      directorName,
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      totalVotes: 0,
    }

    existing.forVotes += proposal.totalVotesFor || 0
    existing.againstVotes += proposal.totalVotesAgainst || 0
    existing.abstainVotes += proposal.totalVotesAbstain || 0
    existing.totalVotes =
      existing.forVotes + existing.againstVotes + existing.abstainVotes

    directorMap.set(directorName, existing)
  })

  return Array.from(directorMap.values())
}

function extractDirectorNameFromTitle(title: string): string | null {
  const patterns = [
    /Election of Director - (.+)/i,
    /Election of (.+) as Director/i,
    /Director Election: (.+)/i,
    /Elect (.+) as Director/i,
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) return match[1].trim()
  }

  return null
}

function calculateParticipationData(positions: Position[]): ParticipationData {
  const votingMethods = positions.reduce(
    (acc, position) => {
      const method = position.votingSource || 'WEB'
      acc[method] = (acc[method] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const totalVotes = positions.length

  return {
    webVoting: votingMethods.WEB || 0,
    printVoting: votingMethods.PRINT || 0,
    ivrVoting: votingMethods.IVR || 0,
    totalVotes,
  }
}

function calculateYearOverYearData(
  meetings: Meeting[],
  proposals: Proposal[],
  positions: Position[]
): YearOverYearData[] {
  const yearMap = new Map<number, YearOverYearData>()

  meetings.forEach((meeting) => {
    if (!meeting.meetingDate) return

    const year = new Date(meeting.meetingDate).getFullYear()
    const meetingProposals = proposals.filter((p) => p.meetingId === meeting.meetingId)
    const meetingPositions = positions.filter((p) => p.meetingId === meeting.meetingId)

    const existing = yearMap.get(year) || {
      year,
      participationRate: 0,
      proposalsCount: 0,
      passedCount: 0,
      failedCount: 0,
    }

    existing.proposalsCount += meetingProposals.length
    existing.passedCount += meetingProposals.filter(
      (p) => p.finalResult === 'Passed'
    ).length
    existing.failedCount += meetingProposals.filter(
      (p) => p.finalResult === 'Failed'
    ).length

    if (meetingPositions.length > 0) {
      const participationRate =
        (meetingPositions.length / (meeting.eligibleShares || meetingPositions.length)) *
        100
      existing.participationRate = Math.max(existing.participationRate, participationRate)
    }

    yearMap.set(year, existing)
  })

  return Array.from(yearMap.values()).sort((a, b) => a.year - b.year)
}

function calculateEventSummaryData(
  meetings: Meeting[],
  proposals: Proposal[],
  positions: Position[]
): EventSummaryData {
  const latestMeeting = meetings[0]
  if (!latestMeeting) {
    return {
      totalProposals: 0,
      passedProposals: 0,
      failedProposals: 0,
      participationRate: 0,
      quorumAchieved: false,
      materials: { sent: 0, total: 0, sentDate: '' },
    }
  }

  const meetingProposals = proposals.filter(
    (p) => p.meetingId === latestMeeting.meetingId
  )
  const meetingPositions = positions.filter(
    (p) => p.meetingId === latestMeeting.meetingId
  )

  const passedProposals = meetingProposals.filter(
    (p) => p.finalResult === 'Passed'
  ).length
  const failedProposals = meetingProposals.filter(
    (p) => p.finalResult === 'Failed'
  ).length

  const participationRate = latestMeeting.eligibleShares
    ? (meetingPositions.length / latestMeeting.eligibleShares) * 100
    : 0

  return {
    totalProposals: meetingProposals.length,
    passedProposals,
    failedProposals,
    participationRate,
    quorumAchieved: participationRate >= (latestMeeting.quorumThreshold || 50),
    materials: {
      sent: meetingPositions.length,
      total: latestMeeting.eligibleShares || meetingPositions.length,
      sentDate: latestMeeting.materialsSentDate || latestMeeting.meetingDate || '',
    },
  }
}

function calculateAuditComplianceData(
  meetings: Meeting[],
  proposals: Proposal[]
): AuditComplianceData[] {
  return meetings.map((meeting) => {
    const meetingProposals = proposals.filter((p) => p.meetingId === meeting.meetingId)
    const issues: string[] = []

    if (!meeting.materialsSentDate) issues.push('Materials sent date not recorded')
    if (meetingProposals.length === 0) issues.push('No proposals recorded')
    if (!meeting.quorumThreshold) issues.push('Quorum threshold not set')

    const complianceScore = Math.max(0, 100 - issues.length * 25)

    return {
      meetingId: meeting.meetingId,
      meetingTitle: meeting.meetingTitle || 'Untitled Meeting',
      complianceScore,
      issues,
      materialsCompliant: !!meeting.materialsSentDate,
    }
  })
}

function calculateQuorumData(meetings: Meeting[], positions: Position[]): QuorumData[] {
  return meetings.map((meeting) => {
    const meetingPositions = positions.filter((p) => p.meetingId === meeting.meetingId)
    const actualShares = meetingPositions.reduce((sum, pos) => sum + (pos.shares || 0), 0)
    const requiredShares =
      (meeting.eligibleShares || 0) * ((meeting.quorumThreshold || 50) / 100)
    const participationRate = meeting.eligibleShares
      ? (actualShares / meeting.eligibleShares) * 100
      : 0

    return {
      meetingId: meeting.meetingId,
      meetingTitle: meeting.meetingTitle || 'Untitled Meeting',
      requiredShares,
      actualShares,
      quorumMet: actualShares >= requiredShares,
      participationRate,
    }
  })
}
