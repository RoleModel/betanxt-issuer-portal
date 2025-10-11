'use client'

import useSWR from 'swr'

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
  // Transformed data for UI components
  mappedEventSummary: MappedEventSummary[]
  mappedYearOverYear: MappedYearOverYear[]
  mappedProposalPerformanceData: MappedProposalPerformanceData[]
  mappedAuditComplianceData: MappedAuditComplianceData[]
  mappedQuorumPerformanceData: QuorumData[]
  availableDirectors: string[]
  availableMeetings: { id: string; title: string }[]
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

// UI-specific mapped data interfaces
interface MappedEventSummary {
  event: string
  meetingId?: string
  recordDate: string
  meetingType: string
  quorum: string
  participation: string
  numProposals: number
  outcome: string
  meetingYear: number
}

interface MappedYearOverYear {
  year: number
  participationRate: number
  proposalsCount: number
  passedCount: number
  failedCount: number
}

interface MappedProposalPerformanceData {
  type: string
  totalPresented: string
  averageSupport: string
  min: string
  max: string
  percentPassed: string
}

interface MappedAuditComplianceData {
  event: string
  meetingId?: string
  materialsSent: string
  inspectorCertified: string
  universalProxy: string
  finalCertified: string
}

const fetcher = async (clientTicker: string): Promise<ReportingData> => {
  // ticker provided directly by SWR
  // Fetch all meetings for the ticker
  const apiClient = await buildApiClient()
  const currentYear = new Date().getFullYear()

  // Fetch all meetings for this ticker
  const meetingsResponse = await apiClient.GET('/meetings', {
    params: { query: { ticker: clientTicker } },
  })

  const { data: meetingsData, error: _meetingsError } = meetingsResponse

  if (!meetingsData) {
    return {
      meetings: [],
      proposals: [],
      positions: [],
      directorPerformanceData: [],
      participationData: { webVoting: 0, printVoting: 0, ivrVoting: 0, totalVotes: 0 },
      yearOverYearData: [],
      eventSummaryData: {
        totalProposals: 0,
        passedProposals: 0,
        failedProposals: 0,
        participationRate: 0,
        quorumAchieved: false,
        materials: { sent: 0, total: 0, sentDate: '' },
      },
      auditComplianceData: [],
      quorumData: [],
      // Transformed data for UI components
      mappedEventSummary: [],
      mappedYearOverYear: [],
      mappedProposalPerformanceData: [],
      mappedAuditComplianceData: [],
      mappedQuorumPerformanceData: [],
      availableDirectors: [],
      availableMeetings: [],
    }
  }

  // Filter out future meetings (keep current year and past)
  const meetingsArray = Array.isArray(meetingsData)
    ? meetingsData
    : (meetingsData as { meetings?: Meeting[] })?.meetings || []
  const allMeetings = meetingsArray.filter((meeting) => {
    const meetingYear =
      meeting.meetingYear ||
      (meeting.meetingDate ? new Date(meeting.meetingDate).getFullYear() : null)
    return meetingYear && meetingYear <= currentYear
  })

  // Filter to only completed meetings for reporting
  const completedMeetings = allMeetings.filter((meeting) => meeting.status === 'COMPLETE')

  // OPTIMIZATION 2: Parallel fetch of proposals and positions for completed meetings only
  const meetingIds = completedMeetings.slice(0, 20).map((m) => m.id) // Limit to most recent 20 meetings

  const proposalPromises = meetingIds.map((id) =>
    apiClient
      .GET('/meetings/{meetingId}/proposals', {
        params: { path: { meetingId: id ?? '' } },
      })
      .catch(() => ({ data: [] }))
  )
  const positionPromises = meetingIds.map(async (id) => {
    try {
      const result = await apiClient.GET('/positions', {
        params: {
          query: {
            meetingId: `${id}`,
            limit: 4000,
          },
        },
      })

      return result
    } catch (_error) {
      return { data: [] as Position[] }
    }
  })

  const [proposalResults, positionResults] = await Promise.all([
    Promise.all(proposalPromises),
    Promise.all(positionPromises),
  ])

  const allProposals = proposalResults.flatMap((res, idx) => {
    const mid = meetingIds[idx]
    const data = (res as unknown as { data?: unknown }).data as
      | (Proposal & { meetingId?: string })[]
      | { proposals?: (Proposal & { meetingId?: string })[] }
      | undefined
    let list: (Proposal & { meetingId?: string })[] = []
    if (Array.isArray(data)) list = data
    if (
      !Array.isArray(data) &&
      data &&
      Array.isArray((data as { proposals?: Proposal[] }).proposals)
    ) {
      list =
        (data as { proposals?: (Proposal & { meetingId?: string })[] }).proposals || []
    }
    return list.map((p) => ({ ...p, meetingId: p.meetingId ?? mid })) as Proposal[]
  })
  const allPositions: Position[] = positionResults.flatMap((res) => {
    const data = (res as unknown as { data?: unknown }).data as
      | Position[]
      | { positions?: Position[] }
      | undefined
    if (Array.isArray(data)) return data
    if (data && Array.isArray((data as { positions?: Position[] }).positions)) {
      return (data as { positions?: Position[] }).positions!
    }
    return []
  })

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

  // UI TRANSFORMATIONS: Transform data for UI components
  let mappedEventSummary: MappedEventSummary[] = []
  let mappedYearOverYear: MappedYearOverYear[] = []
  let mappedProposalPerformanceData: MappedProposalPerformanceData[] = []
  let mappedAuditComplianceData: MappedAuditComplianceData[] = []

  try {
    mappedEventSummary = transformEventSummaryData(
      completedMeetings,
      allProposals,
      allPositions
    )
  } catch (_error) {
    mappedEventSummary = []
  }

  try {
    mappedYearOverYear = transformYearOverYearData(yearOverYearData)
  } catch (_error) {
    mappedYearOverYear = []
  }

  try {
    mappedProposalPerformanceData = transformProposalPerformanceData(allProposals)
  } catch (_error) {
    mappedProposalPerformanceData = []
  }

  try {
    mappedAuditComplianceData = transformAuditComplianceData(auditComplianceData)
  } catch (_error) {
    mappedAuditComplianceData = []
  }

  const mappedQuorumPerformanceData = quorumData
  const availableDirectors = directorPerformanceData.map((d) => d.directorName)
  const availableMeetings = completedMeetings.map((m) => ({
    id: m.id ?? '',
    title: m.title ?? 'Untitled Meeting',
  }))

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
    // Transformed data for UI components
    mappedEventSummary,
    mappedYearOverYear,
    mappedProposalPerformanceData,
    mappedAuditComplianceData,
    mappedQuorumPerformanceData,
    availableDirectors,
    availableMeetings,
  }

  return result
}

