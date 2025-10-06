import { copycat } from '@snaplet/copycat'
import * as fs from 'fs'
import { DateTime } from 'luxon'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { CSVProcessor } from '../mock-api-server/csv-processor'
import type {
  CompanyPositionData,
  CompanyProposalData,
} from '../mock-api-server/csv-processor'
import { seedConfig } from './seed.config'

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type VoteStatusSummary = Awaited<ReturnType<typeof CSVProcessor.processVoteStatusSummary>>

/**
 * Shift weekend dates to next Monday
 * Saturday (6) and Sunday (0) get moved to Monday
 */
const shiftWeekendToMonday = (date: DateTime): DateTime => {
  const dayOfWeek = date.weekday // luxon uses 1=Monday, 7=Sunday

  if (dayOfWeek === 7) {
    // Sunday - move to Monday (+1 day)
    return date.plus({ days: 1 })
  } else if (dayOfWeek === 6) {
    // Saturday - move to Monday (+2 days)
    return date.plus({ days: 2 })
  }

  return date
}

// Function to escape SQL strings
const escapeSql = (str: string | null | undefined): string => {
  if (!str) return 'NULL'
  // Use dollar-quoted strings for strings with special characters (no escaping needed)
  // Dollar quoting syntax: $$string$$ - treats everything literally
  if (str.includes('\\') || str.includes('\n') || str.includes('\r')) {
    // Replace single $ with something else to avoid breaking dollar quoting
    const safe = str.replace(/\$/g, '＄') // Use fullwidth dollar sign
    return `$$${safe}$$`
  }
  // For simple strings, use regular single quotes
  return `'${str.replace(/'/g, "''")}'`
}

// Function to format value for SQL
const sqlValue = (value: any): string => {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'string') return escapeSql(value)
  if (typeof value === 'number') {
    if (isNaN(value)) return '0'
    return value.toString()
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value instanceof Date) return escapeSql(value.toISOString())
  return escapeSql(String(value))
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const computeParticipationFromPositions = (
  positions: CompanyPositionData[] | null | undefined,
  totalSharesOutstanding: number
): number | null => {
  if (!positions || positions.length === 0) return null

  const votedShares = positions.reduce(
    (sum, position) => sum + (position.sharesVoted || 0),
    0
  )

  const denominator = totalSharesOutstanding
    ? totalSharesOutstanding
    : positions.reduce((sum, position) => sum + (position.shares || 0), 0)

  if (!Number.isFinite(denominator) || denominator <= 0) {
    return null
  }

  const participation = votedShares / denominator
  return clamp(participation, 0, 1)
}

const computeParticipationFromVoteSummary = (
  summary: VoteStatusSummary | null | undefined,
  totalSharesOutstanding: number
): number | null => {
  if (!summary) return null

  const dtcVoted = summary.dtcSummary?.votedShares ?? 0
  const dtcUnvoted = summary.dtcSummary?.unvotedShares ?? 0
  const nonDtcVoted = summary.nonDtcSummary?.votedSubtotalShares ?? 0
  const nonDtcUnvoted = summary.nonDtcSummary?.unvotedShares ?? 0
  const nonDtcGrandTotal = summary.nonDtcSummary?.grandTotalShares ?? 0

  const numerator = dtcVoted + nonDtcVoted

  const inferredDtcTotal = dtcVoted + dtcUnvoted
  const inferredNonDtcTotal = nonDtcGrandTotal || nonDtcVoted + nonDtcUnvoted

  const denominatorCandidate = inferredDtcTotal + inferredNonDtcTotal
  const denominator =
    totalSharesOutstanding > 0 ? totalSharesOutstanding : denominatorCandidate

  if (!Number.isFinite(denominator) || denominator <= 0) {
    return null
  }

  const participation = numerator / denominator
  return clamp(participation, 0, 1)
}

const buildResultsFromCsvProposal = (
  proposal: CompanyProposalData,
  totalSharesOutstanding: number,
  meetingDateISO?: string
) => {
  const totalVotesFor = Math.max(0, Math.round(proposal.votesFor || 0))
  const totalVotesAgainst = Math.max(0, Math.round(proposal.votesAgainst || 0))
  const totalVotesAbstain = Math.max(0, Math.round(proposal.votesAbstain || 0))

  const totalVotesCalculated = totalVotesFor + totalVotesAgainst + totalVotesAbstain
  const totalVotes = Math.max(
    totalVotesCalculated,
    Math.round(proposal.votesTotal || totalVotesCalculated)
  )

  const totalSharesEligible = Math.max(
    Math.round(totalSharesOutstanding || totalVotes),
    totalVotes
  )

  const forPercentage = totalVotes > 0 ? (totalVotesFor / totalVotes) * 100 : 0
  const againstPercentage = totalVotes > 0 ? (totalVotesAgainst / totalVotes) * 100 : 0
  const abstainPercentage = totalVotes > 0 ? (totalVotesAbstain / totalVotes) * 100 : 0
  const participationRate =
    totalSharesEligible > 0 ? (totalVotes / totalSharesEligible) * 100 : 0

  const votingCompletedAt = meetingDateISO
    ? DateTime.fromISO(meetingDateISO).plus({ days: 1 }).toISO()
    : DateTime.now().toISO()

  return {
    finalResult: sqlValue(totalVotesFor >= totalVotesAgainst ? 'PASSED' : 'FAILED'),
    totalVotesFor: totalVotesFor.toString(),
    totalVotesAgainst: totalVotesAgainst.toString(),
    totalVotesAbstain: totalVotesAbstain.toString(),
    totalSharesEligible: totalSharesEligible.toString(),
    forPercentage: forPercentage.toFixed(2),
    againstPercentage: againstPercentage.toFixed(2),
    abstainPercentage: abstainPercentage.toFixed(2),
    participationRate: participationRate.toFixed(2),
    votingCompleted: 'true',
    votingCompletedAt: sqlValue(votingCompletedAt),
    participationFraction: participationRate / 100,
  }
}

const calculateParticipationTarget = (
  ticker: string,
  year: number,
  meetingType: string,
  phase: number
): number => {
  // For historical completed meetings (2024 and earlier), always use realistic participation
  if (year <= 2024 && phase === 8) {
    const seed = copycat.int(`${ticker}-${year}-participation`, { min: 0, max: 1000 })
    // More realistic participation rates: 25-50% for historical meetings
    const participation = 0.25 + seed / 4000 // 25-50% range
    return participation
  }

  if (phase < 6) return 0

  const lowerMeetingType = meetingType.toLowerCase()
  // Start with a lower base for more realistic participation
  let base = 0.38

  if (year <= 2024) {
    base -= 0.01 * (2024 - year)
  }

  if (lowerMeetingType.includes('special')) {
    base += 0.03
  }

  const tickerAdjustment = copycat.int(`participation-${ticker}`, {
    min: -100,
    max: 100,
  })
  const meetingAdjustment = copycat.int(
    `participation-${ticker}-${year}-${meetingType}`,
    {
      min: -75,
      max: 75,
    }
  )

  base += (tickerAdjustment + meetingAdjustment) / 10000

  if (phase === 6) {
    base *= 0.55
  } else if (phase === 7) {
    base *= 0.7
  }

  return clamp(base, 0.25, 0.5)
}

// Function to generate proposal results based on meeting year and type
const generateProposalResults = (
  proposalType: string,
  meetingYear: string,
  proposalIndex: number,
  proposalTitle?: string,
  isWendys: boolean = false,
  meetingType?: string,
  targetParticipation?: number,
  sharesOutstandingOverride?: number,
  meetingPhase?: number
) => {
  const year = parseInt(meetingYear)

  // 2026+ meetings haven't happened yet, EXCEPT for Phase 7 special meetings which are actively voting
  // 2025 and earlier all have results (completed meetings)
  const isPhase7SpecialMeeting =
    meetingPhase === 7 && meetingType?.toLowerCase().includes('special')

  if (year >= 2026 && !isPhase7SpecialMeeting) {
    return {
      finalResult: 'NULL',
      totalVotesFor: 'NULL',
      totalVotesAgainst: 'NULL',
      totalVotesAbstain: 'NULL',
      totalSharesEligible: 'NULL',
      forPercentage: 'NULL',
      againstPercentage: 'NULL',
      abstainPercentage: 'NULL',
      participationRate: 'NULL',
      votingCompleted: 'false',
      votingCompletedAt: 'NULL',
    }
  }

  // 2025 and earlier meetings all have results from real CSV data or generated

  // Generate realistic results for historical meetings
  const seedStr = `${proposalType}-${meetingYear}-${proposalIndex}`
  const seed = copycat.int(seedStr, { min: 0, max: 999999 })

  const baseShares =
    typeof sharesOutstandingOverride === 'number' && sharesOutstandingOverride > 0
      ? Math.floor(sharesOutstandingOverride)
      : isWendys
        ? 148285700
        : 50000000 + (seed % 25000000)

  // Different pass rates by proposal type
  let passRate = 0.85 // Default 85% pass rate
  if (proposalType === 'Director Election')
    passRate = 0.95 // Directors almost always pass
  else if (proposalType === 'Say on Pay')
    passRate = 0.75 // More contentious
  else if (proposalType === 'Auditor Ratification')
    passRate = 0.98 // Almost always pass
  else if (proposalType && proposalType.includes('Shareholder')) passRate = 0.25 // Shareholder proposals often fail

  const willPass = seed % 100 < passRate * 100
  let participationRate: number

  if (typeof targetParticipation === 'number') {
    const participationSeed = copycat.int(
      `proposal-participation-${proposalType}-${meetingYear}-${proposalIndex}`,
      { min: -40, max: 40 }
    )
    participationRate = clamp(targetParticipation + participationSeed / 10000, 0.58, 0.9)
  } else {
    participationRate = 0.65 + (seed % 1000) / 10000 // 65-75% participation
  }

  const totalEligible = Math.floor(baseShares * participationRate)

  let forVotes, againstVotes, abstainVotes

  if (willPass) {
    forVotes = Math.floor(totalEligible * (0.7 + (seed % 300) / 1000)) // 70-100% of eligible
    const remaining = totalEligible - forVotes
    againstVotes = Math.floor(remaining * ((seed % 400) / 1000)) // 0-40% of remaining
    abstainVotes = remaining - againstVotes
  } else {
    againstVotes = Math.floor(totalEligible * (0.5 + (seed % 200) / 1000)) // 50-70% against
    const remaining = totalEligible - againstVotes
    forVotes = Math.floor(remaining * ((seed % 600) / 1000)) // 0-60% of remaining
    abstainVotes = remaining - forVotes
  }

  const forPct = totalEligible > 0 ? (forVotes / totalEligible) * 100 : 0
  const againstPct = totalEligible > 0 ? (againstVotes / totalEligible) * 100 : 0
  const abstainPct = totalEligible > 0 ? (abstainVotes / totalEligible) * 100 : 0

  return {
    finalResult: sqlValue(willPass ? 'PASSED' : 'FAILED'),
    totalVotesFor: forVotes.toString(),
    totalVotesAgainst: againstVotes.toString(),
    totalVotesAbstain: abstainVotes.toString(),
    totalSharesEligible: baseShares.toString(),
    forPercentage: forPct.toFixed(2),
    againstPercentage: againstPct.toFixed(2),
    abstainPercentage: abstainPct.toFixed(2),
    participationRate: (participationRate * 100).toFixed(2),
    votingCompleted: 'true',
    votingCompletedAt: sqlValue(DateTime.fromISO(`${year}-05-15`).toISO()),
    participationFraction: participationRate,
  }
}

// Function to generate task description
const generateTaskDescription = (title: string, type: string, status: string): string => {
  const descriptions: Record<string, string> = {
    'DTCC (SPR) Authorization Status':
      'Check and confirm authorization status with DTCC for shareholder proxy record access.',
    'Plan File Request form':
      'Use this form to request your plan file. First, download the Plan File Request form to your device. Complete all required fields, then return here to upload the finished form for processing.',
    'Transfer Agent Registered File Request Form':
      'BetaNXT will be in contact with your transfer agent to request a copy of the record date shareholder file. We ask that the attached authorization letter be printed on company letterhead, signed, and scanned back to us.',
    'Broadridge/ICS Access':
      'Broadridge is now requiring your submission of the attached Issuer Profile form. Please sign and upload the form here.',
    'DTCC authorization': 'Complete DTCC authorization process for proxy voting access.',
    'Draft Proxy Statement':
      'Please provide the current draft version of your proxy statement as we will need to generate your proxy card and/or notice using the agenda in the proxy statement. We also need to proof it to verify minimum vote requirements for each of your proposal agenda items, including director elections (plurality vs majority) and we will check for logistics regarding your meeting date (Digital/Hybrid/In-person).',
    'Proxy Card':
      'Please be sure to alert the BetaNXT team of any additional edits needed to the proxy card (and/or NAA Form).',
    Notice:
      'Please be sure to alert the BetaNXT team of any additional edits needed to Notice',
    'TA Registered File':
      'Registered file received from your Transfer Agent is typically completed anywhere between 2 and 4 business days. Mediant will be in touch if any additional action is needed on your part.',
    'DTCC SPR':
      'Mediant will download a Securities Position Report (SPR) that we will use to audit/confirm all street holder votes submitted to us as your Official Tabulation Agent.',
    'Plan File(s)': 'Upload employee stock plan participant files.',
    'Beneficial Count Settlement (5 Business Days Post-Record Date)':
      'Confirm and settle beneficial shareholder count with intermediaries.',
    '10-K print-ready PDF': 'Finalize and prepare 10-K annual report PDF for printing.',
    'DTC SPR file transmitted': 'Transmit DTCC SPR file to proxy distribution system.',
    'Transfer-agent file transmitted':
      'Transmit transfer agent file to proxy distribution system.',
    'Shareholder quantity count confirmed':
      'Verify and confirm total shareholder count across all sources.',
    'Proxy Stmt → electronic PDF proof':
      'Generate electronic PDF proof of proxy statement for review.',
    'Release to print 10-K':
      'Authorize release of 10-K annual report to printing facility.',
    'Release to print Proxy Statement':
      'Authorize release of proxy statement to printing facility.',
    'Final hi-res bookmarked PDFs shared with BetaNXT':
      'Deliver final high-resolution, bookmarked PDFs to BetaNXT.',
    'Approve Enhanced Annual Report/10-K & Proxy':
      'We ask that your final approved print ready and bookmarked PDF be made available 48 hours PRIOR to the date you would like the enhanced documents to be posted. ',
    'Approve IVR, Document-hosting & eVote sites':
      'Please use the preview link to the left to verify all shareholder facing sites, you will use the test control number (123456782) to enter the voting site. Once approved, sites will be made active in conjunction with the filing/mailing date.',
    'File DEF 14A & DEFA 14A':
      'File definitive proxy statement and additional proxy materials with SEC.',
    'File ARS': 'File annual report to shareholders with SEC.',
    'Deliver SH material (10-K & Proxy Stmt)':
      'Deliver shareholder materials including 10-K and proxy statement.',
    'Provide access to MIC':
      'Provide access to Meeting Information Center for stakeholders.',
    '2024 FY filing deadline': 'Meet fiscal year 2024 SEC filing deadline requirements.',
    'Notice & Access deadline':
      'Meet Notice & Access posting deadline for proxy materials.',
    'DSM introduction':
      'Conduct Digital Shareholder Meeting introduction and training session.',
    'Mailing proxy materials: Registered & NOBO / Intermediary mailings':
      'Mail proxy materials to registered shareholders and beneficial owners.',
    'Begin daily tabulation reporting':
      'Start daily tabulation and vote reporting process.',
    'DSM Logistics Call':
      'Conduct Digital Shareholder Meeting logistics coordination call.',
    'Official daily tabulation reporting begins':
      'Begin official daily tabulation reporting to all stakeholders.',
    'DSM dry run': 'Conduct full Digital Shareholder Meeting dry run and testing.',
    'DSM deliverables due':
      'Submit all required Digital Shareholder Meeting deliverables.',
    'Final tabulation Results':
      'Compile and deliver final tabulation results for the meeting.',
    'Form 8-K Item 5.07 deadline':
      'File Form 8-K Item 5.07 reporting meeting results within required timeframe.',
  }

  return (
    descriptions[title] ||
    `Complete ${title.toLowerCase()} task for ${type.toLowerCase()}.`
  )
}

// Function to generate task links
const generateTaskLinks = (
  title: string,
  type: string,
  status: string,
  ticker: string
): any[] => {
  const links: any[] = []

  // Authorization tasks
  if (type === 'Authorization') {
    // DTCC Authorization - always show link
    if (title.includes('DTCC')) {
      links.push({
        label: 'Authorize',
        url: 'https://portal.dtcc.com/',
        action: 'authorize',
      })
    }
    // Other authorization tasks only when authorization needed
    else if (status === 'NEEDS_AUTHORIZATION') {
      // Special handling for Broadridge ICC Access tasks
      if (title.includes('Broadridge') && title.includes('Access')) {
        links.push({
          label: 'Download Form',
          url: '',
          action: 'download',
        })
        links.push({
          label: 'Sign Form',
          url: '',
          action: 'signature',
        })
      } else {
        links.push({
          label: 'Authorize',
          url: `https://portal.dtcc.com`,
          action: 'authorize',
        })
      }
    }
  }

  // Document tasks - forms that need to be filled out
  else if (type === 'Document') {
    if (title.includes('Request form') || title.includes('Request Form')) {
      links.push({
        label: 'Download Form',
        url: `#`,
        action: 'download',
      })
    } else {
      links.push({
        label: 'View Document',
        url: `#`,
        action: 'external',
      })
    }
  }

  // File Upload tasks
  else if (type === 'Upload' || type === 'File Upload') {
    links.push({
      label: 'Upload Document',
      url: `#`,
      action: 'upload',
    })
  }

  // Approval tasks
  else if (type === 'Approval') {
    links.push({
      label: 'Review and Approve',
      url: `#`,
      action: 'signature',
    })
  }

  // Filing tasks
  else if (type === 'Filing') {
    links.push({
      label: 'View Document',
      url: ``,
      action: 'external',
    })
  }

  // Default link for other types
  else {
    links.push({
      label: 'View Document',
      url: ``,
      action: 'external',
    })
  }

  return links
}

// CSV parsing interfaces
interface ShareholderVote {
  cusip: string
  accountType: string
  setKey: string
  name: string
  accountNumber: string
  voteStatus: string
  shares: number
  sharesVoted: number
  source: string | null
  dateVoted: string | null
}

