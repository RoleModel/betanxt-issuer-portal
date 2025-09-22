'use client'

import { useEffect, useState } from 'react'

import buildApiClient from '@/domain-models/apiClient'
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
  daysToQuorum: number | null
  earlyVotesPct: number
  lateVotesPct: number
}

const fetcher = async (key: string) => {
  try {
    const [, clientTicker] = key.split('|')

    console.log('🔍 useReporting fetcher starting for ticker:', clientTicker)

    // OPTIMIZATION 1: Parallel meeting fetch (5 API calls in parallel to ensure historical data)
    const apiClient = await buildApiClient()
    const currentYear = new Date().getFullYear()

    console.log('📅 Fetching meetings for years:', [
      currentYear,
      currentYear - 1,
      currentYear - 2,
      currentYear - 3,
      currentYear - 4,
    ])

    const meetingPromises = [
      apiClient.GET('/meetings', {
        params: { query: { ticker: clientTicker, status: 'COMPLETED' } },
      }),
      apiClient
        .GET('/meetings', {
          params: { query: { ticker: clientTicker, meetingYear: currentYear - 1 } },
        })
        .catch(() => ({
          data: { meetings: [] },
        })),
      apiClient
        .GET('/meetings', {
          params: { query: { ticker: clientTicker, meetingYear: currentYear - 2 } },
        })
        .catch(() => ({
          data: { meetings: [] },
        })),
      apiClient
        .GET('/meetings', {
          params: { query: { ticker: clientTicker, meetingYear: currentYear - 3 } },
        })
        .catch(() => ({
          data: { meetings: [] },
        })),
      apiClient
        .GET('/meetings', {
          params: { query: { ticker: clientTicker, meetingYear: currentYear - 4 } },
        })
        .catch(() => ({
          data: { meetings: [] },
        })),
    ]

    const meetingResults = await Promise.all(meetingPromises)

    console.log(
      '📊 Meeting results received:',
      meetingResults.map((r) => ({
        count: r.data?.meetings?.length || 0,
        meetings:
          r.data?.meetings?.map((m) => ({
            id: m.id,
            status: m.status,
            title: m.title,
          })) || [],
      }))
    )

    // Flatten and dedupe meetings
    const allMeetings = meetingResults
      .flatMap((result) => result.data?.meetings || [])
      .filter(
        (meeting, index, self) => index === self.findIndex((m) => m.id === meeting.id)
      )

    console.log(
      '🎯 All meetings after dedup:',
      allMeetings.map((m) => ({ id: m.id, status: m.status, title: m.title }))
    )

    // Most meetings should already be completed from the API calls, but filter just in case
    const completedMeetings = allMeetings.filter(
      (meeting) =>
        meeting.status === 'COMPLETE' ||
        (meeting.meetingDate && new Date(meeting.meetingDate) < new Date())
    )

    console.log(
      '✅ Completed meetings:',
      completedMeetings.map((m) => ({ id: m.id, status: m.status, title: m.title }))
    )

    // OPTIMIZATION 2: Parallel fetch of proposals and positions for completed meetings only
    const meetingIds = completedMeetings.slice(0, 6).map((m) => m.id) // Limit to most recent 6 meetings

    const proposalPromises = meetingIds.map((id) =>
      apiClient
        .GET('/meetings/{meetingId}/proposals', {
          params: { path: { meetingId: id || '' } },
        })
        .catch(() => ({ data: [] }))
    )
    const positionPromises = meetingIds.map((id) =>
      apiClient
        .GET('/positions', { params: { query: { meetingId: id } } })
        .catch(() => ({ data: [] as Position[] }))
    )

    const [proposalResults, positionResults] = await Promise.all([
      Promise.all(proposalPromises),
      Promise.all(positionPromises),
    ])

    const allProposals = proposalResults.flatMap((result) => result.data || [])
    const allPositions: Position[] = positionResults.flatMap(
      (result) => result.data || []
    )

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

    const result = {
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

    console.log('🎉 Final reporting data:', {
      meetingsCount: result.meetings.length,
      proposalsCount: result.proposals.length,
      positionsCount: result.positions.length,
      directorPerformanceCount: result.directorPerformanceData.length,
    })

    console.log('🚀 About to return from fetcher:', result)
    return result
  } catch (error) {
    console.error('❌ Error in useReporting fetcher:', error)
    throw error
  }
}

export function useReporting(clientTicker: string) {
  const [data, setData] = useState<ReportingData | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(undefined)

  useEffect(() => {
    if (!clientTicker) return

    const fetchData = async () => {
      setLoading(true)
      setError(undefined)
      try {
        const result = await fetcher(`reporting|${clientTicker}`)
        console.log('✅ Direct fetch success:', {
          hasData: !!result,
          meetingsCount: result?.meetings?.length || 0,
        })
        setData(result)
      } catch (err) {
        console.error('❌ Direct fetch error:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientTicker])

  console.log('🔄 useReporting state [UPDATED v2]:', {
    clientTicker,
    loading,
    hasData: !!data,
    hasError: !!error,
    meetingsCount: data?.meetings?.length || 0,
    timestamp: new Date().toISOString(),
  })

  return {
    data,
    loading,
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
      const method =
        (position as { votingSource?: 'WEB' | 'PRINT' | 'IVR' }).votingSource ??
        position.source ??
        'WEB'
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
    const meetingProposals = proposals.filter((p) => p.meetingId === meeting.id)
    const meetingPositions = positions.filter((p) => p.meetingId === meeting.id)

    const existing = yearMap.get(year) || {
      year,
      participationRate: 0,
      proposalsCount: 0,
      passedCount: 0,
      failedCount: 0,
    }

    existing.proposalsCount += meetingProposals.length
    existing.passedCount += meetingProposals.filter(
      (p) => p.finalResult === 'PASSED'
    ).length
    existing.failedCount += meetingProposals.filter(
      (p) => p.finalResult === 'FAILED'
    ).length

    const totalSharesOutstandingNum = Number.parseInt(
      meeting.totalSharesOutstanding || '0',
      10
    )
    if (meetingPositions.length > 0 && totalSharesOutstandingNum > 0) {
      const actualShares = meetingPositions.reduce(
        (sum, pos) => sum + (pos.shares || 0),
        0
      )
      const participationRate = (actualShares / totalSharesOutstandingNum) * 100
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

  const meetingProposals = proposals.filter((p) => p.meetingId === latestMeeting.id)
  const meetingPositions = positions.filter((p) => p.meetingId === latestMeeting.id)

  const passedProposals = meetingProposals.filter(
    (p) => p.finalResult === 'PASSED'
  ).length
  const failedProposals = meetingProposals.filter(
    (p) => p.finalResult === 'FAILED'
  ).length

  const totalSharesOutstandingNum = Number.parseInt(
    latestMeeting.totalSharesOutstanding || '0',
    10
  )
  const actualShares = meetingPositions.reduce((sum, pos) => sum + (pos.shares || 0), 0)
  const participationRate =
    totalSharesOutstandingNum > 0 ? (actualShares / totalSharesOutstandingNum) * 100 : 0

  return {
    totalProposals: meetingProposals.length,
    passedProposals,
    failedProposals,
    participationRate,
    quorumAchieved: participationRate >= (latestMeeting.quorumRequirement ?? 50),
    materials: {
      sent: meetingPositions.length,
      total: totalSharesOutstandingNum || meetingPositions.length,
      sentDate: latestMeeting.mailingDate || latestMeeting.meetingDate || '',
    },
  }
}

function calculateAuditComplianceData(
  meetings: Meeting[],
  proposals: Proposal[]
): AuditComplianceData[] {
  return meetings.map((meeting) => {
    const meetingProposals = proposals.filter((p) => p.meetingId === meeting.id)
    const issues: string[] = []

    if (!meeting.mailingDate) issues.push('Materials sent date not recorded')
    if (meetingProposals.length === 0) issues.push('No proposals recorded')
    if (!meeting.quorumRequirement) issues.push('Quorum requirement not set')

    const complianceScore = Math.max(0, 100 - issues.length * 25)

    return {
      meetingId: meeting.id || '',
      meetingTitle: meeting.title || 'Untitled Meeting',
      complianceScore,
      issues,
      materialsCompliant: !!meeting.mailingDate,
    }
  })
}

function calculateQuorumData(meetings: Meeting[], positions: Position[]): QuorumData[] {
  return meetings.map((meeting) => {
    const meetingPositions = positions.filter((p) => p.meetingId === meeting.id)
    const actualShares = meetingPositions.reduce((sum, pos) => sum + (pos.shares || 0), 0)
    const totalSharesOutstandingNum = Number.parseInt(
      meeting.totalSharesOutstanding || '0',
      10
    )
    const requiredShares =
      totalSharesOutstandingNum * ((meeting.quorumRequirement ?? 50) / 100)
    const participationRate = totalSharesOutstandingNum
      ? (actualShares / totalSharesOutstandingNum) * 100
      : 0

    // Quorum achievement date based on cumulative sharesVoted by date
    const datedVotes = meetingPositions
      .filter((p) => !!p.dateVoted && (p.sharesVoted || 0) > 0)
      .map((p) => ({ date: new Date(p.dateVoted as string), shares: p.sharesVoted || 0 }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    let quorumDate: Date | null = null
    if (datedVotes.length > 0 && requiredShares > 0) {
      let cumulative = 0
      for (const v of datedVotes) {
        cumulative += v.shares
        if (cumulative >= requiredShares) {
          quorumDate = v.date
          break
        }
      }
    }

    let daysToQuorum: number | null = null
    if (quorumDate && meeting.mailingDate) {
      const start = new Date(meeting.mailingDate)
      const diffMs = quorumDate.getTime() - start.getTime()
      daysToQuorum = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    }

    let earlyVotesPct = 0
    let lateVotesPct = 0
    if (meeting.meetingDate && totalSharesOutstandingNum > 0) {
      const meetingDt = new Date(meeting.meetingDate)
      const oneWeekBefore = new Date(meetingDt.getTime() - 7 * 24 * 60 * 60 * 1000)
      const earlyShares = datedVotes
        .filter((v) => v.date < oneWeekBefore)
        .reduce((s, v) => s + v.shares, 0)
      const lateShares = datedVotes
        .filter((v) => v.date >= oneWeekBefore && v.date <= meetingDt)
        .reduce((s, v) => s + v.shares, 0)
      earlyVotesPct = (earlyShares / totalSharesOutstandingNum) * 100
      lateVotesPct = (lateShares / totalSharesOutstandingNum) * 100
    }

    return {
      meetingId: meeting.id || '',
      meetingTitle: meeting.title || 'Untitled Meeting',
      requiredShares,
      actualShares,
      quorumMet: actualShares >= requiredShares,
      participationRate,
      daysToQuorum,
      earlyVotesPct,
      lateVotesPct,
    }
  })
}