export function useReporting(clientTicker: string) {
  const { data, error, isLoading } = useSWR(
    clientTicker ? ['reporting', clientTicker] : null,
    ([, ticker]) => fetcher(ticker),
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )

  return { data, loading: isLoading, error }
}

// Helper calculation functions
function calculateDirectorPerformance(proposals: Proposal[]): DirectorPerformanceData[] {
  // Log unique proposal types
  const directorProposals = proposals.filter(
    (p) =>
      p.proposalType === 'Director Election' ||
      p.proposalType === 'DIRECTOR_ELECTION' ||
      p.directorName ||
      /Election of Director/i.test(p.proposalTitle ?? '') ||
      /Director/i.test(p.proposalTitle ?? '') ||
      /Elect/i.test(p.proposalTitle ?? '')
  )

  const directorMap = new Map<string, DirectorPerformanceData>()

  directorProposals.forEach((proposal) => {
    const directorName =
      proposal.directorName || extractDirectorNameFromTitle(proposal.proposalTitle ?? '')
    if (!directorName) return

    const existing = directorMap.get(directorName) || {
      directorName,
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      totalVotes: 0,
    }

    existing.forVotes += proposal.totalVotesFor ?? 0
    existing.againstVotes += proposal.totalVotesAgainst ?? 0
    existing.abstainVotes += proposal.totalVotesAbstain ?? 0
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
      acc[method] = (acc[method] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const totalVotes = positions.length

  return {
    webVoting: votingMethods.WEB ?? 0,
    printVoting: votingMethods.PRINT ?? 0,
    ivrVoting: votingMethods.IVR ?? 0,
    totalVotes,
  }
}

function calculateYearOverYearData(
  meetings: Meeting[],
  proposals: Proposal[],
  positions: Position[]
): YearOverYearData[] {
  const yearMap = new Map<
    number,
    YearOverYearData & { participationSum: number; participationCount: number }
  >()

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
      participationSum: 0,
      participationCount: 0,
    }

    existing.proposalsCount += meetingProposals.length
    existing.passedCount += meetingProposals.filter((p) => {
      const fr =
        (p as unknown as { finalResult?: string; final_result?: string }).finalResult ??
        (p as unknown as { final_result?: string }).final_result
      return fr === 'PASSED'
    }).length
    existing.failedCount += meetingProposals.filter((p) => {
      const fr =
        (p as unknown as { finalResult?: string; final_result?: string }).finalResult ??
        (p as unknown as { final_result?: string }).final_result
      return fr === 'FAILED'
    }).length

    const totalSharesOutstandingNum = Number.parseInt(
      meeting.totalSharesOutstanding ?? '0',
      10
    )
    if (meetingPositions.length > 0 && totalSharesOutstandingNum > 0) {
      const actualShares = meetingPositions.reduce(
        (sum, pos) => sum + (pos.sharesVoted ?? 0),
        0
      )
      const participationRate = (actualShares / totalSharesOutstandingNum) * 100
      // Average participation across all meetings in the year
      existing.participationSum += participationRate
      existing.participationCount += 1
      existing.participationRate = existing.participationSum / existing.participationCount
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
    (p) =>
      ((p as unknown as { meetingId?: string; meeting_id?: string }).meetingId ??
        (p as unknown as { meeting_id?: string }).meeting_id) === latestMeeting.id
  )
  const meetingPositions = positions.filter((p) => p.meetingId === latestMeeting.id)

  const passedProposals = meetingProposals.filter((p) => {
    const fr =
      (p as unknown as { finalResult?: string; final_result?: string }).finalResult ??
      (p as unknown as { final_result?: string }).final_result
    return fr === 'PASSED'
  }).length
  const failedProposals = meetingProposals.filter((p) => {
    const fr =
      (p as unknown as { finalResult?: string; final_result?: string }).finalResult ??
      (p as unknown as { final_result?: string }).final_result
    return fr === 'FAILED'
  }).length

  const totalSharesOutstandingNum = Number.parseInt(
    latestMeeting.totalSharesOutstanding ?? '0',
    10
  )
  const actualShares = meetingPositions.reduce(
    (sum, pos) => sum + (pos.sharesVoted ?? 0),
    0
  )
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
      sentDate: (latestMeeting.mailingDate || latestMeeting.meetingDate) ?? '',
    },
  }
}