interface ProposalVote {
  proposal: string
  mrv: string
  forVotes: number
  againstVotes: number
  abstainVotes: number
  totalVotes: number
}

interface WendysVoteSummary {
  category: string
  shareholders: number
  shareholdersPercent: number
  shares: number
  sharesPercent: number
}

// Parse CSV string into array of objects
function parseCSV(csvContent: string, hasHeader = true): any[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length === 0) return []

  const headers = hasHeader ? lines[0].split(',').map((h) => h.trim()) : []
  const dataLines = hasHeader ? lines.slice(1) : lines

  return dataLines.map((line) => {
    const values = line.split(',').map((v) => v.trim())
    if (!hasHeader) return values

    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  })
}

// Legacy loading functions removed - now using CSVProcessor

// Main seed generation
const main = async () => {
  // Generate SQL statements instead of using Supabase client
  const sqlStatements: string[] = []

  // Legacy CSV loading removed - now using CSVProcessor for all companies

  // Load company positions data for mailing records
  const companyPositions: Record<string, { Active?: any }> = {
    paycom: {
      Active: {
        Totals: {
          Accounts: 3523,
          Positions: 3523,
          Rollups: 0,
        },
        'Mail Positions': {
          Fullset: 3523,
          NAA: 0,
        },
        'Suppressed Positions': {
          Electronic: 0,
          Household: 0,
          Consolidated: 0,
          Canceled: 0,
        },
      },
    },
    woodward: {
      Active: {
        Totals: {
          Accounts: 906,
          Positions: 906,
          Retransmissions: 0,
        },
        'Mail Positions': {
          Fullset: 2,
          NAA: 23,
          'Courtesy/Other': 0,
        },
        'Suppressed Positions': {
          Electronic: 790,
          Household: 1,
          Managed: 76,
          Canceled: 0,
        },
      },
    },
    enliven: {
      Active: {
        Totals: {
          Accounts: 498,
          Positions: 498,
          Retransmissions: 0,
        },
        'Mail Positions': {
          Fullset: 0,
          NAA: 1,
          'Courtesy/Other': 0,
        },
        'Suppressed Positions': {
          Electronic: 482,
          Household: 0,
          Managed: 7,
          Canceled: 0,
        },
      },
    },
    wendys: {
      Active: {
        Totals: {
          Accounts: 17954,
          Positions: 17954,
          Rollups: 0,
        },
        'Mail Positions': {
          Fullset: 590,
          NAA: 17364,
        },
        'Suppressed Positions': {
          Electronic: 0,
          Household: 0,
          Consolidated: 0,
          Canceled: 0,
        },
      },
    },
  }

  // Load new company CSV data
  let wendysData: {
    meetingInfo: any
    proposals: any[]
    positions: any[]
    voteStatusSummary: VoteStatusSummary | null
  } | null = null
  let enlivenData: {
    meetingInfo: any
    proposals: any[]
    positions: any[]
    voteStatusSummary: VoteStatusSummary | null
  } | null = null
  let paycomData: {
    meetingInfo: any
    proposals: any[]
    positions: any[]
    voteStatusSummary: VoteStatusSummary | null
  } | null = null
  let woodwardData: {
    meetingInfo: any
    proposals: any[]
    positions: any[]
    voteStatusSummary: VoteStatusSummary | null
  } | null = null

  try {
    // Load Wendy's data if available
    if (seedConfig.csvFiles.wendysMeetingInfo) {
      const meetingInfo = await CSVProcessor.processCompanyMeetingInfo(
        path.join(__dirname, seedConfig.csvFiles.wendysMeetingInfo)
      )
      const proposals = await CSVProcessor.processCompanyProposals(
        path.join(__dirname, seedConfig.csvFiles.wendysProposals)
      )
      const positions = await CSVProcessor.processCompanyPositions(
        path.join(__dirname, seedConfig.csvFiles.wendysPositions),
        '95058W100',
        65000 // Load all Wendy's positions
      )

      // Load vote status summary data
      let voteStatusSummary: VoteStatusSummary | null = null
      if (seedConfig.csvFiles.wendysDTC && seedConfig.csvFiles.wendysNonDTC) {
        voteStatusSummary = await CSVProcessor.processVoteStatusSummary(
          path.join(__dirname, seedConfig.csvFiles.wendysDTC),
          path.join(__dirname, seedConfig.csvFiles.wendysNonDTC)
        )
      }

      wendysData = { meetingInfo, proposals, positions, voteStatusSummary }
      console.error(
        `Loaded Wendy's data: ${proposals.length} proposals, ${positions.length} positions, ${voteStatusSummary ? 'with vote status summary' : 'without vote status summary'}`
      )
    }

    // Load Enliven data if available
    if (seedConfig.csvFiles.enlivenMeetingInfo) {
      const meetingInfo = await CSVProcessor.processCompanyMeetingInfo(
        path.join(__dirname, seedConfig.csvFiles.enlivenMeetingInfo)
      )
      const proposals = await CSVProcessor.processCompanyProposals(
        path.join(__dirname, seedConfig.csvFiles.enlivenProposals)
      )
      const positions = await CSVProcessor.processCompanyPositions(
        path.join(__dirname, seedConfig.csvFiles.enlivenPositions),
        '29337E102',
        5000 // Load all Enliven positions
      )

      // Load vote status summary data
      let voteStatusSummary: VoteStatusSummary | null = null
      if (seedConfig.csvFiles.enlivenDTC && seedConfig.csvFiles.enlivenNonDTC) {
        voteStatusSummary = await CSVProcessor.processVoteStatusSummary(
          path.join(__dirname, seedConfig.csvFiles.enlivenDTC),
          path.join(__dirname, seedConfig.csvFiles.enlivenNonDTC)
        )
      }

      enlivenData = { meetingInfo, proposals, positions, voteStatusSummary }
      console.error(
        `Loaded Enliven data: ${proposals.length} proposals, ${positions.length} positions, ${voteStatusSummary ? 'with vote status summary' : 'without vote status summary'}`
      )
    }

    // Load Paycom data if available
    if (seedConfig.csvFiles.paycomMeetingInfo) {
      const meetingInfo = await CSVProcessor.processCompanyMeetingInfo(
        path.join(__dirname, seedConfig.csvFiles.paycomMeetingInfo)
      )
      const proposals = await CSVProcessor.processCompanyProposals(
        path.join(__dirname, seedConfig.csvFiles.paycomProposals)
      )
      const positions = await CSVProcessor.processCompanyPositions(
        path.join(__dirname, seedConfig.csvFiles.paycomPositions),
        '70432V102',
        100000 // Load all Paycom positions
      )

      // Load vote status summary data
      let voteStatusSummary: VoteStatusSummary | null = null
      if (seedConfig.csvFiles.paycomDTC && seedConfig.csvFiles.paycomNonDTC) {
        voteStatusSummary = await CSVProcessor.processVoteStatusSummary(
          path.join(__dirname, seedConfig.csvFiles.paycomDTC),
          path.join(__dirname, seedConfig.csvFiles.paycomNonDTC)
        )
      }

      paycomData = { meetingInfo, proposals, positions, voteStatusSummary }
      console.error(
        `Loaded Paycom data: ${proposals.length} proposals, ${positions.length} positions, ${voteStatusSummary ? 'with vote status summary' : 'without vote status summary'}`
      )
    }

    // Load Woodward data if available
    if (seedConfig.csvFiles.woodwardMeetingInfo) {
      const meetingInfo = await CSVProcessor.processCompanyMeetingInfo(
        path.join(__dirname, seedConfig.csvFiles.woodwardMeetingInfo)
      )
      const proposals = seedConfig.csvFiles.woodwardProposals
        ? await CSVProcessor.processCompanyProposals(
          path.join(__dirname, seedConfig.csvFiles.woodwardProposals)
        )
        : []
      const positions = await CSVProcessor.processCompanyPositions(
        path.join(__dirname, seedConfig.csvFiles.woodwardPositions),
        '980745103',
        100000 // Load all Woodward positions
      )

      // Load vote status summary data
      let voteStatusSummary: VoteStatusSummary | null = null
      if (seedConfig.csvFiles.woodwardDTC && seedConfig.csvFiles.woodwardNonDTC) {
        voteStatusSummary = await CSVProcessor.processVoteStatusSummary(
          path.join(__dirname, seedConfig.csvFiles.woodwardDTC),
          path.join(__dirname, seedConfig.csvFiles.woodwardNonDTC)
        )
      }

      woodwardData = { meetingInfo, proposals, positions, voteStatusSummary }
      console.error(
        `Loaded Woodward data: ${proposals.length} proposals, ${positions.length} positions, ${voteStatusSummary ? 'with vote status summary' : 'without vote status summary'}`
      )
    }
  } catch (error) {
    console.error('Error loading company CSV data:', error)
    // Continue with seed generation even if CSV loading fails
  }

  // Add header comment
  sqlStatements.push('-- Issuer Portal Seed Data')
  sqlStatements.push(`-- Generated on ${new Date().toISOString()}`)
  sqlStatements.push('-- Based on OpenAPI specification')
  sqlStatements.push('')

  // Clear existing data in correct order (respecting foreign key constraints)
  sqlStatements.push('-- Clear existing data')
  // Hosting site data now handled through documents table
  sqlStatements.push('DELETE FROM signature;')
  sqlStatements.push('DELETE FROM "comment";')
  sqlStatements.push('DELETE FROM notification;')
  sqlStatements.push('DELETE FROM position_vote;')
  sqlStatements.push('DELETE FROM "position";')
  sqlStatements.push('DELETE FROM proposal;')
  sqlStatements.push('DELETE FROM "document";')
  sqlStatements.push('DELETE FROM task;')
  sqlStatements.push('DELETE FROM phase;')
  sqlStatements.push('DELETE FROM mailing;')
  sqlStatements.push('DELETE FROM meeting;')
  sqlStatements.push('DELETE FROM "user";')
  sqlStatements.push('DELETE FROM account;')
  sqlStatements.push('DELETE FROM clients;')
  sqlStatements.push('')

  // Generate clients first
  sqlStatements.push('-- Insert clients')
  const timestamp = Date.now()
  const clientIds: { [ticker: string]: string } = {}
  const createdAt = new Date().toISOString()

  seedConfig.clients.forEach((client, index) => {
    const clientId = copycat.uuid(`client-${client.ticker}-${timestamp}`)
    clientIds[client.ticker] = clientId

    sqlStatements.push(
      `INSERT INTO clients(id, ticker, company_name, short_name, industry, description, website, primary_contact, primary_contact_email, is_active, branding_id, created_at) VALUES (` +
      `${sqlValue(clientId)}, ` +
      `${sqlValue(client.ticker)}, ` +
      `${sqlValue(client.companyName)}, ` +
      `${sqlValue(client.shortName)}, ` +
      `${sqlValue(client.industry)}, ` +
      `${sqlValue(client.description)}, ` +
      `${sqlValue(client.website)}, ` +
      `${sqlValue(client.primaryContact)}, ` +
      `${sqlValue(client.primaryContactEmail)}, ` +
      `${sqlValue(client.isActive)}, ` +
      `${sqlValue(client.brandingId)}, ` +
      `${sqlValue(createdAt)});`
    )
  })

  sqlStatements.push('')

  // Generate accounts with all fields (now referencing clients)
  sqlStatements.push('-- Insert accounts')
  const relationshipManagerAccountId = copycat.uuid(`rm-account-${timestamp}`)
  const companyAccountIds: string[] = []

  // Insert relationship manager account
  sqlStatements.push(
    `INSERT INTO account(id, name, primary_contact, created_at) VALUES (` +
    `${sqlValue(relationshipManagerAccountId)}, ` +
    `${sqlValue('BetaNXT Relationship Management')}, ` +
    `${sqlValue('Sarah Johnson')}, ` +
    `${sqlValue(createdAt)});`
  )

  // Insert company accounts (now with client references)
  seedConfig.accounts.forEach((account, index) => {
    const accountId = copycat.uuid(`account-${account.clientTicker}-${timestamp}`)
    companyAccountIds.push(accountId)
    const clientId = clientIds[account.clientTicker]

    sqlStatements.push(
      `INSERT INTO account(id, client_id, name, primary_contact, created_at) VALUES (` +
      `${sqlValue(accountId)}, ` +
      `${sqlValue(clientId)}, ` +
      `${sqlValue(account.accountName)}, ` +
      `${sqlValue(account.primaryContact)}, ` +
      `${sqlValue(createdAt)});`
    )
  })

  sqlStatements.push('')

  // Generate users with all fields from OpenAPI spec
  sqlStatements.push('-- Insert users')

  // Insert dev user
  const devUserId = copycat.uuid('dev-user')
  const devPassword = copycat.password('dev-password')
  sqlStatements.push(
    `INSERT INTO "user"(id, username, first_name, last_name, email, password, type, account_id) VALUES (` +
    `${sqlValue(devUserId)}, ` +
    `${sqlValue(seedConfig.users.developer.username)}, ` +
    `${sqlValue(seedConfig.users.developer.firstName)}, ` +
    `${sqlValue(seedConfig.users.developer.lastName)}, ` +
    `${sqlValue(seedConfig.users.developer.email)}, ` +
    `${sqlValue(devPassword)}, ` +
    `${sqlValue(seedConfig.users.developer.type)}, ` +
    `${sqlValue(null)});`
  )

  // Insert test user
  const testUserId = copycat.uuid('test-user')
  const testPassword = copycat.password('test-password')
  sqlStatements.push(
    `INSERT INTO "user"(id, username, first_name, last_name, email, password, type, account_id) VALUES (` +
    `${sqlValue(testUserId)}, ` +
    `${sqlValue(seedConfig.users.test.username)}, ` +
    `${sqlValue(seedConfig.users.test.firstName)}, ` +
    `${sqlValue(seedConfig.users.test.lastName)}, ` +
    `${sqlValue(seedConfig.users.test.email)}, ` +
    `${sqlValue(testPassword)}, ` +
    `${sqlValue(seedConfig.users.test.type)}, ` +
    `${sqlValue(null)});`
  )

  // Insert relationship manager user
  const rmUserId = copycat.uuid('rm-user')
  const rmPassword = copycat.password('rm-password')
  sqlStatements.push(
    `INSERT INTO "user"(id, username, first_name, last_name, email, password, type, account_id) VALUES (` +
    `${sqlValue(rmUserId)}, ` +
    `${sqlValue(seedConfig.users.relationshipManager.username)}, ` +
    `${sqlValue(seedConfig.users.relationshipManager.firstName)}, ` +
    `${sqlValue(seedConfig.users.relationshipManager.lastName)}, ` +
    `${sqlValue(seedConfig.users.relationshipManager.email)}, ` +
    `${sqlValue(rmPassword)}, ` +
    `${sqlValue('RELATIONSHIP_MANAGER')}, ` +
    `${sqlValue(relationshipManagerAccountId)});`
  )

  // Insert issuer users
  const userIds: string[] = []
  seedConfig.users.issuerUsers.forEach((user, index) => {
    const userId = copycat.uuid(`user-${index}`)
    userIds.push(userId)
    const userPassword = copycat.password(`user-password-${index}`)

    sqlStatements.push(
      `INSERT INTO "user"(id, username, first_name, last_name, email, password, type, account_id) VALUES (` +
      `${sqlValue(userId)}, ` +
      `${sqlValue(user.username)}, ` +
      `${sqlValue(user.firstName)}, ` +
      `${sqlValue(user.lastName)}, ` +
      `${sqlValue(user.email)}, ` +
      `${sqlValue(userPassword)}, ` +
      `${sqlValue(user.type)}, ` +
      `${sqlValue(companyAccountIds[index])});`
    )
  })

  sqlStatements.push('')

  // Generate meetings with ALL fields from OpenAPI spec
  sqlStatements.push('-- Insert meetings')
  const meetingIds: string[] = []
  const meetingToClient: Record<string, (typeof seedConfig.clients)[0]> = {}
  const meetingToDate: Record<string, string> = {} // Store meeting dates by meeting ID
  const meetingParticipationTargets: Record<string, number> = {}
  const meetingShareBase: Record<string, number> = {}
  const meetingPhaseMap: Record<string, number> = {}

  // Real 2025 Annual Meeting data from CSV files
  const real2025Meetings = {
    WEN: { meetingDate: '2025-05-21', recordDate: '2025-03-24' },
    PAYC: { meetingDate: '2025-05-05', recordDate: '2025-03-12' },
    WWD: { meetingDate: '2025-01-29', recordDate: '2024-12-02' },
    ELVN: { meetingDate: '2025-06-24', recordDate: '2025-04-25' },
  }

  // 2026 Annual Meeting dates (mid-April to mid-June 2026 for realistic planning timeline)
  const real2026Meetings = {
    WEN: { meetingDate: '2026-05-20', recordDate: '2026-03-23' },
    PAYC: { meetingDate: '2026-05-04', recordDate: '2026-03-11' },
    WWD: { meetingDate: '2026-04-15', recordDate: '2026-02-16' },
    ELVN: { meetingDate: '2026-06-10', recordDate: '2026-04-13' },
  }

  // 2 meetings per year: Annual + Special for 2022-2026
  const meetingsByYear = [
    {
      year: 2026,
      meetings: [
        { type: 'Annual Meeting', useRealDates: true, phase: 1 },
        { type: 'Special Meeting', monthOffset: 10, phase: 7 },
      ],
    },
    {
      year: 2025,
      meetings: [
        { type: 'Annual Meeting', useRealDates: true, phase: 8 },
        { type: 'Special Meeting', monthOffset: -2, phase: 8 }, // Oct 2024
      ],
    },
    {
      year: 2024,
      meetings: [
        { type: 'Annual Meeting', monthOffset: -21, phase: 8 }, // Jan 2024
        { type: 'Special Meeting', monthOffset: -18, phase: 8 }, // Apr 2024
      ],
    },
    {
      year: 2023,
      meetings: [
        { type: 'Annual Meeting', monthOffset: -33, phase: 8 }, // Jan 2023
        { type: 'Special Meeting', monthOffset: -30, phase: 8 }, // Apr 2023
      ],
    },
    {
      year: 2022,
      meetings: [
        { type: 'Annual Meeting', monthOffset: -45, phase: 8 }, // Jan 2022
        { type: 'Special Meeting', monthOffset: -42, phase: 8 }, // Apr 2022
      ],
    },
  ]

  seedConfig.clients.forEach((client, clientIndex) => {
    meetingsByYear.forEach((yearConfig) => {
      yearConfig.meetings.forEach((meeting, meetingIndex) => {
        let meetingDateTime: DateTime
        let recordDateTime: DateTime

        if ('useRealDates' in meeting && meeting.useRealDates) {
          // Use real CSV-based dates for 2025 and 2026
          const realDataSource =
            yearConfig.year === 2026 ? real2026Meetings : real2025Meetings
          const realData = realDataSource[client.ticker as keyof typeof realDataSource]

          if (realData) {
            meetingDateTime = DateTime.fromISO(realData.meetingDate)
            recordDateTime = DateTime.fromISO(realData.recordDate)
          } else {
            // Fallback if no real data exists for this ticker
            meetingDateTime = DateTime.now().plus({ months: 8 })
            recordDateTime = meetingDateTime.minus({ days: 60 })
          }
        } else if ('monthOffset' in meeting) {
          meetingDateTime = DateTime.now().plus({ months: meeting.monthOffset })
          recordDateTime = meetingDateTime.minus({ days: 60 })
        } else {
          // Fallback for meetings without monthOffset
          meetingDateTime = DateTime.now()
          recordDateTime = meetingDateTime.minus({ days: 60 })
        }

        const mailingDateTime = meetingDateTime.minus({ days: 25 })
        const filingDateTime = meetingDateTime.minus({ days: 40 })
        const brokerSearchDateTime = meetingDateTime.minus({ days: 80 })
        const preFilingDateTime = meetingDateTime.minus({ days: 105 })

        const meetingDate =
          meetingDateTime.toISODate() || meetingDateTime.toFormat('yyyy-MM-dd')
        const recordDate =
          recordDateTime.toISODate() || recordDateTime.toFormat('yyyy-MM-dd')
        const mailingDate =
          mailingDateTime.toISODate() || mailingDateTime.toFormat('yyyy-MM-dd')
        const filingDate =
          filingDateTime.toISODate() || filingDateTime.toFormat('yyyy-MM-dd')
        const brokerSearchDate =
          brokerSearchDateTime.toISODate() || brokerSearchDateTime.toFormat('yyyy-MM-dd')
        const preFilingDate =
          preFilingDateTime.toISODate() || preFilingDateTime.toFormat('yyyy-MM-dd')

        const meetingTypeSlug = meeting.type.toLowerCase().replace(/\s+/g, '-')
        const meetingId = `${client.ticker.toLowerCase()}-${meetingTypeSlug}-${yearConfig.year}`
        meetingIds.push(meetingId)
        meetingToClient[meetingId] = client
        meetingToDate[meetingId] = meetingDate

        const currentPhase = 'phase' in meeting ? meeting.phase : 8
        // Mark meetings from 2024 and earlier as COMPLETE for reporting
        const isPastMeeting = yearConfig.year <= 2024
        const status = currentPhase === 8 || isPastMeeting ? 'COMPLETE' : 'ACTIVE'
        const phaseName = `Phase ${currentPhase}`
        // Only COMPLETE meetings (phase 8 or past years) should show 100% completion
        // ACTIVE meetings should show 0% completion
        const overallCompletion = currentPhase === 8 || isPastMeeting ? 100 : 0

        meetingPhaseMap[meetingId] = currentPhase

        // Find corresponding account for this client
        const account = seedConfig.accounts.find(
          (acc) => acc.clientTicker === client.ticker
        )
        if (!account) {
          throw new Error(`No account found for client ticker: ${client.ticker}`)
        }

        const totalSharesOutstanding = Number(account.totalSharesOutstanding ?? 0)
        meetingShareBase[meetingId] = totalSharesOutstanding

        let participationTarget = calculateParticipationTarget(
          client.ticker,
          yearConfig.year,
          meeting.type,
          currentPhase
        )

        if (yearConfig.year === 2025 && meeting.type === 'Annual Meeting') {
          const csvPositions: CompanyPositionData[] | null | undefined =
            client.ticker === 'WEN'
              ? wendysData?.positions
              : client.ticker === 'ELVN'
                ? enlivenData?.positions
                : client.ticker === 'PAYC'
                  ? paycomData?.positions
                  : client.ticker === 'WWD'
                    ? woodwardData?.positions
                    : null

          const voteSummary: VoteStatusSummary | null | undefined =
            client.ticker === 'WEN'
              ? wendysData?.voteStatusSummary
              : client.ticker === 'ELVN'
                ? enlivenData?.voteStatusSummary
                : client.ticker === 'PAYC'
                  ? paycomData?.voteStatusSummary
                  : client.ticker === 'WWD'
                    ? woodwardData?.voteStatusSummary
                    : null

          const summaryParticipation = computeParticipationFromVoteSummary(
            voteSummary,
            totalSharesOutstanding
          )

          if (summaryParticipation !== null) {
            participationTarget = summaryParticipation
          } else {
            const csvParticipation = computeParticipationFromPositions(
              csvPositions,
              totalSharesOutstanding
            )
            if (csvParticipation !== null) {
              participationTarget = csvParticipation
            }
          }
        }

        meetingParticipationTargets[meetingId] = participationTarget

        // Generate additional fields
        const hasEmployeeStockPlan = true // All meetings should have plan administrator data
        const hasSolicitor = true // All meetings should have solicitor data

        // Contact information pools for variety
        const transferAgents = [
          'Computershare',
          'American Stock Transfer & Trust Company',
          'Continental Stock Transfer & Trust Company',
          'Equity Stock Transfer',
          'VStock Transfer, LLC',
        ]

        const planAdministrators = [
          {
            company: 'Fidelity',
            contact: 'Mark Johnson',
            email: 'mark.johnson@fidelity.com',
          },
          {
            company: 'Vanguard',
            contact: 'Sarah Chen',
            email: 'sarah.chen@vanguard.com',
          },
          {
            company: 'Charles Schwab',
            contact: 'Michael Rodriguez',
            email: 'michael.rodriguez@schwab.com',
          },
          {
            company: 'T. Rowe Price',
            contact: 'Jennifer Davis',
            email: 'jennifer.davis@troweprice.com',
          },
          {
            company: 'Principal Financial',
            contact: 'David Thompson',
            email: 'david.thompson@principal.com',
          },
        ]

        const solicitors = [
          { company: 'D.F. King & Co., Inc.', email: 'david.king@dfking.com' },
          { company: 'Georgeson Inc.', email: 'contact@georgeson.com' },
          { company: 'Innisfree M&A Incorporated', email: 'proxy@innisfree.com' },
          { company: 'MacKenzie Partners, Inc.', email: 'proxy@mackenziepartners.com' },
          { company: 'Morrow Sodali LLC', email: 'info@morrowsodali.com' },
        ]

        // Use copycat to deterministically select contacts based on meeting info
        const transferAgentIndex = copycat.int(`${meetingId}-ta`, {
          min: 0,
          max: transferAgents.length - 1,
        })
        const planAdminIndex = copycat.int(`${meetingId}-pa`, {
          min: 0,
          max: planAdministrators.length - 1,
        })
        const solicitorIndex = copycat.int(`${meetingId}-sol`, {
          min: 0,
          max: solicitors.length - 1,
        })
        const planAdmin = planAdministrators[planAdminIndex]
        const solicitor = solicitors[solicitorIndex]
        const transferAgent = transferAgents[transferAgentIndex]

        sqlStatements.push(
          `INSERT INTO meeting(` +
          `id, title, cusip, ticker, pre_filing_date, filing_date, broker_search_date, ` +
          `record_date, mailing_date, meeting_date, ` +
          `meeting_type, meeting_year, status, current_phase, overall_completion, ` +
          `distribution_type, transfer_agent, employee_stock_plans, plan_administrator, ` +
          `plan_administrator_contact, plan_administrator_contact_email, solicitor, ` +
          `solicitor_email, inspector, ivr_dial_in_number, ` +
          `total_shares_outstanding, quorum_requirement, client_id, ` +
          `created_at, updated_at) VALUES (` +
          `${sqlValue(meetingId)}, ` +
          `${sqlValue(meeting.type)}, ` +
          `${sqlValue(account.cusip)}, ` +
          `${sqlValue(client.ticker)}, ` +
          `${sqlValue(preFilingDate)}, ` +
          `${sqlValue(filingDate)}, ` +
          `${sqlValue(brokerSearchDate)}, ` +
          `${sqlValue(recordDate)}, ` +
          `${sqlValue(mailingDate)}, ` +
          `${sqlValue(meetingDate)}, ` +
          `${sqlValue(meeting.type)}, ` +
          `${yearConfig.year}, ` +
          `${sqlValue(status)}, ` +
          `${sqlValue(phaseName)}, ` +
          `${overallCompletion}, ` +
          `${sqlValue('NAA')}, ` +
          `${sqlValue(transferAgent)}, ` +
          `${hasEmployeeStockPlan ? sqlValue('401(k)') : 'NULL'}, ` +
          `${hasEmployeeStockPlan ? sqlValue(planAdmin.company) : 'NULL'}, ` +
          `${hasEmployeeStockPlan ? sqlValue(planAdmin.contact) : 'NULL'}, ` +
          `${hasEmployeeStockPlan ? sqlValue(planAdmin.email) : 'NULL'}, ` +
          `${hasSolicitor ? sqlValue(solicitor.company) : 'NULL'}, ` +
          `${hasSolicitor ? sqlValue(solicitor.email) : 'NULL'}, ` +
          `${sqlValue('Sarah Mitchell')}, ` +
          `${sqlValue('1-800-' + String(Math.random()).substring(2, 5) + '-' + String(Math.random()).substring(2, 7))}, ` +
          `${account.totalSharesOutstanding}, ` +
          `${account.quorumRequirement}, ` +
          `${sqlValue(clientIds[client.ticker])}, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(createdAt)});`
        )
      })
    })
  })

  sqlStatements.push('')

  // Meeting-to-client mapping was created during meeting generation

  // Generate mailing records from company positions data
  if (companyPositions) {
    sqlStatements.push('-- Insert mailing records')

    // Create mailing records for each company's meetings
    Object.keys(clientIds).forEach((ticker) => {
      // Map ticker codes to company position keys
      let companyKey
      switch (ticker) {
        case 'WEN':
          companyKey = 'wendys'
          break
        case 'PAYC':
          companyKey = 'paycom'
          break
        case 'ELVN':
          companyKey = 'enliven'
          break
        case 'WWD':
          companyKey = 'woodward'
          break
        default:
          companyKey = ticker.toLowerCase()
      }
      const positionData = companyPositions[companyKey]

      if (positionData && 'Active' in positionData && positionData.Active) {
        const data = positionData.Active

        // Find all past meetings (2025 and earlier) plus 2026 special meetings for this company
        const companyMeetings = meetingIds.filter((meetingId) => {
          // Use the meetingToClient mapping that was created during meeting generation
          const meetingClient = meetingToClient[meetingId]
          const year = parseInt(meetingId.split('-').slice(-1)[0])
          const isSpecialMeeting = meetingId.includes('special-meeting')
          // Include 2025 and before, or 2026 special meetings
          return (
            meetingClient?.ticker === ticker &&
            (year <= 2025 || (year === 2026 && isSpecialMeeting))
          )
        })

        // Create mailing record for each past meeting
        companyMeetings.forEach((meetingId) => {
          const mailingId = copycat.uuid(`mailing-${meetingId}-${timestamp}`)

          const totalAccounts = data.Totals?.Accounts || 0
          const totalPositions = data.Totals?.Positions || 0
          const totalRetransmissions = data.Totals?.Retransmissions || null
          const totalRollups = data.Totals?.Rollups || null

          const fullsetMail = data['Mail Positions']?.Fullset || 0
          const naaMail = data['Mail Positions']?.NAA || 0
          const courtesyOtherMail = data['Mail Positions']?.['Courtesy/Other'] || null

          const electronicSuppressed = data['Suppressed Positions']?.Electronic || 0
          const householdSuppressed = data['Suppressed Positions']?.Household || 0
          const managedSuppressed = data['Suppressed Positions']?.Managed || null
          const consolidatedSuppressed =
            data['Suppressed Positions']?.Consolidated || null
          const canceledSuppressed = data['Suppressed Positions']?.Canceled || 0

          sqlStatements.push(
            `INSERT INTO mailing(id, meeting_id, ticker, total_accounts, total_positions, total_retransmissions, total_rollups, fullset_mail_positions, naa_mail_positions, courtesy_other_mail_positions, electronic_suppressed_positions, household_suppressed_positions, managed_suppressed_positions, consolidated_suppressed_positions, canceled_suppressed_positions, created_at, updated_at) VALUES (` +
            `${sqlValue(mailingId)}, ` +
            `${sqlValue(meetingId)}, ` +
            `${sqlValue(ticker)}, ` +
            `${sqlValue(totalAccounts)}, ` +
            `${sqlValue(totalPositions)}, ` +
            `${sqlValue(totalRetransmissions)}, ` +
            `${sqlValue(totalRollups)}, ` +
            `${sqlValue(fullsetMail)}, ` +
            `${sqlValue(naaMail)}, ` +
            `${sqlValue(courtesyOtherMail)}, ` +
            `${sqlValue(electronicSuppressed)}, ` +
            `${sqlValue(householdSuppressed)}, ` +
            `${sqlValue(managedSuppressed)}, ` +
            `${sqlValue(consolidatedSuppressed)}, ` +
            `${sqlValue(canceledSuppressed)}, ` +
            `${sqlValue(createdAt)}, ` +
            `${sqlValue(createdAt)});`
          )
        })
      }
    })

    sqlStatements.push('')
  }

  // Generate phases with all fields
  sqlStatements.push('-- Insert phases')

  const regularPhaseNames = [
    'Project Launch & Data Check',
    'Broker Search, Authorizations, and Proxy Card Notice',
    'Approaching Record Date, Proxy Card Readiness',
    'Shareholder Record File delivery expectations',
    'Pre-Mail Date',
    'Post Mail Date – Pre-Vote & Tabulation Reporting',
    'Tabulation Report & Meeting Details',
    'Registered Vote Report',
  ]

  const phaseIds: string[] = []
  meetingIds.forEach((meetingId, meetingIndex) => {
    // Find the corresponding meeting data for SEC date calculations
    const meetingData = sqlStatements.find(
      (s) => s.includes(`INSERT INTO meeting`) && s.includes(`'${meetingId}'`)
    )

    // Extract meeting and record dates from the meeting insert statement
    // Parse the meeting date and record date from the insert statement
    const year = parseInt(meetingId.split('-').slice(-1)[0])
    let currentPhase: number
    if (year >= 2026) {
      // Future meetings - only 2026+ are active
      const meetingType = meetingId.includes('annual')
        ? 'Annual Meeting'
        : 'Special Meeting'
      if (meetingType === 'Annual Meeting') {
        currentPhase = 1 // Phase 1 for Annual Meetings
      } else if (meetingType === 'Special Meeting') {
        currentPhase = 7 // Phase 7 for Special Meetings
      } else {
        currentPhase = 1 + (meetingIndex % 5)
      }
    } else {
      // Historical meetings (2025 and earlier) are all complete
      currentPhase = 8
    }

    // Calculate meeting date using the SAME logic as tasks
    let baseMeetingDate = DateTime.now()
    if (year === 2025) {
      baseMeetingDate = baseMeetingDate.plus({ months: 6 + meetingIndex })
    } else if (year === 2024) {
      // For 2024 meetings, use dates from mid-2024 (6-9 months ago)
      const localDate = DateTime.local(2024, 6, 1)
      baseMeetingDate = localDate.isValid ? localDate : DateTime.now()
      baseMeetingDate = baseMeetingDate.plus({ months: meetingIndex * 2 })
    } else {
      baseMeetingDate = baseMeetingDate.minus({
        months: 12 + (2025 - year) * 12 + meetingIndex * 3,
      })
    }

    // Add the 8 regular phases only
    const baseDate = DateTime.now()

    regularPhaseNames.forEach((phaseName, phaseIndex) => {
      const phaseId = copycat.uuid(`phase-${meetingId}-${phaseIndex}`)
      phaseIds.push(phaseId)

      const status =
        phaseIndex + 1 < currentPhase
          ? 'COMPLETE'
          : phaseIndex + 1 === currentPhase
            ? 'ACTIVE'
            : 'DRAFT'

      // Calculate dates based on phase progress - use consistent baseMeetingDate
      const startDate = baseDate.minus({ months: 8 - phaseIndex }).toISODate()
      const endDate =
        status === 'COMPLETE'
          ? baseDate.minus({ months: 7 - phaseIndex }).toISODate()
          : null
      const dueDate = baseDate.plus({ weeks: phaseIndex + 1 }).toISODate()
      const completionDate = status === 'COMPLETE' ? endDate : null

      // Use the actual meeting date from meetingToDate, not baseMeetingDate
      const actualMeetingDateString = meetingToDate[meetingId]
      const actualMeetingDate = actualMeetingDateString
        ? (() => {
          const fromISO = DateTime.fromISO(actualMeetingDateString)
          return fromISO.isValid ? fromISO : baseMeetingDate
        })()
        : baseMeetingDate

      let recordDate = actualMeetingDate.minus({ days: 60 })
      let preFilingDate = actualMeetingDate.minus({ days: 120 })
      let filingDate = actualMeetingDate.minus({ days: 40 }) // 40 days before meeting
      let brokerSearchDate = recordDate.minus({ days: 60 }) // 60 days before record
      let mailingDate = actualMeetingDate.minus({ days: 30 })
      let meetingDate = actualMeetingDate

      // Apply weekend shifting to phase key dates
      recordDate = shiftWeekendToMonday(recordDate)
      preFilingDate = shiftWeekendToMonday(preFilingDate)
      filingDate = shiftWeekendToMonday(filingDate)
      brokerSearchDate = shiftWeekendToMonday(brokerSearchDate)
      mailingDate = shiftWeekendToMonday(mailingDate)
      meetingDate = shiftWeekendToMonday(meetingDate)

      // Create phase-specific keyDates JSON object - only include dates relevant to each phase
      let keyDates: any = {}

      // Add phase-specific key dates only (no generic start/end/due dates)
      switch (phaseIndex + 1) {
        case 1: // Project Launch & Data Check
          keyDates.preFilingDate = preFilingDate
          break
        case 2: // Authorizations and Proxy Card Notice
          // This phase focuses on authorizations, no specific key dates
          break
        case 3: // Broker Search
          keyDates.brokerSearchDate = brokerSearchDate
          break
        case 4: // Record Date & Shareholder Record File delivery
          keyDates.recordDate = recordDate
          break
        case 5: // Pre-Mail Date
          keyDates.filingDate = filingDate
          break
        case 6: // Post Mail Date – Pre-Vote & Tabulation Reporting
          keyDates.mailingDate = mailingDate
          break
        case 7: // Tabulation Report & Meeting Details
          keyDates.meetingDate = meetingDate
          break
        case 8: // Registered Vote Report
          // This phase is for post-meeting reports, no specific key dates
          break
      }

      sqlStatements.push(
        `INSERT INTO phase(` +
        `id, meeting_id, name, order_index, status, key_dates, ` +
        `created_at, updated_at) VALUES (` +
        `${sqlValue(phaseId)}, ` +
        `${sqlValue(meetingId)}, ` +
        `${sqlValue(phaseName)}, ` +
        `${phaseIndex + 1}, ` +
        `${sqlValue(status)}, ` +
        `${sqlValue(JSON.stringify(keyDates))}, ` +
        `${sqlValue(createdAt)}, ` +
        `${sqlValue(createdAt)});`
      )
    })
  })

  sqlStatements.push('')

  // Generate tasks with all fields from task-data.md
  sqlStatements.push('-- Insert tasks')

  // Define all tasks by phase from task-data.md (exact match)
  const tasksByPhase: Record<
    number,
    Array<{ title: string; type: string; owner: 'issuer' | 'BetaNXT' }>
  > = {
    1: [
      {
        title: 'DTCC (SPR) Authorization Status',
        type: 'Authorization',
        owner: 'issuer',
      },
      { title: 'Plan File Request form', type: 'Document', owner: 'issuer' },
      {
        title: 'Transfer Agent Registered File Request Form',
        type: 'Document',
        owner: 'issuer',
      },
      {
        title: 'Broadridge/ICS Access',
        type: 'Authorization',
        owner: 'issuer',
      },
    ],
    2: [
      {
        title: 'Draft Proxy Statement',
        type: 'Upload',
        owner: 'issuer',
      },
      {
        title: 'Proxy Card',
        type: 'Upload',
        owner: 'issuer',
      },
      {
        title: 'Notice and Access (NAA) Form',
        type: 'Upload',
        owner: 'issuer',
      },
      // We'll remove them from here and handle carry-over in the application logic
    ],
    3: [
      { title: 'Draft Proxy Statement', type: 'File Upload', owner: 'issuer' },
      { title: 'Proxy Card', type: 'File Upload', owner: 'issuer' },
      { title: 'Notice and Access (NAA) Form', type: 'File Upload', owner: 'issuer' },
      {
        title: 'Beneficial Count Settlement',
        type: 'Settlement',
        owner: 'issuer',
      },
      { title: '10-K print-ready PDF', type: 'Document', owner: 'BetaNXT' },
      {
        title: 'DTC SPR file transmitted',
        type: 'Transmission',
        owner: 'BetaNXT',
      },
      {
        title: 'Transfer-agent file transmitted',
        type: 'Transmission',
        owner: 'BetaNXT',
      },
      {
        title: 'Shareholder quantity count confirmed',
        type: 'Confirmation',
        owner: 'issuer',
      },
    ],
    4: [
      { title: 'TA Registered File', type: 'Release', owner: 'BetaNXT' },
      {
        title: 'DTCC SPR',
        type: 'Release',
        owner: 'BetaNXT',
      },
      {
        title: 'Beneficial Count Settlement (5 Business Days Post-Record Date)',
        type: 'Release',
        owner: 'BetaNXT',
      },
      { title: 'Plan File(s)', type: 'Release', owner: 'BetaNXT' },
    ],
    5: [
      {
        title: 'Notice & Access deadline',
        type: 'Deadline',
        owner: 'BetaNXT',
      },
      { title: 'DSM introduction', type: 'Meeting', owner: 'BetaNXT' },
    ],
    6: [
      {
        title: 'Mailing proxy materials: Registered & NOBO / Intermediary mailings',
        type: 'Mailing',
        owner: 'BetaNXT',
      },
      {
        title: 'Begin daily tabulation reporting',
        type: 'Reporting',
        owner: 'BetaNXT',
      },
      { title: 'DSM Logistics Call', type: 'Meeting', owner: 'BetaNXT' },
    ],
    7: [
      {
        title: 'Official daily tabulation reporting begins',
        type: 'Reporting',
        owner: 'BetaNXT',
      },
      { title: 'DSM dry run', type: 'Meeting', owner: 'BetaNXT' },
      { title: 'DSM deliverables due', type: 'Deliverable', owner: 'issuer' },
      {
        title: 'Final tabulation Results',
        type: 'Reporting',
        owner: 'BetaNXT',
      },
    ],
    8: [
      {
        title: 'Form 8-K Item 5.07 deadline',
        type: 'Filing',
        owner: 'issuer',
      },
    ],
  }

  const taskIds: string[] = []
  let taskCounter = 0

  // Track tasks that need signed documents
  const tasksNeedingSignedDocs: Array<{
    taskId: string
    meetingId: string
    taskTitle: string
    taskStatus: string
  }> = []

  // The key fix: phases were generated in order for each meeting
  // So phaseIds[0-7] belong to meetingIds[0], phaseIds[8-15] belong to meetingIds[1], etc.
  meetingIds.forEach((meetingId, meetingIndex) => {
    const client = meetingToClient[meetingId]
    if (!client) return // Skip if client not found

    // Calculate the correct phase indices for this meeting
    const startPhaseIndex = meetingIndex * 8 // Each meeting has exactly 8 phases
    const endPhaseIndex = startPhaseIndex + 8

    // Validate we have enough phases
    if (endPhaseIndex > phaseIds.length) {
      console.warn(`Not enough phases for meeting ${meetingId} at index ${meetingIndex}`)
      return
    }

    // Get the 8 phases for this specific meeting
    const meetingPhases = phaseIds.slice(startPhaseIndex, endPhaseIndex)

    // Generate tasks for all phases - all meetings should have all tasks
    for (let phaseNum = 1; phaseNum <= 8; phaseNum++) {
      const phaseId = meetingPhases[phaseNum - 1] // phases are 0-indexed in array
      const phaseTasks = tasksByPhase[phaseNum]

      // Validate phaseId and phaseTasks exist
      if (!phaseId) {
        console.warn(`Phase ID not found for meeting ${meetingId}, phase ${phaseNum}`)
        continue
      }

      if (!phaseTasks || phaseTasks.length === 0) {
        console.warn(`No tasks defined for phase ${phaseNum}`)
        continue
      }

      phaseTasks.forEach((task, taskIndex) => {
        const taskId = copycat.uuid(`task-${meetingId}-${phaseNum}-${taskIndex}`)
        taskIds.push(taskId)
        const taskIdString = `${meetingId}-P${phaseNum}-${taskIndex + 1}`

        // Determine task status based on meeting year, phase, and task type
        // Check if meeting is complete (phase 8 or past meeting)
        const meetingPhase = meetingPhaseMap[meetingId] ?? 1
        const year = parseInt(meetingId.split('-').slice(-1)[0])
        const isPastEvent = year <= 2024 || meetingPhase === 8
        const isSpecialMeeting = meetingId.includes('special-meeting')

        let taskStatus: string

        // Future special meetings (2026+) should have tasks completed up to phase 6
        if (isSpecialMeeting && year >= 2026) {
          const taskTitle = task.title.toLowerCase()

          // Tasks in phases 1-6 should be complete, phases 7-8 should be incomplete
          if (phaseNum <= 6) {
            if (task.title.includes('DTCC') && task.type === 'Authorization') {
              taskStatus = 'AUTHORIZED'
            } else if (
              task.title.includes('Broadridge/ICS') &&
              task.type === 'Authorization'
            ) {
              taskStatus = 'PENDING_AUTHORIZATION'
            } else if (taskTitle.includes('transfer agent')) {
              taskStatus = 'SUBMITTED_AWAITING_RECORD_DATE'
            } else if (taskTitle.includes('plan file request')) {
              taskStatus = 'SUBMITTED_AWAITING_RECORD_DATE'
            } else {
              taskStatus = 'COMPLETE'
            }
          } else {
            // Phase 7-8 tasks should be incomplete
            taskStatus = 'INCOMPLETE'
          }
        } else if (!isPastEvent && year >= 2026) {
          // Future meetings (2026+) that are not complete: most tasks incomplete, but special handling for authorization tasks
          if (task.title.includes('DTCC') && task.type === 'Authorization') {
            taskStatus = 'NEEDS_AUTHORIZATION'
          } else if (
            task.title.includes('Broadridge/ICS') &&
            task.type === 'Authorization'
          ) {
            taskStatus = 'NEEDS_AUTHORIZATION'
          } else {
            taskStatus = 'INCOMPLETE'
          }
        } else {
          // Past events (2025 and earlier or phase 8): specific statuses for key tasks
          if (task.title.includes('DTCC') && task.type === 'Authorization') {
            taskStatus = 'AUTHORIZED'
          } else if (
            task.title.includes('Broadridge/ICS') &&
            task.type === 'Authorization'
          ) {
            taskStatus = 'AUTHORIZED'
          } else if (task.title === 'Plan File Request form') {
            taskStatus = 'COMPLETE'
          } else if (task.title === 'Transfer Agent Registered File Request Form') {
            taskStatus = 'COMPLETE'
          } else {
            taskStatus = 'COMPLETE'
          }
        }

        // Use the actual meeting date from the meeting record, not estimated dates
        const meetingDateString = meetingToDate[meetingId]
        if (!meetingDateString) {
          console.warn(`Meeting date not found for meeting ${meetingId}`)
          return
        }
        const actualMeetingDate = DateTime.fromISO(meetingDateString)

        // Tasks should be due before the meeting date, spaced by phase
        // Phase 1 tasks due 120 days before meeting, Phase 8 tasks due 10 days before
        // Special case: Form 8-K Item 5.07 deadline for Special Meetings should be 5 days AFTER meeting
        let taskDueDate: DateTime

        if (
          task.title === 'Form 8-K Item 5.07 deadline' &&
          meetingId.includes('special')
        ) {
          // Form 8-K deadline is 5 days AFTER Special Meeting
          taskDueDate = actualMeetingDate.plus({ days: 5 })
        } else {
          // All other tasks are BEFORE the meeting date
          const daysBeforeMeeting = Math.max(
            10,
            120 - (phaseNum - 1) * 15 - taskIndex * 2
          )
          taskDueDate = actualMeetingDate.minus({ days: daysBeforeMeeting })
        }

        // Apply weekend shifting
        taskDueDate = shiftWeekendToMonday(taskDueDate)
        const dueDate = taskDueDate.toISODate()

        // Determine owner - company name or BetaNXT
        const owner = task.owner === 'issuer' ? client.companyName : 'BetaNXT'

        // Generate task description based on type and title
        const description = generateTaskDescription(task.title, task.type, taskStatus)

        // Generate task links based on type and status
        const links = generateTaskLinks(task.title, task.type, taskStatus, client.ticker)

        sqlStatements.push(
          `INSERT INTO task(` +
          `id, task_id, phase_id, meeting_id, phase_number, title, description, ` +
          `type, status, due_date, owner, links, created_at, updated_at) VALUES (` +
          `${sqlValue(taskId)}, ` +
          `${sqlValue(taskIdString)}, ` +
          `${sqlValue(phaseId)}, ` +
          `${sqlValue(meetingId)}, ` +
          `${phaseNum}, ` +
          `${sqlValue(task.title)}, ` +
          `${sqlValue(description)}, ` +
          `${sqlValue(task.type)}, ` +
          `${sqlValue(taskStatus)}, ` +
          `${sqlValue(dueDate)}, ` +
          `${sqlValue(owner)}, ` +
          `${sqlValue(JSON.stringify(links))}, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(createdAt)});`
        )

        // Track tasks that need signed documents
        const needsSignedDoc =
          (taskStatus === 'SUBMITTED_AWAITING_RECORD_DATE' ||
            taskStatus === 'PENDING_AUTHORIZATION' ||
            taskStatus === 'AUTHORIZED') &&
          (task.title.toLowerCase().includes('transfer agent') ||
            task.title.toLowerCase().includes('plan file request') ||
            task.title.toLowerCase().includes('broadridge'))

        if (needsSignedDoc) {
          tasksNeedingSignedDocs.push({
            taskId,
            meetingId,
            taskTitle: task.title,
            taskStatus,
          })
        }

        taskCounter++
      })
    }
  })

  console.error(`Generated ${taskCounter} tasks for ${meetingIds.length} meetings`)
  sqlStatements.push(
    `-- Generated ${taskCounter} tasks for ${meetingIds.length} meetings`
  )
  sqlStatements.push('')

  // Generate signed documents for tasks with submitted/authorized statuses
  sqlStatements.push('-- Insert signed documents for submitted/authorized tasks')
  let signedDocCounter = 0

  tasksNeedingSignedDocs.forEach((task) => {
    const documentId = copycat.uuid(`signed-doc-${task.taskId}`)
    const taskTitle = task.taskTitle.toLowerCase()

    // Determine document type based on task title
    let documentType = 'signed-form'
    let title = `${task.taskTitle} (Signed)`

    if (taskTitle.includes('transfer agent')) {
      documentType = 'transfer-agent-request'
    } else if (taskTitle.includes('plan file request')) {
      documentType = 'plan-file-request'
    } else if (taskTitle.includes('broadridge')) {
      documentType = 'broadridge-form'
    }

    // Create a realistic storage path
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 11)
    const filePath = `${task.meetingId}/${documentType}/${timestamp}_${random}.pdf`

    const createdAt = new Date().toISOString()

    sqlStatements.push(
      `INSERT INTO document(` +
      `id, meeting_id, task_id, title, file_path, file_type, type, status, ` +
      `created_at, updated_at) VALUES (` +
      `${sqlValue(documentId)}, ` +
      `${sqlValue(task.meetingId)}, ` +
      `${sqlValue(task.taskId)}, ` +
      `${sqlValue(title)}, ` +
      `${sqlValue(filePath)}, ` +
      `${sqlValue('pdf')}, ` +
      `${sqlValue(documentType)}, ` +
      `${sqlValue('SIGNED')}, ` +
      `${sqlValue(createdAt)}, ` +
      `${sqlValue(createdAt)});`
    )

    signedDocCounter++
  })

  console.error(
    `Generated ${signedDocCounter} signed documents for ${tasksNeedingSignedDocs.length} tasks`
  )
  sqlStatements.push(
    `-- Generated ${signedDocCounter} signed documents for ${tasksNeedingSignedDocs.length} tasks`
  )
  sqlStatements.push('')

  // Generate notifications with all fields
  sqlStatements.push('-- Insert notifications')

  // Create array of all users for notification generation - using same seed logic as user generation
  const users = [
    {
      id: rmUserId, // Use the actual RM user ID generated earlier
      username: seedConfig.users.relationshipManager.username,
    },
    ...userIds.map((userId, index) => ({
      id: userId, // Use the actual user IDs generated earlier
      username: seedConfig.users.issuerUsers[index].username,
    })),
  ]

  const notificationTemplates = [
    {
      title: 'Your Event Has Been Created',
      message:
        'Your meeting has been successfully created and is ready for you to begin working. Click here to view your meeting dashboard and get started.',
      type: 'success',
      priority: 'high',
      link: (ticker: string) => `/${ticker}/meeting/{{meetingId}}/dashboard/Phase%201`,
      forMeetings: ['annual-meeting-2026'],
    },
    {
      title: 'Schedule Your Logistics Call',
      message:
        'Time to schedule your logistics call/dry run for your special meeting. Click here to view your dashboard and coordinate with your team.',
      type: 'info',
      priority: 'high',
      link: (ticker: string) => `/${ticker}/meeting/{{meetingId}}/dashboard/Phase%207`,
      forMeetings: ['special-meeting-2026'],
    },
    {
      title: 'Time to Setup Your DSM Meeting',
      message:
        'Your Digital Shareholder Meeting setup is ready to begin. Click here to configure your virtual meeting settings and get everything ready.',
      type: 'info',
      priority: 'high',
      link: (ticker: string) => `/${ticker}/meeting/{{meetingId}}/dashboard/Phase%207`,
    },
    {
      title: 'Comment on Document',
      message:
        'Michael Chen left a comment on your Document Hosting Site: "Please update the shareholder letter section before final approval."',
      type: 'info',
      priority: 'medium',
      link: (ticker: string) => `/${ticker}/meeting/{{meetingId}}/documents`,
    },
    {
      title: 'Document Requires Your Signature',
      message:
        'The Transfer Agent Request Form needs your signature. Please review and sign the document to proceed.',
      type: 'warning',
      priority: 'high',
      link: (ticker: string) => `/${ticker}/meeting/{{meetingId}}/documents`,
    },
    {
      title: 'DTCC Authorization Needed',
      message:
        'Please complete the DTCC (SPR) authorization to access shareholder proxy records. This is required to proceed with your meeting.',
      type: 'warning',
      priority: 'high',
      link: (ticker: string) => `/${ticker}/meeting/{{meetingId}}`,
      forMeetings: ['annual-meeting-2026'],
    },
    {
      title: 'Task Due in 2 Days',
      message:
        'You have 3 tasks due within the next 2 days. Please review your task list and complete them on time.',
      type: 'warning',
      priority: 'medium',
      link: (ticker: string) => `/${ticker}/meeting/{{meetingId}}/dashboard/Phase%201`,
    },
    {
      title: 'Document Review Complete',
      message:
        'Sarah Johnson has approved your Draft Proxy Statement. You can now proceed to the next phase.',
      type: 'success',
      priority: 'medium',
      link: (ticker: string) => `/${ticker}/meeting/{{meetingId}}/documents`,
    },
    {
      title: 'Filing Deadline Reminder',
      message:
        'Your DEF 14A filing deadline is in 5 business days. Please ensure all documents are finalized and ready for submission.',
      type: 'warning',
      priority: 'high',
      link: (ticker: string) => `/${ticker}/meeting/{{meetingId}}/dashboard/Phase%204`,
    },
  ]

  users.forEach((user, userIndex) => {
    // Generate 3-5 notifications per user
    const notificationCount = 3 + (userIndex % 3)

    for (let i = 0; i < notificationCount; i++) {
      const template = notificationTemplates[i % notificationTemplates.length]
      const notificationId = copycat.uuid(`notification-${user.id}-${i}`)
      // First notification and "Comment on Document" notifications are unread for demo
      const isRead = i > 0 && template.title !== 'Comment on Document'

      // Find a relevant meeting for this notification
      let meetingId: string | null = null
      const accountClient = seedConfig.accounts[userIndex % seedConfig.accounts.length]

      if ('forMeetings' in template && template.forMeetings) {
        // Find specific meeting type for this client
        meetingId =
          meetingIds.find(
            (id) =>
              id.includes(accountClient.clientTicker.toLowerCase()) &&
              template.forMeetings?.some((type) => id.includes(type))
          ) || null
      } else {
        // Use any 2026 meeting for this client
        meetingId =
          meetingIds.find(
            (id) =>
              id.includes(accountClient.clientTicker.toLowerCase()) && id.includes('2026')
          ) || null
      }

      // Calculate notification timing based on index
      const createdAt = DateTime.now()
        .minus({ days: i * 2 + 1 }) // Stagger notifications: 1, 3, 5, 7 days ago
        .toISO()
      const readAt =
        isRead && createdAt
          ? DateTime.fromISO(createdAt)
            .plus({ hours: 4 + i * 2 }) // Read a few hours later
            .toISO()
          : null

      // Replace {{meetingId}} placeholder in link and generate action_url
      let message = template.message
      let actionUrl: string | null = null
      if ('link' in template && template.link && meetingId) {
        const client = meetingToClient[meetingId]
        if (client) {
          actionUrl = template.link(client.ticker).replace('{{meetingId}}', meetingId)
          message = template.message // Keep message as-is, link will be in action_url field
        }
      }

      sqlStatements.push(
        `INSERT INTO notification(` +
        `id, title, message, type, priority, read, user_id, meeting_id, ` +
        `action_url, created_at, read_at) VALUES (` +
        `${sqlValue(notificationId)}, ` +
        `${sqlValue(template.title)}, ` +
        `${sqlValue(message)}, ` +
        `${sqlValue(template.type)}, ` +
        `${sqlValue(template.priority)}, ` +
        `${sqlValue(isRead)}, ` +
        `${sqlValue(user.id)}, ` +
        `${sqlValue(meetingId)}, ` +
        `${sqlValue(actionUrl)}, ` +
        `${sqlValue(createdAt)}, ` +
        `${sqlValue(readAt)});`
      )
    }
  })

  sqlStatements.push('')

  // Generate documents with all fields
  sqlStatements.push('-- Insert documents')
  const documentIds: string[] = []

  sqlStatements.push('')

  // Generate hosting site documents (using documents table with type='HOSTING_SITE')
  sqlStatements.push('-- Insert hosting site documents')
  const hostingSiteDocIds: string[] = []

  meetingIds.forEach((meetingId, index) => {
    const client = meetingToClient[meetingId]
    if (!client) return

    // Extract year from meetingId to determine status
    const year = parseInt(meetingId.split('-').slice(-1)[0])
    const isActive = year === 2025
    const isSpecialMeeting = meetingId.includes('special')

    // Determine hosting site status based on meeting year and phase
    let status: string
    let approvedBy: string | null = null
    let approvedAt: string | null = null

    if (year < 2025) {
      // Historical meetings - all approved
      status = 'Approved'
      approvedBy = 'Sarah Johnson'
      approvedAt = DateTime.now()
        .minus({ months: (2025 - year) * 12 })
        .toISO()
    } else if (isSpecialMeeting) {
      // 2025 Special meetings in Phase 7 - mostly approved
      status = 'Approved'
      approvedBy = 'Michael Chen'
      approvedAt = DateTime.now().minus({ days: 7 }).toISO()
    } else {
      // 2025 Annual meetings in Phase 1 - various statuses
      const statuses = ['Incomplete', 'Pending Review', 'Revision Requested']
      status = statuses[index % statuses.length]
    }

    const hostingSiteDocId = copycat.uuid(`hosting-site-doc-${meetingId}`)
    hostingSiteDocIds.push(hostingSiteDocId)
    documentIds.push(hostingSiteDocId) // Add to documentIds array for later reference

    // Generate site URL based on client branding
    const derivedYear = year.toString()
    const siteUrl = client.brandingId
      ? `https://www.proxydocs.com/branding/${client.brandingId}/${derivedYear}/issuer/`
      : ''

    // Insert as a document with type='HOSTING_SITE'
    sqlStatements.push(
      `INSERT INTO document(` +
      `id, meeting_id, title, description, file_path, file_type, type, status, ` +
      `completed_date, created_at, updated_at) VALUES (` +
      `${sqlValue(hostingSiteDocId)}, ` +
      `${sqlValue(meetingId)}, ` +
      `${sqlValue('Document Hosting Site')}, ` +
      `${sqlValue('Shareholder document hosting site status')}, ` +
      `${sqlValue(siteUrl)}, ` +
      `${sqlValue('website')}, ` +
      `${sqlValue('HOSTING_SITE')}, ` +
      `${sqlValue(status)}, ` +
      `${sqlValue(status === 'Approved' ? approvedAt : null)}, ` +
      `${sqlValue(createdAt)}, ` +
      `${sqlValue(createdAt)});`
    )

    // Comments removed to avoid SQL syntax issues
  })

  // Comment processing removed to avoid SQL syntax issues
  sqlStatements.push('')

  // Generate proposals with all fields
  sqlStatements.push('-- Insert proposals')
  const proposalIds: string[] = []

  meetingIds.forEach((meetingId, meetingIndex) => {
    const client = meetingToClient[meetingId]
    const clientTicker = client?.ticker
    const isWendys = clientTicker === 'WEN'
    const isEnliven = clientTicker === 'ELVN'
    const isPaycom = clientTicker === 'PAYC'
    const isWoodward = clientTicker === 'WWD'
    const meetingDateISO = meetingToDate[meetingId]

    // Extract meeting type from meetingId (format: ticker-meeting-type-year)
    const meetingType = meetingId.includes('annual')
      ? 'Annual Meeting'
      : meetingId.includes('special')
        ? 'Special Meeting'
        : meetingId.includes('consent')
          ? 'Consent'
          : meetingId.includes('extraordinary')
            ? 'Extraordinary General Meeting'
            : meetingId.includes('annual-general')
              ? 'Annual General Meeting'
              : 'Other'

    // Skip proposal generation for 2026 annual meetings - they haven't been created yet
    const meetingYear = parseInt(meetingId.split('-').slice(-1)[0]) || 2025
    if (meetingYear === 2026 && meetingType === 'Annual Meeting') {
      return
    }

    // Use CSV data for 2025 annual meetings, synthetic for others
    const is2025Annual =
      meetingId.includes('2025') && meetingId.includes('annual-meeting')
    const hasCsvProposals =
      is2025Annual &&
      ((isWendys && wendysData?.proposals) ||
        (isEnliven && enlivenData?.proposals) ||
        (isPaycom && paycomData?.proposals) ||
        (isWoodward && woodwardData?.proposals))
    let proposals: any[] = []

    const participationTarget = meetingParticipationTargets[meetingId]
    const sharesBase = meetingShareBase[meetingId]

    if (isWendys && is2025Annual && wendysData?.proposals) {
      // Use Wendy's 2025 CSV proposals (with real vote data)
      proposals = wendysData.proposals
    } else if (isWendys && wendysData?.proposals) {
      // For non-2025 Wendy's meetings, use the same directors from 2025 CSV but with synthetic votes
      // Clear vote data so generateProposalResults will be used instead of buildResultsFromCsvProposal
      const directorProposals = wendysData.proposals
        .filter((p: any) => p.type === 'Director Election' && p.subtype === 'Individual')
        .map((p: any) => ({
          ...p,
          votesFor: 0,
          votesAgainst: 0,
          votesAbstain: 0,
          votesTotal: 0,
        }))
      const nonDirectorProposals = wendysData.proposals
        .filter((p: any) => p.type !== 'Director Election' || p.subtype !== 'Individual')
        .map((p: any) => ({
          ...p,
          votesFor: 0,
          votesAgainst: 0,
          votesAbstain: 0,
          votesTotal: 0,
        }))
      proposals = [...directorProposals, ...nonDirectorProposals]
    } else if (isEnliven && is2025Annual && enlivenData?.proposals) {
      // Use Enliven 2025 CSV proposals (with real vote data)
      proposals = enlivenData.proposals
    } else if (isEnliven && enlivenData?.proposals) {
      // For non-2025 Enliven meetings, use the same directors from 2025 CSV but with synthetic votes
      const directorProposals = enlivenData.proposals.filter(
        (p: any) => p.type === 'Director Election' && p.subtype === 'Individual'
      )
      const nonDirectorProposals = enlivenData.proposals.filter(
        (p: any) => p.type !== 'Director Election' || p.subtype !== 'Individual'
      )
      proposals = [...directorProposals, ...nonDirectorProposals]
    } else if (isPaycom && is2025Annual && paycomData?.proposals) {
      // Use Paycom 2025 CSV proposals (with real vote data)
      proposals = paycomData.proposals
    } else if (isPaycom && paycomData?.proposals) {
      // For non-2025 Paycom meetings, use the same directors from 2025 CSV but with synthetic votes
      const directorProposals = paycomData.proposals.filter(
        (p: any) => p.type === 'Director Election' && p.subtype === 'Individual'
      )
      const nonDirectorProposals = paycomData.proposals.filter(
        (p: any) => p.type !== 'Director Election' || p.subtype !== 'Individual'
      )
      proposals = [...directorProposals, ...nonDirectorProposals]
    } else if (isWoodward && is2025Annual && woodwardData?.proposals) {
      // Use Woodward 2025 CSV proposals (with real vote data)
      proposals = woodwardData.proposals
    } else if (isWoodward && woodwardData?.proposals) {
      // For non-2025 Woodward meetings, use the same directors from 2025 CSV but with synthetic votes
      const directorProposals = woodwardData.proposals.filter(
        (p: any) => p.type === 'Director Election' && p.subtype === 'Individual'
      )
      const nonDirectorProposals = woodwardData.proposals.filter(
        (p: any) => p.type !== 'Director Election' || p.subtype !== 'Individual'
      )
      proposals = [...directorProposals, ...nonDirectorProposals]
    } else {
      // Use default proposals for non-Wendy's meetings
      proposals = [
        {
          number: 1,
          title: 'Election of Directors',
          type: 'Director Election',
          subtype: null,
          recommendation: 'FOR',
        },
        {
          number: 2,
          title: 'Ratification of Independent Registered Public Accounting Firm',
          type: 'Auditor Ratification',
          subtype: null,
          recommendation: 'FOR',
        },
        {
          number: 3,
          title: 'Advisory Vote on Executive Compensation',
          type: 'Say on Pay',
          subtype: null,
          recommendation: 'FOR',
        },
        {
          number: 4,
          title: 'Advisory Vote on Frequency of Executive Compensation Vote',
          type: 'Say on Pay Frequency',
          subtype: null,
          recommendation: '1 YEAR',
        },
      ]
    }

    // Add some director elections for annual meetings
    // Use consistent directors for each company based on ticker (not meetingId)
    const meetingClient = meetingToClient[meetingId]
    const baseSeed = meetingClient?.ticker || meetingId
    // meetingYear already declared above, reuse it

    const directors = [
      {
        name: copycat.fullName(baseSeed + 'dir1'),
        termYears: 1,
        class: 'I',
        expYear: meetingYear + 1,
      },
      {
        name: copycat.fullName(baseSeed + 'dir2'),
        termYears: 2,
        class: 'II',
        expYear: meetingYear + 2,
      },
      {
        name: copycat.fullName(baseSeed + 'dir3'),
        termYears: 3,
        class: 'III',
        expYear: meetingYear + 3,
      },
    ]

    proposals.forEach((proposal, propIndex) => {
      // For Wendy's, use the actual proposal data from CSV
      if (
        isWendys &&
        proposal.type === 'Director Election' &&
        proposal.subtype === 'Individual'
      ) {
        // For director elections from CSV, extract director name if possible
        const directorMatch = proposal.title.match(/([A-Za-z\s.]+)$/)
        const directorName = directorMatch ? directorMatch[1].trim() : proposal.title

        // Clean up proposal title by removing the proposal number prefix (e.g., "1.01 ")
        const cleanTitle = proposal.title.replace(/^\d+\.\d+\s+/, '')

        const proposalId = copycat.uuid(
          `proposal-${meetingId}-${parseFloat(proposal.number)}`
        )
        proposalIds.push(proposalId)

        // Extract year from meetingId for results generation
        const meetingYear = meetingId.split('-').slice(-1)[0]
        const meetingPhase = meetingPhaseMap[meetingId] ?? 1
        const isPhase7Special2026 =
          meetingPhase === 7 &&
          meetingType === 'Special Meeting' &&
          parseInt(meetingYear) >= 2026

        // Check if CSV has actual vote data
        const hasVoteData =
          (proposal.votesFor || 0) > 0 ||
          (proposal.votesAgainst || 0) > 0 ||
          (proposal.votesAbstain || 0) > 0

        const results =
          isPhase7Special2026 || !hasVoteData
            ? generateProposalResults(
              proposal.type,
              meetingYear,
              parseFloat(proposal.number),
              cleanTitle,
              isWendys,
              meetingType,
              participationTarget,
              sharesBase,
              meetingPhase
            )
            : buildResultsFromCsvProposal(proposal, sharesBase, meetingDateISO)

        // Only update participation target if we don't already have one for historical meetings
        if (
          results.participationFraction !== undefined &&
          meetingParticipationTargets[meetingId] === undefined &&
          !meetingId.includes('2024') &&
          !meetingId.includes('2023') &&
          !meetingId.includes('2022')
        ) {
          meetingParticipationTargets[meetingId] = results.participationFraction
        }

        sqlStatements.push(
          `INSERT INTO proposal(` +
          `id, meeting_id, proposal_number, proposal_title, proposal_type, ` +
          `proposal_subtype, director_name, director_term_years, director_class, ` +
          `term_expiration_year, frequency_options, recommendation, ` +
          `final_result, total_votes_for, total_votes_against, total_votes_abstain, ` +
          `total_shares_eligible, for_percentage, against_percentage, abstain_percentage, ` +
          `participation_rate, voting_completed, voting_completed_at, ` +
          `created_at, updated_at) VALUES (` +
          `${sqlValue(proposalId)}, ` +
          `${sqlValue(meetingId)}, ` +
          `${parseFloat(proposal.number)}, ` +
          `${sqlValue(cleanTitle)}, ` +
          `${sqlValue(proposal.type)}, ` +
          `${sqlValue(proposal.subtype)}, ` +
          `${sqlValue(directorName)}, ` +
          `1, ` + // Default term years
          `${sqlValue('I')}, ` + // Default class
          `2026, ` + // Default expiration
          `NULL, ` +
          `${sqlValue(proposal.recommendation)}, ` +
          `${results.finalResult}, ` +
          `${results.totalVotesFor}, ` +
          `${results.totalVotesAgainst}, ` +
          `${results.totalVotesAbstain}, ` +
          `${results.totalSharesEligible}, ` +
          `${results.forPercentage}, ` +
          `${results.againstPercentage}, ` +
          `${results.abstainPercentage}, ` +
          `${results.participationRate}, ` +
          `${results.votingCompleted}, ` +
          `${results.votingCompletedAt}, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(createdAt)});`
        )
      } else if (isWendys) {
        // For non-director Wendy's proposals
        const proposalId = copycat.uuid(
          `proposal-${meetingId}-${parseFloat(proposal.number)}`
        )
        proposalIds.push(proposalId)

        // Extract year from meetingId for results generation
        const meetingYear = meetingId.split('-').slice(-1)[0]
        const meetingPhase = meetingPhaseMap[meetingId] ?? 1
        const isPhase7Special2026 =
          meetingPhase === 7 &&
          meetingType === 'Special Meeting' &&
          parseInt(meetingYear) >= 2026

        // Check if CSV has actual vote data
        const hasVoteData =
          (proposal.votesFor || 0) > 0 ||
          (proposal.votesAgainst || 0) > 0 ||
          (proposal.votesAbstain || 0) > 0

        const results =
          isPhase7Special2026 || !hasVoteData
            ? generateProposalResults(
              proposal.type,
              meetingYear,
              parseFloat(proposal.number),
              proposal.title,
              isWendys,
              meetingType,
              participationTarget,
              sharesBase,
              meetingPhase
            )
            : buildResultsFromCsvProposal(proposal, sharesBase, meetingDateISO)

        // Only update participation target if we don't already have one for historical meetings
        if (
          results.participationFraction !== undefined &&
          meetingParticipationTargets[meetingId] === undefined &&
          !meetingId.includes('2024') &&
          !meetingId.includes('2023') &&
          !meetingId.includes('2022')
        ) {
          meetingParticipationTargets[meetingId] = results.participationFraction
        }

        sqlStatements.push(
          `INSERT INTO proposal(` +
          `id, meeting_id, proposal_number, proposal_title, proposal_type, ` +
          `proposal_subtype, director_name, director_term_years, director_class, ` +
          `term_expiration_year, frequency_options, recommendation, ` +
          `final_result, total_votes_for, total_votes_against, total_votes_abstain, ` +
          `total_shares_eligible, for_percentage, against_percentage, abstain_percentage, ` +
          `participation_rate, voting_completed, voting_completed_at, ` +
          `created_at, updated_at) VALUES (` +
          `${sqlValue(proposalId)}, ` +
          `${sqlValue(meetingId)}, ` +
          `${parseFloat(proposal.number)}, ` +
          `${sqlValue(proposal.title)}, ` +
          `${sqlValue(proposal.type)}, ` +
          `${sqlValue(proposal.subtype)}, ` +
          `NULL, ` +
          `NULL, ` +
          `NULL, ` +
          `NULL, ` +
          `NULL, ` +
          `${sqlValue(proposal.recommendation)}, ` +
          `${results.finalResult}, ` +
          `${results.totalVotesFor}, ` +
          `${results.totalVotesAgainst}, ` +
          `${results.totalVotesAbstain}, ` +
          `${results.totalSharesEligible}, ` +
          `${results.forPercentage}, ` +
          `${results.againstPercentage}, ` +
          `${results.abstainPercentage}, ` +
          `${results.participationRate}, ` +
          `${results.votingCompleted}, ` +
          `${results.votingCompletedAt}, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(createdAt)});`
        )
      } else if (
        !isWendys &&
        !hasCsvProposals &&
        propIndex === 0 &&
        proposal.type === 'Director Election' &&
        meetingType === 'Annual Meeting'
      ) {
        // For non-Wendy's annual meetings, create individual director proposals for all years
        const meetingYear = meetingId.split('-').slice(-1)[0]

        directors.forEach((director, dirIndex) => {
          const proposalId = copycat.uuid(`proposal-${meetingId}-1${dirIndex}`)
          proposalIds.push(proposalId)

          // Generate results for each director
          const meetingPhase = meetingPhaseMap[meetingId] ?? 1
          const results = generateProposalResults(
            proposal.type,
            meetingYear,
            1 + dirIndex,
            director.name,
            isWendys,
            meetingType,
            participationTarget,
            sharesBase,
            meetingPhase
          )

          sqlStatements.push(
            `INSERT INTO proposal(` +
            `id, meeting_id, proposal_number, proposal_title, proposal_type, ` +
            `proposal_subtype, director_name, director_term_years, director_class, ` +
            `term_expiration_year, frequency_options, recommendation, ` +
            `final_result, total_votes_for, total_votes_against, total_votes_abstain, ` +
            `total_shares_eligible, for_percentage, against_percentage, abstain_percentage, ` +
            `participation_rate, voting_completed, voting_completed_at, ` +
            `created_at, updated_at) VALUES (` +
            `${sqlValue(proposalId)}, ` +
            `${sqlValue(meetingId)}, ` +
            `${1 + dirIndex}, ` +
            `${sqlValue('Election of Director - ' + director.name)}, ` +
            `${sqlValue(proposal.type)}, ` +
            `${sqlValue('Individual')}, ` +
            `${sqlValue(director.name)}, ` +
            `${director.termYears}, ` +
            `${sqlValue(director.class)}, ` +
            `${director.expYear}, ` +
            `NULL, ` +
            `${sqlValue(proposal.recommendation)}, ` +
            `${results.finalResult}, ` +
            `${results.totalVotesFor}, ` +
            `${results.totalVotesAgainst}, ` +
            `${results.totalVotesAbstain}, ` +
            `${results.totalSharesEligible}, ` +
            `${results.forPercentage}, ` +
            `${results.againstPercentage}, ` +
            `${results.abstainPercentage}, ` +
            `${results.participationRate}, ` +
            `${results.votingCompleted}, ` +
            `${results.votingCompletedAt}, ` +
            `${sqlValue(createdAt)}, ` +
            `${sqlValue(createdAt)});`
          )
        })
      } else if (!isWendys && hasCsvProposals) {
        const proposalId = copycat.uuid(`proposal-${meetingId}-${propIndex + 1}`)
        proposalIds.push(proposalId)

        const results = buildResultsFromCsvProposal(proposal, sharesBase, meetingDateISO)

        // Only update participation target if we don't already have one for historical meetings
        if (
          results.participationFraction !== undefined &&
          meetingParticipationTargets[meetingId] === undefined &&
          !meetingId.includes('2024') &&
          !meetingId.includes('2023') &&
          !meetingId.includes('2022')
        ) {
          meetingParticipationTargets[meetingId] = results.participationFraction
        }

        sqlStatements.push(
          `INSERT INTO proposal(` +
          `id, meeting_id, proposal_number, proposal_title, proposal_type, ` +
          `proposal_subtype, director_name, director_term_years, director_class, ` +
          `term_expiration_year, frequency_options, recommendation, ` +
          `final_result, total_votes_for, total_votes_against, total_votes_abstain, ` +
          `total_shares_eligible, for_percentage, against_percentage, abstain_percentage, ` +
          `participation_rate, voting_completed, voting_completed_at, ` +
          `created_at, updated_at) VALUES (` +
          `${sqlValue(proposalId)}, ` +
          `${sqlValue(meetingId)}, ` +
          `${sqlValue(proposal.number)}, ` +
          `${sqlValue(proposal.title)}, ` +
          `${sqlValue(proposal.type)}, ` +
          `${sqlValue(proposal.subtype)}, ` +
          `NULL, ` +
          `NULL, ` +
          `NULL, ` +
          `NULL, ` +
          `NULL, ` +
          `${sqlValue(proposal.recommendation)}, ` +
          `${results.finalResult}, ` +
          `${results.totalVotesFor}, ` +
          `${results.totalVotesAgainst}, ` +
          `${results.totalVotesAbstain}, ` +
          `${results.totalSharesEligible}, ` +
          `${results.forPercentage}, ` +
          `${results.againstPercentage}, ` +
          `${results.abstainPercentage}, ` +
          `${results.participationRate}, ` +
          `${results.votingCompleted}, ` +
          `${results.votingCompletedAt}, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(createdAt)});`
        )
      } else if (!isWendys) {
        // For non-Wendy's non-director proposals
        const proposalId = copycat.uuid(
          `proposal-${meetingId}-${propIndex + directors.length}`
        )
        proposalIds.push(proposalId)

        const frequencyOptions =
          proposal.type === 'Say on Pay Frequency'
            ? { '1_year': true, '2_years': false, '3_years': false }
            : null

        // Extract year from meetingId for results generation
        const meetingYear = meetingId.split('-').slice(-1)[0]
        const meetingPhase = meetingPhaseMap[meetingId] ?? 1
        const results = generateProposalResults(
          proposal.type,
          meetingYear,
          propIndex + directors.length,
          proposal.title,
          isWendys,
          meetingType,
          participationTarget,
          sharesBase,
          meetingPhase
        )

        sqlStatements.push(
          `INSERT INTO proposal(` +
          `id, meeting_id, proposal_number, proposal_title, proposal_type, ` +
          `proposal_subtype, director_name, director_term_years, director_class, ` +
          `term_expiration_year, frequency_options, recommendation, ` +
          `final_result, total_votes_for, total_votes_against, total_votes_abstain, ` +
          `total_shares_eligible, for_percentage, against_percentage, abstain_percentage, ` +
          `participation_rate, voting_completed, voting_completed_at, ` +
          `created_at, updated_at) VALUES (` +
          `${sqlValue(proposalId)}, ` +
          `${sqlValue(meetingId)}, ` +
          `${propIndex + directors.length}, ` +
          `${sqlValue(proposal.title)}, ` +
          `${sqlValue(proposal.type)}, ` +
          `NULL, ` +
          `NULL, ` +
          `NULL, ` +
          `NULL, ` +
          `NULL, ` +
          `${frequencyOptions ? sqlValue(JSON.stringify(frequencyOptions)) : 'NULL'
          }, ` +
          `${sqlValue(proposal.recommendation)}, ` +
          `${results.finalResult}, ` +
          `${results.totalVotesFor}, ` +
          `${results.totalVotesAgainst}, ` +
          `${results.totalVotesAbstain}, ` +
          `${results.totalSharesEligible}, ` +
          `${results.forPercentage}, ` +
          `${results.againstPercentage}, ` +
          `${results.abstainPercentage}, ` +
          `${results.participationRate}, ` +
          `${results.votingCompleted}, ` +
          `${results.votingCompletedAt}, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(createdAt)});`
        )
      }
    })
  })

  sqlStatements.push('')

  // Helper function to normalize account types for tabulation report compatibility
  const normalizeAccountType = (rawAccountType: string): string => {
    const type = rawAccountType.toUpperCase()
    if (
      type.includes('CEDE') ||
      type.includes('CDS') ||
      type.includes('CTC') ||
      type.includes('DTC')
    ) {
      return 'DTC/CDS'
    }
    // Everything else is considered Non-DTC (registered accounts, etc.)
    return 'Non-DTC'
  }

  // Generate positions with all fields matching CSV structure
  sqlStatements.push('-- Insert positions')
  const accountTypes = ['CEDE & CO / CTC & CO', 'Registered Account']
  const sources = ['WEB', 'PRINT', 'IVR']
  const positionIds: string[] = []
  const positionToMeetingMap: Record<string, string> = {}
  const positionVoteMeta: Record<
    string,
    { meetingId: string; shares: number; sharesVoted: number }
  > = {}

  meetingIds.forEach((meetingId, meetingIndex) => {
    const client = meetingToClient[meetingId]
    if (!client) {
      console.warn(`No client found for meeting: ${meetingId}`)
      return // Skip if client not found
    }

    const isWendys = client.ticker === 'WEN'
    const isEnliven = client.ticker === 'ELVN'
    const isPaycom = client.ticker === 'PAYC'
    const isWoodward = client.ticker === 'WWD'

    // Find corresponding account for this client
    const account = seedConfig.accounts.find((acc) => acc.clientTicker === client.ticker)
    if (!account) {
      console.warn(
        `No account found for client ticker: ${client.ticker} (meeting: ${meetingId})`
      )
      return // Skip if account not found
    }

    // Extract year from meetingId (format: meeting-type-YEAR)
    const meetingYear = meetingId.split('-').slice(-1)[0]
    const isSpecialMeeting = meetingId.includes('special')
    const is2025Annual = meetingYear === '2025' && meetingId.includes('annual-meeting')
    // Use the meetingPhaseMap that was populated when meetings were created
    const meetingPhase =
      meetingPhaseMap[meetingId] ??
      (parseInt(meetingYear) < 2026 ? 8 : isSpecialMeeting ? 7 : 1)

    // Use CSV data for 2025 annual meetings if available
    const useCSVPositions =
      is2025Annual &&
      ((isWendys && wendysData?.positions) ||
        (isEnliven && enlivenData?.positions) ||
        (isPaycom && paycomData?.positions) ||
        (isWoodward && woodwardData?.positions))

    if (useCSVPositions) {
      // Get the appropriate CSV position data
      const csvPositions = isWendys
        ? wendysData!.positions
        : isEnliven
          ? enlivenData!.positions
          : isPaycom
            ? paycomData!.positions
            : woodwardData!.positions

      csvPositions.forEach((position: any, index: number) => {
        const positionId = copycat.uuid(`position-${meetingId}-${index}`)
        positionIds.push(positionId)
        positionToMeetingMap[positionId] = meetingId

        // For Phase 1-5, override vote status to Unvoted
        let voteStatus = position.voteStatus || 'Unvoted'
        let sharesVoted = position.sharesVoted || 0
        let source = position.source
        let dateVoted = position.dateVoted

        if (meetingPhase < 6) {
          voteStatus = 'Unvoted'
          sharesVoted = 0
          source = null
          dateVoted = null
        }

        sqlStatements.push(
          `INSERT INTO "position"(` +
          `id, meeting_id, cusip, account_type, set_key, name, account_number, ` +
          `vote_status, control_number, shares, shares_voted, source, date_voted, ` +
          `created_at, updated_at) VALUES (` +
          `${sqlValue(positionId)}, ` +
          `${sqlValue(meetingId)}, ` +
          `${sqlValue(position.cusip)}, ` +
          `${sqlValue(normalizeAccountType(position.accountType))}, ` +
          `${sqlValue(position.setKey)}, ` +
          `${sqlValue(position.name)}, ` +
          `${position.accountNumber ? sqlValue(position.accountNumber) : 'NULL'}, ` +
          `${sqlValue(voteStatus)}, ` +
          `${sqlValue(position.controlNumber || 'CTRL' + String(index + 1).padStart(6, '0'))}, ` +
          `${sqlValue(position.shares)}, ` +
          `${sqlValue(sharesVoted)}, ` +
          `${sqlValue(source)}, ` +
          `${sqlValue(dateVoted)}, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(createdAt)});`
        )
      })

      // Generate Non-DTC positions from vote status summary if available
      const voteStatusSummary = isWendys
        ? wendysData?.voteStatusSummary
        : isEnliven
          ? enlivenData?.voteStatusSummary
          : isPaycom
            ? paycomData?.voteStatusSummary
            : isWoodward
              ? woodwardData?.voteStatusSummary
              : null

      if (voteStatusSummary?.nonDtcSummary && meetingPhase >= 6) {
        const summary = voteStatusSummary.nonDtcSummary
        const totalVotedShares = summary.votedSubtotalShares || 0

        if (totalVotedShares > 0) {
          // Create positions for each voting method
          const votingMethods = [
            {
              source: 'PRINT',
              shares: summary.printShares,
              shareholders: summary.printShareholders,
            },
            {
              source: 'IVR',
              shares: summary.ivrShares,
              shareholders: summary.ivrShareholders,
            },
            {
              source: 'WEB',
              shares: summary.webShares,
              shareholders: summary.webShareholders,
            },
          ]

          votingMethods.forEach((method, methodIndex) => {
            if (method.shares > 0 && method.shareholders > 0) {
              const sharesPerShareholder = method.shares / method.shareholders
              const shareholdersToCreate = Math.min(method.shareholders, 100) // Limit to avoid too many positions

              for (let i = 0; i < shareholdersToCreate; i++) {
                const positionId = copycat.uuid(
                  `position-nondtc-${meetingId}-${method.source}-${i}`
                )
                positionIds.push(positionId)
                positionToMeetingMap[positionId] = meetingId

                const shares =
                  i === shareholdersToCreate - 1
                    ? method.shares - sharesPerShareholder * (shareholdersToCreate - 1) // Last position gets remainder
                    : sharesPerShareholder

                const holderName = copycat
                  .fullName(`nondtc-${meetingId}-${method.source}-${i}`)
                  .toUpperCase()
                const controlNumber = `N${method.source}${String(i + 1).padStart(5, '0')}`

                const meetingDateString = meetingToDate[meetingId]
                const meetingDate = meetingDateString
                  ? DateTime.fromISO(meetingDateString)
                  : DateTime.now()

                const daysBefore =
                  method.source === 'WEB'
                    ? 5 + (i % 20)
                    : method.source === 'PRINT'
                      ? 15 + (i % 10)
                      : 10 + (i % 12)
                const dateVoted = meetingDate
                  .minus({ days: daysBefore })
                  .toFormat('MM/dd/yyyy hh:mma')
                  .toUpperCase()

                sqlStatements.push(
                  `INSERT INTO "position"(` +
                  `id, meeting_id, cusip, account_type, set_key, name, account_number, ` +
                  `vote_status, control_number, shares, shares_voted, source, date_voted, ` +
                  `created_at, updated_at) VALUES (` +
                  `${sqlValue(positionId)}, ` +
                  `${sqlValue(meetingId)}, ` +
                  `${sqlValue(account.cusip)}, ` +
                  `${sqlValue('Non-DTC')}, ` +
                  `${sqlValue(client.ticker + 'J' + meetingYear)}, ` +
                  `${sqlValue(holderName)}, ` +
                  `NULL, ` +
                  `${sqlValue('Voted')}, ` +
                  `${sqlValue(controlNumber)}, ` +
                  `${shares.toFixed(6)}, ` +
                  `${shares.toFixed(6)}, ` +
                  `${sqlValue(method.source)}, ` +
                  `${sqlValue(dateVoted)}, ` +
                  `${sqlValue(createdAt)}, ` +
                  `${sqlValue(createdAt)});`
                )

                positionVoteMeta[positionId] = {
                  meetingId,
                  shares,
                  sharesVoted: shares,
                }
              }
            }
          })
        }
      }
    } else {
      const totalSharesValue = Number(account.totalSharesOutstanding ?? 0)
      const totalSharesOutstanding =
        Number.isFinite(totalSharesValue) && totalSharesValue > 0 ? totalSharesValue : 0
      const safeTotalShares = totalSharesOutstanding > 0 ? totalSharesOutstanding : 1
      const participationTarget = meetingParticipationTargets[meetingId] ?? 0

      const targetVotingSharesRaw =
        meetingPhase >= 6
          ? clamp(Math.round(participationTarget * safeTotalShares), 0, safeTotalShares)
          : 0

      const meetingDateString = meetingToDate[meetingId]
      const meetingDate = meetingDateString
        ? DateTime.fromISO(meetingDateString)
        : DateTime.now()

      const cedePositionId = copycat.uuid(`position-${meetingId}-cede`)
      positionIds.push(cedePositionId)
      positionToMeetingMap[cedePositionId] = meetingId

      const cedeShares = Math.floor(safeTotalShares * 0.75)
      const cedeVoteTarget =
        meetingPhase >= 6
          ? Math.min(cedeShares, Math.round(targetVotingSharesRaw * 0.82))
          : 0
      const cedeVoteStatus = cedeVoteTarget > 0 ? 'Voted' : 'Unvoted'
      const cedeSource = cedeVoteTarget > 0 ? 'WEB' : null

      const cedeTimingSeed = copycat.int(`vote-timing-${meetingId}-cede`, {
        min: 0,
        max: 999,
      })
      const cedeDaysBefore =
        cedeTimingSeed < 600
          ? 20 + (cedeTimingSeed % 11)
          : cedeTimingSeed < 900
            ? 7 + (cedeTimingSeed % 14)
            : cedeTimingSeed % 7

      const cedeDateVoted =
        cedeVoteTarget > 0
          ? meetingDate
            .minus({ days: cedeDaysBefore })
            .toFormat('MM/dd/yyyy hh:mma')
            .toUpperCase()
          : null

      sqlStatements.push(
        `INSERT INTO "position"(` +
        `id, meeting_id, cusip, account_type, set_key, name, account_number, ` +
        `vote_status, control_number, shares, shares_voted, source, date_voted, ` +
        `created_at, updated_at) VALUES (` +
        `${sqlValue(cedePositionId)}, ` +
        `${sqlValue(meetingId)}, ` +
        `${sqlValue(account.cusip)}, ` +
        `${sqlValue(normalizeAccountType('CEDE & CO / CTC & CO'))}, ` +
        `${sqlValue(client.ticker + 'J' + meetingYear)}, ` +
        `${sqlValue('CEDE & CO')}, ` +
        `NULL, ` +
        `${sqlValue(cedeVoteStatus)}, ` +
        `${sqlValue('CEDE001')}, ` +
        `${cedeShares.toFixed(6)}, ` +
        `${cedeVoteTarget.toFixed(6)}, ` +
        `${sqlValue(cedeSource)}, ` +
        `${sqlValue(cedeDateVoted)}, ` +
        `${sqlValue(createdAt)}, ` +
        `${sqlValue(createdAt)});`
      )

      positionVoteMeta[cedePositionId] = {
        meetingId,
        shares: cedeShares,
        sharesVoted: cedeVoteTarget,
      }

      const remainingShares = Math.max(safeTotalShares - cedeShares, 1)
      const meetingSeed = copycat.int(`meeting-${meetingId}`, {
        min: 0,
        max: 999999,
      })
      // Reduce positions to make seed file smaller
      const basePositions = isWendys ? 30 : 20
      const positionVariation = (meetingSeed % 50) + 10
      const numPositions = Math.max(15, basePositions + positionVariation)

      const rawWeights: number[] = []
      for (let p = 0; p < numPositions; p++) {
        let weight = 0.02
        if (p === 0) weight = 15
        else if (p < 10) weight = 1
        else if (p < 100) weight = 0.1
        const weightSeed = copycat.int(`weight-${meetingId}-${p}`, {
          min: 50,
          max: 150,
        })
        rawWeights.push(weight * weightSeed)
      }

      const weightTotal = rawWeights.reduce((sum, weight) => sum + weight, 0) || 1
      const positionShares = rawWeights.map((weight) =>
        Math.max(1, Math.floor((weight / weightTotal) * remainingShares))
      )

      let sharesSum = positionShares.reduce((sum, value) => sum + value, 0)
      let adjustIndex = 0
      while (
        sharesSum !== remainingShares &&
        positionShares.length > 0 &&
        adjustIndex < positionShares.length * 4
      ) {
        const delta = sharesSum < remainingShares ? 1 : -1
        const idx = adjustIndex % positionShares.length
        if (delta > 0 || positionShares[idx] > 1) {
          positionShares[idx] += delta
          sharesSum += delta
        }
        adjustIndex++
      }
      if (sharesSum !== remainingShares && positionShares.length > 0) {
        positionShares[positionShares.length - 1] = Math.max(
          1,
          positionShares[positionShares.length - 1] + (remainingShares - sharesSum)
        )
      }

      let remainingVotePool = Math.max(0, targetVotingSharesRaw - cedeVoteTarget)
      let remainingRegisteredShares = positionShares.reduce(
        (sum, shares) => sum + shares,
        0
      )

      // Use actual account names from CSV data for consistency across all events
      // Get unique account names from CSV data for this client
      const csvPositions = isWendys
        ? wendysData?.positions
        : isEnliven
          ? enlivenData?.positions
          : isPaycom
            ? paycomData?.positions
            : isWoodward
              ? woodwardData?.positions
              : []

      // Extract unique account names from CSV (excluding CEDE)
      const csvAccountNames = csvPositions
        ? Array.from(
          new Set(
            csvPositions
              .filter((p: any) => p.name && !p.name.includes('CEDE'))
              .map((p: any) => p.name.trim())
          )
        ).slice(0, 100) // Use first 100 unique names
        : []

      // Fallback names if CSV data not available
      const fallbackInstitutionalNames = [
        'BLACKROCK INC',
        'VANGUARD GROUP INC',
        'STATE STREET CORP',
        'FIDELITY MGMT & RESEARCH',
        'JPMORGAN CHASE & CO',
        'BANK OF AMERICA CORP',
        'WELLINGTON MANAGEMENT',
        'CAPITAL GROUP',
        'DIMENSIONAL FUND ADVISORS',
        'T. ROWE PRICE',
      ]

      const fallbackIndividualNames = [
        'JOHN SMITH TR',
        'MARY JOHNSON',
        'ROBERT WILLIAMS',
        'JENNIFER BROWN',
        'MICHAEL DAVIS',
        'PATRICIA GARCIA',
        'DAVID RODRIGUEZ',
        'LINDA MARTINEZ',
        'RICHARD WILSON',
        'ELIZABETH ANDERSON',
      ]

      const institutionalNames =
        csvAccountNames.length > 0 ? csvAccountNames : fallbackInstitutionalNames
      const individualNames =
        csvAccountNames.length > 0 ? csvAccountNames : fallbackIndividualNames

      for (let p = 0; p < numPositions; p++) {
        const positionId = copycat.uuid(`position-${meetingId}-${p}`)
        const shares = positionShares[p] ?? 1

        positionIds.push(positionId)
        positionToMeetingMap[positionId] = meetingId

        let sharesVoted = 0
        if (meetingPhase >= 6 && remainingVotePool > 0) {
          const proportion =
            remainingRegisteredShares > 0 ? shares / remainingRegisteredShares : 0
          const expectedVotes = Math.round(proportion * remainingVotePool)
          const jitterSeed = copycat.int(`vote-allocation-${meetingId}-${p}`, {
            min: -150,
            max: 150,
          })
          let allocatedVotes =
            expectedVotes + Math.round((expectedVotes * jitterSeed) / 1000)

          allocatedVotes = clamp(allocatedVotes, 0, shares)
          if (allocatedVotes > remainingVotePool) {
            allocatedVotes = remainingVotePool
          }
          if (p === numPositions - 1) {
            allocatedVotes = Math.min(shares, remainingVotePool)
          }

          sharesVoted = allocatedVotes
        }

        const voteStatus = sharesVoted > 0 ? 'Voted' : 'Unvoted'
        const sourceSeed = copycat.int(`vote-source-${meetingId}-${p}`, {
          min: 0,
          max: sources.length - 1,
        })
        const source = sharesVoted > 0 ? sources[sourceSeed % sources.length] : null

        const timingSeed = copycat.int(`vote-timing-${meetingId}-${p}`, {
          min: 0,
          max: 999,
        })
        const daysBefore =
          timingSeed < 600
            ? 20 + (timingSeed % 11)
            : timingSeed < 900
              ? 7 + (timingSeed % 14)
              : timingSeed % 7
        const dateVoted =
          sharesVoted > 0
            ? meetingDate
              .minus({ days: daysBefore })
              .toFormat('MM/dd/yyyy hh:mma')
              .toUpperCase()
            : null

        const holderSeed = copycat.int(`holder-${meetingId}-${p}`, {
          min: 0,
          max: 999,
        })
        let holderName: string

        // If we have CSV account names, cycle through them
        if (csvAccountNames.length > 0) {
          const nameIndex = p % csvAccountNames.length
          holderName = csvAccountNames[nameIndex]
        } else if (p < institutionalNames.length) {
          holderName = institutionalNames[p]
        } else if (p < institutionalNames.length + individualNames.length) {
          holderName = individualNames[p - institutionalNames.length]
        } else if (holderSeed % 100 < 30) {
          const companyTypes = ['INC', 'CORP', 'LLC', 'LP', 'TRUST', 'FUND']
          const baseCompany = copycat.word(`company-${meetingId}-${p}`)
          holderName = `${baseCompany.toUpperCase()} CAPITAL ${companyTypes[p % companyTypes.length]}`
        } else {
          const firstName = copycat.firstName(`person-${meetingId}-${p}`)
          const lastName = copycat.lastName(`person-${meetingId}-${p}`)
          const suffixes = ['', ' JR', ' SR', ' III', ' TR', ' TTEE', ' & ASSOC']
          holderName = `${firstName.toUpperCase()} ${lastName.toUpperCase()}${suffixes[p % suffixes.length]}`
        }

        const hasAccountNumber = copycat.bool(`account-${meetingId}-${p}`)
        const accountNumberSql = hasAccountNumber
          ? sqlValue('ACC' + String(p).padStart(6, '0'))
          : 'NULL'

        const controlNumber = String(p + 1).padStart(8, '0')

        sqlStatements.push(
          `INSERT INTO "position"(` +
          `id, meeting_id, cusip, account_type, set_key, name, account_number, ` +
          `vote_status, control_number, shares, shares_voted, source, date_voted, ` +
          `created_at, updated_at) VALUES (` +
          `${sqlValue(positionId)}, ` +
          `${sqlValue(meetingId)}, ` +
          `${sqlValue(account.cusip)}, ` +
          `${sqlValue(normalizeAccountType('Registered Account'))}, ` +
          `${sqlValue(client.ticker + 'J' + meetingYear)}, ` +
          `${sqlValue(holderName)}, ` +
          `${accountNumberSql}, ` +
          `${sqlValue(voteStatus)}, ` +
          `${sqlValue(controlNumber)}, ` +
          `${shares.toFixed(6)}, ` +
          `${sharesVoted.toFixed(6)}, ` +
          `${sqlValue(source)}, ` +
          `${sqlValue(dateVoted)}, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(createdAt)});`
        )

        positionVoteMeta[positionId] = {
          meetingId,
          shares,
          sharesVoted,
        }

        remainingVotePool = Math.max(0, remainingVotePool - sharesVoted)
        remainingRegisteredShares = Math.max(0, remainingRegisteredShares - shares)
      }
    }
  })

  sqlStatements.push('')

  // Generate position votes
  sqlStatements.push('-- Insert position votes')

  // Create a mapping from meetingId to proposalIds for efficient lookup
  const meetingToProposalsMap: Record<string, string[]> = {}
  meetingIds.forEach((meetingId) => {
    meetingToProposalsMap[meetingId] = []
  })

  // Group proposals by meeting based on the generation pattern
  let proposalIndex = 0
  meetingIds.forEach((meetingId) => {
    // Each meeting has ~6 proposals (3 directors + 3 other proposals)
    const proposalsForMeeting = proposalIds.slice(proposalIndex, proposalIndex + 6)
    meetingToProposalsMap[meetingId] = proposalsForMeeting
    proposalIndex += 6
  })

  let totalVotes = 0

  positionIds.forEach((positionId) => {
    const meetingId = positionToMeetingMap[positionId]
    if (!meetingId) return

    const meetingProposals = meetingToProposalsMap[meetingId] || []
    if (meetingProposals.length === 0) return

    const meetingPhase = meetingPhaseMap[meetingId] ?? 1
    const positionMeta = positionVoteMeta[positionId]

    if (!positionMeta || meetingPhase < 6 || positionMeta.sharesVoted <= 0) {
      return
    }

    const totalSharesVoting = Math.round(positionMeta.sharesVoted)
    if (totalSharesVoting <= 0) return

    let remainingShares = totalSharesVoting

    meetingProposals.forEach((proposalId, proposalIndexForMeeting) => {
      if (!proposalId || remainingShares <= 0) return

      const remainingProposals = meetingProposals.length - proposalIndexForMeeting
      let sharesVoting =
        proposalIndexForMeeting === meetingProposals.length - 1
          ? remainingShares
          : Math.max(1, Math.floor(remainingShares / remainingProposals))

      const voteSeed = copycat.int(`position-vote-${positionId}-${proposalId}`, {
        min: 0,
        max: 999,
      })

      if (proposalIndexForMeeting !== meetingProposals.length - 1 && sharesVoting > 1) {
        const variance = (voteSeed % 3) - 1
        const maxReduce = Math.max(1, remainingShares - (remainingProposals - 1))
        sharesVoting = clamp(sharesVoting + variance, 1, maxReduce)
      }

      sharesVoting = Math.min(sharesVoting, remainingShares)
      if (sharesVoting <= 0) return

      remainingShares -= sharesVoting

      let vote: string
      if (proposalId.includes('1')) {
        vote = voteSeed % 100 < 85 ? 'FOR' : 'WITHHOLD'
      } else {
        const threshold = voteSeed % 100
        if (threshold < 70) vote = 'FOR'
        else if (threshold < 85) vote = 'AGAINST'
        else vote = 'ABSTAIN'
      }

      const voteId = copycat.uuid(
        `vote-${totalVotes}-${positionId.substring(0, 8)}-${proposalIndexForMeeting}`
      )

      sqlStatements.push(
        `INSERT INTO position_vote(` +
        `id, position_id, proposal_id, vote, shares_voting, created_at) VALUES (` +
        `${sqlValue(voteId)}, ` +
        `${sqlValue(positionId)}, ` +
        `${sqlValue(proposalId)}, ` +
        `${sqlValue(vote)}, ` +
        `${sqlValue(sharesVoting.toString())}, ` +
        `${sqlValue(createdAt)});`
      )
      totalVotes++
    })
  })

  sqlStatements.push(
    `-- Generated ${totalVotes} position votes for ${positionIds.length} positions`
  )

  sqlStatements.push('')

  // Generate DSM documents for 2025 meetings
  sqlStatements.push('-- Insert DSM documents for 2025 meetings')
  const dsmDocumentTypes = [
    {
      type: 'Shareholder Presentation',
      displayCategory: 'dsm',
      storagePath: 'shareholder-presentation',
    },
    { type: 'Intro Slide', displayCategory: 'dsm', storagePath: 'intro-slide' },
  ]

  // Generate regular proxy documents for 2025 meetings
  sqlStatements.push('-- Insert proxy documents for 2025 meetings')
  const proxyDocumentTypes = [
    {
      type: 'Proxy Statement',
      displayCategory: 'proxy-materials',
      storagePath: 'proxy-statement',
    },
    {
      type: 'Annual Report',
      displayCategory: 'proxy-materials',
      storagePath: 'annual-report',
    },
    {
      type: 'Notice of Annual Meeting',
      displayCategory: 'proxy-materials',
      storagePath: 'notice-of-meeting',
    },
  ]

  // Only add DSM documents for 2025 annual meetings
  const dsmMeetings = meetingIds.filter(
    (id) => id.includes('2025') && id.includes('annual')
  )

  dsmMeetings.forEach((meetingId) => {
    dsmDocumentTypes.forEach((docType) => {
      const dsmDocId = copycat.uuid(`dsm-doc-${meetingId}-${docType.type}`)
      documentIds.push(dsmDocId)

      // Generate appropriate status based on display category
      let status = 'UPLOADED'
      if (docType.displayCategory === 'post-meeting') {
        status = 'COMPLETED'
      } else if (
        docType.displayCategory === 'dsm' ||
        docType.displayCategory === 'proxy-materials'
      ) {
        status = 'AUTHORIZED'
      }

      // Generate storage URL - point to placeholder PDF files
      const fileName = `${docType.storagePath}.pdf`
      const storageUrl = `http://127.0.0.1:54321/storage/v1/object/public/documents/${meetingId}/${docType.storagePath}/${fileName}`

      // Use more descriptive titles
      let title = docType.type
      if (docType.type === 'Shareholder Presentation') {
        const clientName = meetingToClient[meetingId]?.companyName || ''
        title = `${clientName} Annual Meeting Presentation`
      } else if (docType.type === 'Meeting Minutes') {
        title = '2025 Annual Meeting Minutes'
      } else if (docType.type === 'Proxy Notice') {
        title = 'Notice of Annual Meeting'
      }

      sqlStatements.push(
        `INSERT INTO document(` +
        `id, meeting_id, title, type, file_path, file_type, file_size, ` +
        `status, display_category, created_at, updated_at) VALUES (` +
        `${sqlValue(dsmDocId)}, ` +
        `${sqlValue(meetingId)}, ` +
        `${sqlValue(title)}, ` +
        `${sqlValue(docType.type)}, ` +
        `${sqlValue(storageUrl)}, ` +
        `${sqlValue('pdf')}, ` +
        `${1024 * 250}, ` + // Approximate file size
        `${sqlValue(status)}, ` +
        `${sqlValue(docType.displayCategory)}, ` +
        `${sqlValue(createdAt)}, ` +
        `${sqlValue(createdAt)});`
      )
    })
  })

  sqlStatements.push(
    `-- Generated ${dsmMeetings.length * dsmDocumentTypes.length} DSM documents for 2025 meetings`
  )

  // Add regular proxy documents for 2025 meetings
  dsmMeetings.forEach((meetingId) => {
    proxyDocumentTypes.forEach((docType) => {
      const proxyDocId = copycat.uuid(`proxy-doc-${meetingId}-${docType.type}`)
      documentIds.push(proxyDocId)

      const status = 'APPROVED'
      const fileName = `${docType.storagePath}.pdf`
      const storageUrl = `http://127.0.0.1:54321/storage/v1/object/public/documents/${meetingId}/${docType.storagePath}/${fileName}`

      sqlStatements.push(
        `INSERT INTO document(` +
        `id, meeting_id, title, type, file_path, file_type, file_size, ` +
        `status, display_category, created_at, updated_at) VALUES (` +
        `${sqlValue(proxyDocId)}, ` +
        `${sqlValue(meetingId)}, ` +
        `${sqlValue(docType.type)}, ` +
        `${sqlValue(docType.type)}, ` +
        `${sqlValue(storageUrl)}, ` +
        `'PDF', ` +
        `${copycat.int(meetingId + docType.type, { min: 500000, max: 5000000 })}, ` +
        `${sqlValue(status)}, ` +
        `${sqlValue(docType.displayCategory)}, ` +
        `${sqlValue(copycat.dateString(meetingId + docType.type + 'created', { minYear: 2024, maxYear: 2025 }))}, ` +
        `${sqlValue(copycat.dateString(meetingId + docType.type + 'updated', { minYear: 2024, maxYear: 2025 }))}` +
        `);`
      )
    })
  })

  sqlStatements.push(
    `-- Generated ${dsmMeetings.length * proxyDocumentTypes.length} proxy documents for 2025 meetings`
  )
  sqlStatements.push('')

  // Generate comments for some documents
  sqlStatements.push('-- Insert comments')

  // Realistic comment templates
  const commentTemplates = [
    'Looks good! Approved for next phase.',
    'Please update the shareholder letter section before final approval.',
    'Can you verify the voting deadline date? It seems incorrect.',
    'The disclosure on page 3 needs to be expanded per SEC requirements.',
    'Great work on this document! Ready to file.',
    'Minor formatting issue on page 2 - please fix the table alignment.',
    'This needs legal review before we can proceed.',
    'Approved with minor revisions. See attached notes.',
    'Can we add more detail about the compensation structure?',
    'Perfect! Moving this to the next reviewer.',
  ]

  documentIds.slice(0, 15).forEach((documentId, index) => {
    const numComments = 1 + (index % 3)
    for (let c = 0; c < numComments; c++) {
      const userId = userIds[index % userIds.length]
      const user =
        seedConfig.users.issuerUsers[index % seedConfig.users.issuerUsers.length]
      const comment = commentTemplates[(index + c) % commentTemplates.length]

      sqlStatements.push(
        `INSERT INTO "comment"(` +
        `document_id, user_id, comment, first_name, last_name, created_at) VALUES (` +
        `${sqlValue(documentId)}, ` +
        `${sqlValue(userId)}, ` +
        `${sqlValue(comment)}, ` +
        `${sqlValue(user.firstName)}, ` +
        `${sqlValue(user.lastName)}, ` +
        `${sqlValue(
          DateTime.now()
            .minus({ days: c * 2 + 1 })
            .toISO()
        )});`
      )
    }
  })

  sqlStatements.push('')

  // Generate signatures for signed documents
  sqlStatements.push('-- Insert signatures')
  documentIds.forEach((documentId, index) => {
    // Only add signatures to signed/completed documents
    if (index % 3 < 2) {
      const signatureId = copycat.uuid(`sig-${documentId}`)

      sqlStatements.push(
        `INSERT INTO signature(` +
        `id, document_id, page_number, x_position, y_position, width, height, ` +
        `signature_type, required, created_at, updated_at) VALUES (` +
        `${sqlValue(signatureId)}, ` +
        `${sqlValue(documentId)}, ` +
        `${1 + (index % 3)}, ` +
        `${100.5}, ` +
        `${200.5}, ` +
        `${150.0}, ` +
        `${50.0}, ` +
        `${sqlValue('Electronic')}, ` +
        `true, ` +
        `${sqlValue(createdAt)}, ` +
        `${sqlValue(createdAt)});`
      )
    }
  })

  sqlStatements.push('')

  // NOTE: The clients table no longer has 'accounts' and 'meetings' JSON columns.
  // Accounts are linked via foreign keys in the 'account' table (client_id)
  // Meetings are linked via foreign keys in the 'meeting' table (client_id)
  // This section has been removed to avoid SQL errors.

  sqlStatements.push('')

  // Generate tabulation reports for COMPLETE meetings using CSV summary data when available
  sqlStatements.push(
    '-- Insert tabulation_report data for COMPLETE meetings using CSV summaries'
  )

  // Helper function to get company data by ticker
  const getCompanyDataByTicker = (ticker: string) => {
    switch (ticker) {
      case 'WEN':
        return wendysData
      case 'ELVN':
        return enlivenData
      case 'PAYC':
        return paycomData
      case 'WWD':
        return woodwardData
      default:
        return null
    }
  }

  // Generate tabulation reports for each COMPLETE meeting
  // First, we need to map meeting IDs to their tickers based on generation order
  const meetingTickerMap: Record<string, string> = {}
  let meetingCounter = 0

  // The meetings were generated in the same order as seedConfig.clients
  seedConfig.clients.forEach((client) => {
    meetingsByYear.forEach((yearData) => {
      yearData.meetings.forEach((meetingData) => {
        const meetingId = meetingIds[meetingCounter]
        if (meetingId) {
          meetingTickerMap[meetingId] = client.ticker
          meetingCounter++
        }
      })
    })
  })

  // Insert tabulation reports for COMPLETE meetings (2025 and earlier) and Phase 7+ meetings
  meetingIds.forEach((meetingId, index) => {
    const ticker = meetingTickerMap[meetingId]
    const companyData = getCompanyDataByTicker(ticker)

    // Determine if this meeting should have a tabulation report
    // Phase 8 (complete) or Phase 7+ (ongoing special meetings need reports)
    const meetingPhase = meetingPhaseMap[meetingId] ?? 8
    const isSpecialMeeting = meetingId.includes('special')
    const shouldHaveReport = meetingPhase === 8 || (meetingPhase >= 7 && isSpecialMeeting)

    if (shouldHaveReport) {
      const tabulationId = copycat.uuid(`tabulation-${meetingId}`)

      if (companyData?.voteStatusSummary) {
        // Use CSV summary data for accurate tabulation
        const { dtcSummary, nonDtcSummary } = companyData.voteStatusSummary

        sqlStatements.push(`
INSERT INTO tabulation_report(id, meeting_id, set_keys, broker_voting, share_range_performance, non_dtc_vote_status, dtc_vote_status, vote_distribution, positions_voted, last_calculated_at, created_at, updated_at)
VALUES (
    ${sqlValue(tabulationId)},
    ${sqlValue(meetingId)},
    (SELECT COALESCE(json_agg(DISTINCT set_key ORDER BY set_key), '[]'::json) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND set_key IS NOT NULL),
    jsonb_build_object(
        'proposal1', jsonb_build_array(
            jsonb_build_object('broker', 'CEDE & CO', 'for', 1500000, 'against', 75000, 'abstain', 25000),
            jsonb_build_object('broker', 'BlackRock', 'for', 250000, 'against', 15000, 'abstain', 5000),
            jsonb_build_object('broker', 'Vanguard', 'for', 180000, 'against', 12000, 'abstain', 8000),
            jsonb_build_object('broker', 'State Street', 'for', 95000, 'against', 8000, 'abstain', 2000),
            jsonb_build_object('broker', 'Fidelity', 'for', 75000, 'against', 5000, 'abstain', 1500)
        ),
        'proposal2', jsonb_build_array(
            jsonb_build_object('broker', 'CEDE & CO', 'for', 1450000, 'against', 120000, 'abstain', 30000),
            jsonb_build_object('broker', 'BlackRock', 'for', 240000, 'against', 25000, 'abstain', 5000),
            jsonb_build_object('broker', 'Vanguard', 'for', 170000, 'against', 22000, 'abstain', 8000),
            jsonb_build_object('broker', 'State Street', 'for', 88000, 'against', 15000, 'abstain', 2000),
            jsonb_build_object('broker', 'Fidelity', 'for', 70000, 'against', 8000, 'abstain', 2000)
        )
    ),
    (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'rangeLabel', range_label,
                'positionCount', position_count,
                'totalShares', total_shares,
                'percentVoted', CASE WHEN total_shares > 0 THEN (voted_shares::numeric / total_shares::numeric * 100) ELSE 0 END
            ) ORDER BY range_order
        ), '[]'::jsonb)
        FROM (
            SELECT
                CASE
                    WHEN shares < 100 THEN '0-99'
                    WHEN shares < 500 THEN '100-499'
                    WHEN shares < 1000 THEN '500-999'
                    WHEN shares < 5000 THEN '1,000-4,999'
                    WHEN shares < 10000 THEN '5,000-9,999'
                    WHEN shares < 50000 THEN '10,000-49,999'
                    WHEN shares < 100000 THEN '50,000-99,999'
                    ELSE '100,000+'
                END as range_label,
                CASE
                    WHEN shares < 100 THEN 1
                    WHEN shares < 500 THEN 2
                    WHEN shares < 1000 THEN 3
                    WHEN shares < 5000 THEN 4
                    WHEN shares < 10000 THEN 5
                    WHEN shares < 50000 THEN 6
                    WHEN shares < 100000 THEN 7
                    ELSE 8
                END as range_order,
                COUNT(*) as position_count,
                SUM(shares) as total_shares,
                SUM(CASE WHEN vote_status = 'Voted' THEN shares_voted ELSE 0 END) as voted_shares
            FROM position
            WHERE meeting_id = ${sqlValue(meetingId)}
            GROUP BY range_label, range_order
        ) ranges
    ),
    ${sqlValue(
          JSON.stringify({
            unvotedShareholders: nonDtcSummary.unvotedShareholders,
            unvotedShares: nonDtcSummary.unvotedShares,
            printShareholders: nonDtcSummary.printShareholders,
            printShares: nonDtcSummary.printShares,
            ivrShareholders: nonDtcSummary.ivrShareholders,
            ivrShares: nonDtcSummary.ivrShares,
            webShareholders: nonDtcSummary.webShareholders,
            webShares: nonDtcSummary.webShares,
            votedSubtotalShareholders: nonDtcSummary.votedSubtotalShareholders,
            votedSubtotalShares: nonDtcSummary.votedSubtotalShares,
            grandTotalShareholders: nonDtcSummary.grandTotalShareholders,
            grandTotalShares: nonDtcSummary.grandTotalShares,
          })
        )}::jsonb,
    ${sqlValue(
          JSON.stringify({
            unvotedShareholders: dtcSummary.unvotedParticipants,
            unvotedShares: dtcSummary.unvotedShares,
            votedShareholders: dtcSummary.votedParticipants,
            votedShares: dtcSummary.votedShares,
            grandTotalShareholders:
              dtcSummary.unvotedParticipants + dtcSummary.votedParticipants,
            grandTotalShares: dtcSummary.unvotedShares + dtcSummary.votedShares,
          })
        )}::jsonb,
    ${sqlValue(
          JSON.stringify({
            dtcVotedShares: dtcSummary.votedShares,
            dtcUnvotedShares: dtcSummary.unvotedShares,
            nonDtcVotedShares: nonDtcSummary.votedSubtotalShares,
            nonDtcUnvotedShares: nonDtcSummary.unvotedShares,
          })
        )}::jsonb,
    (
        SELECT jsonb_build_object(
            'voted', COALESCE(COUNT(*) FILTER (WHERE vote_status = 'Voted'), 0),
            'unvoted', COALESCE(COUNT(*) FILTER (WHERE vote_status = 'Unvoted'), 0),
            'totalShares', (SELECT total_shares_outstanding FROM meeting WHERE id = ${sqlValue(meetingId)}),
            'votedShares', COALESCE(SUM(CASE WHEN vote_status = 'Voted' THEN shares_voted ELSE 0 END), 0)
        )
        FROM position WHERE meeting_id = ${sqlValue(meetingId)}
    ),
    NOW(),
    NOW(),
    NOW()
);`)
      } else {
        // Fallback to SQL aggregation for companies without CSV summary data
        sqlStatements.push(`
INSERT INTO tabulation_report(id, meeting_id, set_keys, broker_voting, share_range_performance, non_dtc_vote_status, dtc_vote_status, vote_distribution, positions_voted, last_calculated_at, created_at, updated_at)
SELECT
    ${sqlValue(tabulationId)},
    ${sqlValue(meetingId)},
    (SELECT COALESCE(json_agg(DISTINCT set_key ORDER BY set_key), '[]'::json) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND set_key IS NOT NULL),
    jsonb_build_object(
        'proposal1', jsonb_build_array(
            jsonb_build_object('broker', 'CEDE & CO', 'for', 1200000, 'against', 85000, 'abstain', 15000),
            jsonb_build_object('broker', 'BlackRock', 'for', 200000, 'against', 18000, 'abstain', 7000),
            jsonb_build_object('broker', 'Vanguard', 'for', 150000, 'against', 15000, 'abstain', 10000),
            jsonb_build_object('broker', 'State Street', 'for', 85000, 'against', 10000, 'abstain', 3000),
            jsonb_build_object('broker', 'Fidelity', 'for', 65000, 'against', 6000, 'abstain', 2000)
        ),
        'proposal2', jsonb_build_array(
            jsonb_build_object('broker', 'CEDE & CO', 'for', 1150000, 'against', 135000, 'abstain', 15000),
            jsonb_build_object('broker', 'BlackRock', 'for', 190000, 'against', 30000, 'abstain', 5000),
            jsonb_build_object('broker', 'Vanguard', 'for', 140000, 'against', 25000, 'abstain', 10000),
            jsonb_build_object('broker', 'State Street', 'for', 80000, 'against', 18000, 'abstain', 5000),
            jsonb_build_object('broker', 'Fidelity', 'for', 62000, 'against', 9000, 'abstain', 2000)
        )
    ),
    (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'rangeLabel', range_label,
                'positionCount', position_count,
                'totalShares', total_shares,
                'percentVoted', CASE WHEN total_shares > 0 THEN (voted_shares::numeric / total_shares::numeric * 100) ELSE 0 END
            ) ORDER BY range_order
        ), '[]'::jsonb)
        FROM (
            SELECT
                CASE
                    WHEN shares < 100 THEN '0-99'
                    WHEN shares < 500 THEN '100-499'
                    WHEN shares < 1000 THEN '500-999'
                    WHEN shares < 5000 THEN '1,000-4,999'
                    WHEN shares < 10000 THEN '5,000-9,999'
                    WHEN shares < 50000 THEN '10,000-49,999'
                    WHEN shares < 100000 THEN '50,000-99,999'
                    ELSE '100,000+'
                END as range_label,
                CASE
                    WHEN shares < 100 THEN 1
                    WHEN shares < 500 THEN 2
                    WHEN shares < 1000 THEN 3
                    WHEN shares < 5000 THEN 4
                    WHEN shares < 10000 THEN 5
                    WHEN shares < 50000 THEN 6
                    WHEN shares < 100000 THEN 7
                    ELSE 8
                END as range_order,
                COUNT(*) as position_count,
                SUM(shares) as total_shares,
                SUM(CASE WHEN vote_status = 'Voted' THEN shares_voted ELSE 0 END) as voted_shares
            FROM position
            WHERE meeting_id = ${sqlValue(meetingId)}
            GROUP BY range_label, range_order
        ) ranges
    ),
    jsonb_build_object(
        'unvotedShareholders', (SELECT COUNT(*) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Unvoted'),
        'unvotedShares', (SELECT COALESCE(SUM(shares), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Unvoted'),
        'printShareholders', (SELECT COUNT(*) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Voted' AND source = 'PRINT'),
        'printShares', (SELECT COALESCE(SUM(shares_voted), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Voted' AND source = 'PRINT'),
        'ivrShareholders', (SELECT COUNT(*) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Voted' AND source = 'IVR'),
        'ivrShares', (SELECT COALESCE(SUM(shares_voted), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Voted' AND source = 'IVR'),
        'webShareholders', (SELECT COUNT(*) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Voted' AND source = 'WEB'),
        'webShares', (SELECT COALESCE(SUM(shares_voted), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Voted' AND source = 'WEB'),
        'votedSubtotalShareholders', (SELECT COUNT(*) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Voted'),
        'votedSubtotalShares', (SELECT COALESCE(SUM(shares_voted), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Voted'),
        'grandTotalShareholders', (SELECT COUNT(*) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC'),
        'grandTotalShares', (SELECT COALESCE(SUM(shares), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC')
    ),
    jsonb_build_object(
        'unvotedShareholders', (SELECT COUNT(*) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'DTC/CDS' AND vote_status = 'Unvoted'),
        'unvotedShares', (SELECT COALESCE(SUM(shares), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'DTC/CDS' AND vote_status = 'Unvoted'),
        'votedShareholders', (SELECT COUNT(*) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'DTC/CDS' AND vote_status = 'Voted'),
        'votedShares', (SELECT COALESCE(SUM(shares_voted), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'DTC/CDS' AND vote_status = 'Voted'),
        'grandTotalShareholders', (SELECT COUNT(*) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'DTC/CDS'),
        'grandTotalShares', (SELECT COALESCE(SUM(shares), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'DTC/CDS')
    ),
    jsonb_build_object(
        'dtcVotedShares', (SELECT COALESCE(SUM(shares_voted), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'DTC/CDS' AND vote_status = 'Voted'),
        'dtcUnvotedShares', (SELECT COALESCE(SUM(shares), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'DTC/CDS' AND vote_status = 'Unvoted'),
        'nonDtcVotedShares', (SELECT COALESCE(SUM(shares_voted), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Voted'),
        'nonDtcUnvotedShares', (SELECT COALESCE(SUM(shares), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND account_type = 'Non-DTC' AND vote_status = 'Unvoted')
    ),
    jsonb_build_object(
        'voted', (SELECT COALESCE(COUNT(*), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND vote_status = 'Voted'),
        'unvoted', (SELECT COALESCE(COUNT(*), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND vote_status = 'Unvoted'),
        'totalShares', (SELECT total_shares_outstanding FROM meeting WHERE id = ${sqlValue(meetingId)}),
        'votedShares', (SELECT COALESCE(SUM(shares_voted), 0) FROM position WHERE meeting_id = ${sqlValue(meetingId)} AND vote_status = 'Voted')
    ),
    NOW(),
    NOW(),
    NOW();`)
      }
    }
  })

  sqlStatements.push('')

  // Digital shareholder meeting attendees
  sqlStatements.push('-- Insert digital shareholder meeting attendees')

  meetingIds.forEach((meetingId) => {
    const year = parseInt(meetingId.split('-').slice(-1)[0])

    // Only generate for 2023+ meetings
    if (year >= 2023) {
      const ticker = meetingId.split('-')[0].toUpperCase()

      // Generate different numbers of attendees based on company
      const baseAttendeeCount =
        ticker === 'WEN' ? 45 : ticker === 'ELVN' ? 30 : ticker === 'PAYC' ? 35 : 25
      const attendeeCount = copycat.int(`${meetingId}-attendee-count`, {
        min: baseAttendeeCount,
        max: baseAttendeeCount + 15,
      })

      for (let i = 0; i < attendeeCount; i++) {
        const attendeeId = copycat.uuid(`${meetingId}-attendee-${i}`)
        const seed = `${meetingId}-attendee-${i}`

        // Vary the registrant types
        const registrantTypes = [
          'Shareholder',
          'Shareholder',
          'Shareholder',
          'Guest',
          'Proxy',
          'Other',
        ]
        const registrantType = registrantTypes[i % registrantTypes.length]

        const firstName = copycat.firstName(seed)
        const lastName = copycat.lastName(seed)
        const emailAddress = copycat.email(`${seed}-email`)

        // Add registration questions for some attendees
        // copycat.bool only accepts a single seed argument, so emulate 30% probability via copycat.int
        const hasQuestion =
          copycat.int(`${seed}-has-question-prob`, { min: 0, max: 999 }) < 300
        const questions = [
          'What are the plans for expansion in the next fiscal year?',
          'Can you provide more details on the sustainability initiatives?',
          'How is the company addressing supply chain challenges?',
          'What is the strategy for digital transformation?',
          'Are there any plans for dividend increases?',
          'What are the key performance metrics for this year?',
          'How is the company managing inflation impacts?',
          'What new products are in the pipeline?',
          'Can you elaborate on the M&A strategy?',
          'What are the cybersecurity investment priorities?',
        ]
        const registrationQuestions = hasQuestion
          ? questions[
          copycat.int(`${seed}-question`, { min: 0, max: questions.length - 1 })
          ]
          : null

        // Generate minutes attended (most attend 30-60 minutes)
        // Generate minutes attended (most attend 30-60 minutes)
        // Deterministic 85% attendance chance (bool only accepts one arg)
        const attended = copycat.int(`${seed}-attended-prob`, { min: 0, max: 999 }) < 850
        const minutesAttendedMeeting = attended
          ? copycat.int(`${seed}-minutes`, { min: 15, max: 90 })
          : null
        sqlStatements.push(
          `INSERT INTO digital_shareholder_meeting(id, meeting_id, registrant_type, first_name, last_name, email_address, registration_questions, minutes_attended_meeting, created_at, updated_at) VALUES (` +
          `${sqlValue(attendeeId)}, ` +
          `${sqlValue(meetingId)}, ` +
          `${sqlValue(registrantType)}, ` +
          `${sqlValue(firstName)}, ` +
          `${sqlValue(lastName)}, ` +
          `${sqlValue(emailAddress)}, ` +
          `${sqlValue(registrationQuestions)}, ` +
          `${sqlValue(minutesAttendedMeeting)}, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(createdAt)});`
        )
      }
    }
  })

  sqlStatements.push('')

  // Output all SQL statements
  console.log(sqlStatements.join('\n'))
}

// Execute seed generation
main()