function calculateAuditComplianceData(
  meetings: Meeting[],
  proposals: Proposal[]
): AuditComplianceData[] {
  return meetings.map((meeting) => {
    const meetingProposals = proposals.filter(
      (p) =>
        ((p as unknown as { meetingId?: string; meeting_id?: string }).meetingId ??
          (p as unknown as { meeting_id?: string }).meeting_id) === meeting.id
    )
    const issues: string[] = []

    if (!meeting.mailingDate) issues.push('Materials sent date not recorded')
    if (meetingProposals.length === 0) issues.push('No proposals recorded')
    if (!meeting.quorumRequirement) issues.push('Quorum requirement not set')

    const complianceScore = Math.max(0, 100 - issues.length * 25)

    return {
      meetingId: meeting.id ?? '',
      meetingTitle: meeting.title ?? 'Untitled Meeting',
      complianceScore,
      issues,
      materialsCompliant: !!meeting.mailingDate,
    }
  })
}

function calculateQuorumData(meetings: Meeting[], positions: Position[]): QuorumData[] {
  return meetings.map((meeting) => {
    const meetingPositions = positions.filter((p) => p.meetingId === meeting.id)
    const actualShares = meetingPositions.reduce(
      (sum, pos) => sum + (pos.sharesVoted ?? 0),
      0
    )

    const totalSharesOutstandingNum = Number.parseInt(
      meeting.totalSharesOutstanding ?? '0',
      10
    )
    const requiredShares =
      totalSharesOutstandingNum * ((meeting.quorumRequirement ?? 50) / 100)
    const participationRate = totalSharesOutstandingNum
      ? (actualShares / totalSharesOutstandingNum) * 100
      : 0

    // Quorum achievement date based on cumulative sharesVoted by date
    const datedVotes = meetingPositions
      .filter((p) => !!p.dateVoted && (p.sharesVoted ?? 0) > 0)
      .map((p) => {
        // Parse the date format "MM/DD/YYYY HH:MMAM/PM"
        const dateStr = p.dateVoted!
        let parsedDate: Date

        // Parse MM/DD/YYYY HH:MMAM format manually
        // Format is like "11/25/2024 12:00AM"
        const match = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(dateStr)
        if (match) {
          const [_, month, day, year] = match
          // Create date with just the date components (ignore time)
          parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        } else {
          // Try direct parsing as fallback
          parsedDate = new Date(dateStr)
          if (isNaN(parsedDate.getTime())) {
            parsedDate = new Date() // Last resort fallback
          }
        }

        return { date: parsedDate, shares: p.sharesVoted ?? 0 }
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calculate days to quorum: from first vote date to meeting date
    let daysToQuorum: number | null = null
    if (datedVotes.length > 0 && meeting.meetingDate) {
      const firstVoteDate = datedVotes[0].date
      const meetingDate = new Date(meeting.meetingDate)
      const diffMs = meetingDate.getTime() - firstVoteDate.getTime()
      daysToQuorum = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

      // Debug logging for annual meetings
      if (meeting.id?.includes('annual-meeting')) {
        // Debug data would go here if needed
      }
    }

    // Calculate early and late vote percentages
    let earlyVotesPct = 0
    let lateVotesPct = 0
    if (datedVotes.length > 0 && meeting.meetingDate && totalSharesOutstandingNum > 0) {
      const firstVoteDate = datedVotes[0].date
      const meetingDate = new Date(meeting.meetingDate)

      // Early votes: first 7 days after first vote
      const earlyEndDate = new Date(firstVoteDate.getTime() + 7 * 24 * 60 * 60 * 1000)

      // Late votes: last 7 days before meeting
      const lateStartDate = new Date(meetingDate.getTime() - 7 * 24 * 60 * 60 * 1000)

      const earlyShares = datedVotes
        .filter((v) => v.date <= earlyEndDate)
        .reduce((s, v) => s + v.shares, 0)

      const lateShares = datedVotes
        .filter((v) => v.date >= lateStartDate && v.date <= meetingDate)
        .reduce((s, v) => s + v.shares, 0)

      earlyVotesPct = (earlyShares / totalSharesOutstandingNum) * 100
      lateVotesPct = (lateShares / totalSharesOutstandingNum) * 100

      // Debug logging for annual meetings
      if (meeting.id?.includes('annual-meeting')) {
        // Debug data would go here if needed
      }
    }

    return {
      meetingId: meeting.id ?? '',
      meetingTitle: meeting.title ?? 'Untitled Meeting',
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

// UI Transformation functions
function transformEventSummaryData(
  meetings: Meeting[],
  proposals: Proposal[] = [],
  positions: Position[] = []
): MappedEventSummary[] {
  if (!meetings || meetings.length === 0) {
    return []
  }

  // Pre-aggregate proposals by meeting id (support camelCase and snake_case)
  const proposalsByMeeting = proposals.reduce((acc, p) => {
    const key =
      ((p as unknown as { meetingId?: string; meeting_id?: string }).meetingId ??
        (p as unknown as { meeting_id?: string }).meeting_id) ||
      ''
    if (!key) return acc
    const fr =
      (p as unknown as { finalResult?: string; final_result?: string }).finalResult ??
      (p as unknown as { final_result?: string }).final_result
    const bucket = acc.get(key) || { total: 0, passed: 0 }
    bucket.total += 1
    if (fr === 'PASSED') bucket.passed += 1
    acc.set(key, bucket)
    return acc
  }, new Map<string, { total: number; passed: number }>())

  const results: MappedEventSummary[] = []

  // Create a row for each meeting
  for (const meeting of meetings) {
    try {
      // Get year from meeting date for display
      const year = meeting.meetingDate
        ? new Date(meeting.meetingDate).getFullYear()
        : 'Unknown'
      const meetingType = meeting.meetingType ?? 'Annual'

      // Get meeting-specific data
      const proposalAgg = proposalsByMeeting.get(meeting.id ?? '') || {
        total: 0,
        passed: 0,
      }
      const meetingPositions = positions.filter((p) => p.meetingId === meeting.id)

      // Calculate participation rate using shares_voted (not shares)
      const totalSharesOutstandingNum = Number.parseInt(
        meeting.totalSharesOutstanding ?? '0',
        10
      )
      const actualShares = meetingPositions.reduce((sum, pos) => {
        const sharesVoted = Number(pos.sharesVoted) || 0
        return sum + sharesVoted
      }, 0)
      const participationRate =
        totalSharesOutstandingNum > 0
          ? (actualShares / totalSharesOutstandingNum) * 100
          : 0

      // Calculate proposal outcomes
      const passedProposals = proposalAgg.passed
      const totalProposals = proposalAgg.total

      // Debug: log proposal results for first meeting
      // Using aggregated counts; raw sample logging not necessary here.

      // Calculate quorum
      const quorumRequirement = meeting.quorumRequirement || 50
      const quorumMet = participationRate >= quorumRequirement

      const result = {
        event: `${meetingType} ${year}`,
        meetingId: meeting.id,
        recordDate: (meeting.recordDate || meeting.meetingDate) ?? '',
        meetingType: meetingType,
        quorum: quorumMet ? 'Yes' : 'No',
        participation: `${participationRate.toFixed(1)}%`,
        numProposals: totalProposals,
        outcome:
          totalProposals > 0
            ? `${passedProposals}/${totalProposals} Passed`
            : 'No Proposals',
        meetingYear: typeof year === 'number' ? year : parseInt(year.toString(), 10) || 0,
      }

      results.push(result)
    } catch {
      // Skip invalid meeting data
    }
  }

  return results
}

function transformYearOverYearData(
  yearOverYearData: YearOverYearData[]
): MappedYearOverYear[] {
  return yearOverYearData.map((y) => ({
    year:
      typeof y.year === 'string' ? parseInt(y.year, 10) : (y.year as unknown as number),
    participationRate: y.participationRate,
    proposalsCount: y.proposalsCount,
    passedCount: y.passedCount,
    failedCount: y.failedCount,
  }))
}

function transformProposalPerformanceData(
  proposals: Proposal[]
): MappedProposalPerformanceData[] {
  if (!proposals) return []

  // Group proposals by type and calculate performance metrics
  const proposalsByType = proposals.reduce(
    (acc, proposal) => {
      const type = proposal.proposalType ?? 'Unknown'
      if (!acc[type]) {
        acc[type] = { total: 0, passed: 0, support: [] }
      }
      acc[type].total++
      if (proposal.finalResult === 'PASSED') {
        acc[type].passed++
      }
      // Add vote percentages if available using correct field names
      const forVotes = proposal.totalVotesFor ?? 0
      const againstVotes = proposal.totalVotesAgainst ?? 0
      const abstainVotes = proposal.totalVotesAbstain ?? 0
      const totalVotes = forVotes + againstVotes + abstainVotes

      if (totalVotes > 0) {
        acc[type].support.push((forVotes / totalVotes) * 100)
      }
      return acc
    },
    {} as Record<string, { total: number; passed: number; support: number[] }>
  )

  return Object.entries(proposalsByType).map(([type, data]) => {
    const averageSupport =
      data.support.length > 0
        ? data.support.reduce((a, b) => a + b, 0) / data.support.length
        : 0
    const passRate = data.total > 0 ? (data.passed / data.total) * 100 : 0

    // Calculate actual min and max from the support data
    const minSupport = data.support.length > 0 ? Math.min(...data.support) : 0
    const maxSupport = data.support.length > 0 ? Math.max(...data.support) : 100

    return {
      type,
      totalPresented: data.total.toString(),
      averageSupport: `${averageSupport.toFixed(1)}%`,
      min: `${minSupport.toFixed(1)}%`,
      max: `${maxSupport.toFixed(1)}%`,
      percentPassed: `${passRate.toFixed(1)}%`,
    }
  })
}

function transformAuditComplianceData(
  auditComplianceData: AuditComplianceData[]
): MappedAuditComplianceData[] {
  return auditComplianceData.map((item) => {
    // Extract year from meetingId (format: ticker-type-year)
    const yearMatch = /(\d{4})$/.exec(item.meetingId)
    const year = yearMatch ? yearMatch[1] : ''
    const eventTitle = year ? `${item.meetingTitle} ${year}` : item.meetingTitle

    return {
      event: eventTitle,
      meetingId: item.meetingId,
      materialsSent: item.materialsCompliant ? 'Yes' : 'No',
      inspectorCertified: item.complianceScore >= 75 ? 'Yes' : 'No',
      universalProxy: (item.issues || []).length === 0 ? 'Yes' : 'No',
      finalCertified: item.complianceScore >= 90 ? 'Yes' : 'No',
    }
  })
}
