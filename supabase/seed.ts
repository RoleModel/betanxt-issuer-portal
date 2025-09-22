import { copycat } from '@snaplet/copycat'
import * as fs from 'fs'
import { DateTime } from 'luxon'
import * as path from 'path'

import { seedConfig } from './seed.config'

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
  return `'${str.replace(/'/g, "''")}'`
}

// Function to format value for SQL
const sqlValue = (value: any): string => {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'string') return escapeSql(value)
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value instanceof Date) return escapeSql(value.toISOString())
  return escapeSql(String(value))
}

// Function to generate proposal results based on meeting year and type
const generateProposalResults = (
  proposalType: string,
  meetingYear: string,
  proposalIndex: number,
  proposalTitle?: string,
  isWendys: boolean = false
) => {
  const year = parseInt(meetingYear)
  const isHistorical = year < 2025

  if (!isHistorical) {
    // Future meetings don't have results yet
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

  // For Wendy's 2024 meeting, we would use real CSV data, but for now we'll skip it
  // The real CSV data integration will come later - for now just generate realistic data
  // Only the 2024 annual meeting should have real data, all others are generated

  // Generate realistic results for historical meetings
  const seedStr = `${proposalType}-${meetingYear}-${proposalIndex}`
  const seed = copycat.int(seedStr, { min: 0, max: 999999 })

  // Use appropriate share base for Wendy's vs other companies
  const baseShares = isWendys ? 148285700 : 50000000 + (seed % 25000000) // Wendy's actual shares vs 50M-75M for others

  // Different pass rates by proposal type
  let passRate = 0.85 // Default 85% pass rate
  if (proposalType === 'Director Election')
    passRate = 0.95 // Directors almost always pass
  else if (proposalType === 'Say on Pay')
    passRate = 0.75 // More contentious
  else if (proposalType === 'Auditor Ratification')
    passRate = 0.98 // Almost always pass
  else if (proposalType.includes('Shareholder')) passRate = 0.25 // Shareholder proposals often fail

  const willPass = seed % 100 < passRate * 100
  const participationRate = 0.65 + (seed % 1000) / 10000 // 65-75% participation
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
  }
}

// Function to generate task description
const generateTaskDescription = (title: string, type: string, status: string): string => {
  const descriptions: Record<string, string> = {
    'DTCC (SPR) Authorization Status':
      'Check and confirm authorization status with DTCC for shareholder proxy record access.',
    'Plan File Request form':
      'Submit request form to obtain employee stock plan participant files.',
    'Transfer Agent Registered File Request Form':
      'Request registered shareholder files from the transfer agent.',
    'Broadridge/ICS Access':
      'Obtain authorization and access credentials for Broadridge/ICS proxy services.',
    'DTCC authorization': 'Complete DTCC authorization process for proxy voting access.',
    'TA Registered File':
      'Upload registered shareholder file received from transfer agent.',
    'DTCC SPR': 'Upload DTCC Shareholder Proxy Record file for proxy distribution.',
    'Plan File(s)': 'Upload employee stock plan participant files.',
    'Beneficial Count Settlement':
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
      'Review and approve enhanced annual report and proxy materials.',
    'Approve IVR, Document-hosting & eVote sites':
      'Review and approve interactive voice response, document hosting, and electronic voting sites.',
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
    if (status === 'NEEDS_AUTHORIZATION') {
      links.push({
        label: 'Authorize',
        url: `https://portal.dtcc.com`,
        action: 'authorize',
      })
    }
  }

  // Document tasks - forms that need to be filled out
  else if (type === 'Document') {
    if (title.includes('Request form') || title.includes('Request Form')) {
      links.push({
        label: 'Download Form',
        url: `https://portal.betanxt.com/forms/${ticker.toLowerCase()}`,
        action: 'download',
      })
    } else {
      links.push({
        label: 'View Document',
        url: `https://portal.betanxt.com/documents/${ticker.toLowerCase()}`,
        action: 'external',
      })
    }
  }

  // File Upload tasks
  else if (type === 'File Upload') {
    links.push({
      label: 'Upload Document',
      url: `https://portal.betanxt.com/upload/${ticker.toLowerCase()}`,
      action: 'upload',
    })
  }

  // Approval tasks
  else if (type === 'Approval') {
    links.push({
      label: 'Review and Approve',
      url: `https://portal.betanxt.com/approve/${ticker.toLowerCase()}`,
      action: 'sign',
    })
  }

  // Filing tasks
  else if (type === 'Filing') {
    links.push({
      label: 'View Document',
      url: `https://portal.betanxt.com/filings/${ticker.toLowerCase()}`,
      action: 'external',
    })
  }

  // Default link for other types
  else {
    links.push({
      label: 'View Document',
      url: `https://portal.betanxt.com/documents/${ticker.toLowerCase()}`,
      action: 'external',
    })
  }

  return links
}

// CSV parsing interfaces
interface WendysShareholderVote {
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

interface WendysProposalVote {
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

// Load Wendy's shareholder votes
function loadWendysShareholderVotes(): WendysShareholderVote[] {
  try {
    const csvPath = path.join(__dirname, '../data/wendys_shareholder_votes_combined.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const rawData = parseCSV(csvContent)

    return rawData.map((row) => ({
      cusip: row['Cusip'],
      accountType: row['Account Type'],
      setKey: row['Set Key'],
      name: row['Name'],
      accountNumber: row['Account #'] || '',
      voteStatus: row['Vote Status'],
      shares: parseFloat(row['Shares']) || 0,
      sharesVoted: parseFloat(row['Shares Voted']) || 0,
      source: row['Source'] || null,
      dateVoted: row['Date Voted'] || null,
    }))
  } catch (error) {
    console.error("Error loading Wendy's shareholder votes:", error)
    return []
  }
}

// Load Wendy's tabulation data (proposal votes)
function loadWendysTabulation(): WendysProposalVote[] {
  try {
    const csvPath = path.join(__dirname, '../data/wendys_tabulation_data.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const rawData = parseCSV(csvContent)

    return rawData.map((row) => ({
      proposal: row['Proposal'],
      mrv: row['MRV'],
      forVotes: parseFloat(row['For']) || 0,
      againstVotes: parseFloat(row['Against']) || 0,
      abstainVotes: parseFloat(row['Abstain']) || 0,
      totalVotes: parseFloat(row['Total']) || 0,
    }))
  } catch (error) {
    console.error("Error loading Wendy's tabulation data:", error)
    return []
  }
}

// Load Wendy's vote summary
function loadWendysVoteSummary(): WendysVoteSummary[] {
  try {
    const csvPath = path.join(
      __dirname,
      '../data/wendys-Non-DTC_CDS_Vote_Status_Summary.csv'
    )
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const rawData = parseCSV(csvContent)

    return rawData.map((row) => ({
      category: row['Category'],
      shareholders: parseInt(row['Shareholders']) || 0,
      shareholdersPercent: parseFloat(row['Shareholders_%']) || 0,
      shares: parseFloat(row['Shares']) || 0,
      sharesPercent: parseFloat(row['Shares_%']) || 0,
    }))
  } catch (error) {
    console.error("Error loading Wendy's vote summary:", error)
    return []
  }
}

// Main seed generation
const main = async () => {
  // Generate SQL statements instead of using Supabase client
  const sqlStatements: string[] = []

  // Load Wendy's CSV data
  const wendysShareholderVotes = loadWendysShareholderVotes()
  const wendysTabulation = loadWendysTabulation()
  const wendysVoteSummary = loadWendysVoteSummary()

  console.error(`Loaded ${wendysShareholderVotes.length} Wendy's shareholder votes`)
  console.error(`Loaded ${wendysTabulation.length} Wendy's proposals`)
  console.error(`Loaded ${wendysVoteSummary.length} Wendy's vote summary categories`)

  // Add header comment
  sqlStatements.push('-- Issuer Portal Seed Data')
  sqlStatements.push(`-- Generated on ${new Date().toISOString()}`)
  sqlStatements.push('-- Based on OpenAPI specification')
  sqlStatements.push('')

  // Clear existing data in correct order (respecting foreign key constraints)
  sqlStatements.push('-- Clear existing data')
  sqlStatements.push('DELETE FROM signature;')
  sqlStatements.push('DELETE FROM "comment";')
  sqlStatements.push('DELETE FROM notification;')
  sqlStatements.push('DELETE FROM position_vote;')
  sqlStatements.push('DELETE FROM "position";')
  sqlStatements.push('DELETE FROM proposal;')
  sqlStatements.push('DELETE FROM "document";')
  sqlStatements.push('DELETE FROM task;')
  sqlStatements.push('DELETE FROM phase;')
  sqlStatements.push('DELETE FROM meeting;')
  sqlStatements.push('DELETE FROM "user";')
  sqlStatements.push('DELETE FROM account;')
  sqlStatements.push('DELETE FROM client;')
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
      `INSERT INTO client(id, ticker, company_name, short_name, industry, description, website, primary_contact, primary_contact_email, is_active, created_at) VALUES (` +
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

  // Define meeting types for each year
  const meetingsByYear = [
    // 2025 - Active meetings
    {
      year: 2025,
      meetings: [
        { type: 'Annual Meeting', monthOffset: 2 }, // 3 months ahead (earlier date)
        { type: 'Special Meeting', monthOffset: 2.2 }, // 3.2 months ahead (later date)
      ],
    },
    // 2024 - Completed meetings
    {
      year: 2024,
      meetings: [
        { type: 'Annual Meeting', monthOffset: -9 },
        { type: 'Special Meeting', monthOffset: -6 },
        { type: 'Consent', monthOffset: -3 },
      ],
    },
    // 2023 - Completed meetings
    {
      year: 2023,
      meetings: [
        { type: 'Annual Meeting', monthOffset: -21 },
        { type: 'Special Meeting', monthOffset: -18 },
        { type: 'Other', monthOffset: -15 },
      ],
    },
    // 2022 - Completed meetings
    {
      year: 2022,
      meetings: [
        { type: 'Annual General Meeting', monthOffset: -33 },
        { type: 'Extraordinary General Meeting', monthOffset: -30 },
      ],
    },
  ]

  seedConfig.clients.forEach((client, clientIndex) => {
    meetingsByYear.forEach((yearConfig) => {
      yearConfig.meetings.forEach((meeting, meetingIndex) => {
        // Skip some meetings to create variety
        if (yearConfig.year === 2024 && clientIndex % 2 === 0 && meetingIndex === 2)
          return
        if (yearConfig.year === 2023 && clientIndex % 3 === 0 && meetingIndex === 2)
          return

        // Start with meeting date in the future
        let meetingDateTime = DateTime.now()
          .plus({ months: meeting.monthOffset })
          .plus({ days: (meeting as any).dayOffset || 0 })

        // Work backwards from meeting date following SEC timeline
        let recordDateTime = meetingDateTime.minus({ days: 60 }) // Record Date: 60 days before meeting
        let mailingDateTime = meetingDateTime.minus({ days: 25 }) // Last date to mail: 25 days before meeting
        let preFilingDateTime = meetingDateTime.minus({ days: 105 }) // Initial drafts: 105 days before meeting
        let filingDateTime = meetingDateTime.minus({ days: 40 }) // SEC Filing: 40 days before meeting
        let brokerSearchDateTime = meetingDateTime.minus({ days: 80 }) // Broker search: 80 days before meeting

        // For 2025 meetings (ACTIVE), ensure key dates are in logical sequence
        const today = DateTime.now()
        if (yearConfig.year === 2025) {
          // If broker search date (earliest key date) would be in the past, shift everything forward
          const earliestDate = brokerSearchDateTime
          if (earliestDate <= today) {
            const daysToAdd = today.diff(earliestDate, 'days').days + 14 // Add 2 weeks buffer for realistic timeline

            // Shift all dates forward by the same amount to maintain SEC timeline
            brokerSearchDateTime = brokerSearchDateTime.plus({
              days: daysToAdd,
            })
            preFilingDateTime = preFilingDateTime.plus({ days: daysToAdd })
            filingDateTime = filingDateTime.plus({ days: daysToAdd })
            recordDateTime = recordDateTime.plus({ days: daysToAdd })
            mailingDateTime = mailingDateTime.plus({ days: daysToAdd })
            meetingDateTime = meetingDateTime.plus({ days: daysToAdd })
          }
        }

        // Apply weekend shifting to all key dates
        meetingDateTime = shiftWeekendToMonday(meetingDateTime)
        recordDateTime = shiftWeekendToMonday(recordDateTime)
        mailingDateTime = shiftWeekendToMonday(mailingDateTime)
        preFilingDateTime = shiftWeekendToMonday(preFilingDateTime)
        filingDateTime = shiftWeekendToMonday(filingDateTime)
        brokerSearchDateTime = shiftWeekendToMonday(brokerSearchDateTime)

        const meetingDate = meetingDateTime.toISODate()
        const recordDate = recordDateTime.toISODate()
        const mailingDate = mailingDateTime.toISODate()
        const preFilingDate = preFilingDateTime.toISODate()
        const filingDate = filingDateTime.toISODate()
        const brokerSearchDate = brokerSearchDateTime.toISODate()

        // Generate unique meeting ID with ticker prefix to ensure uniqueness
        const meetingTypeSlug = meeting.type.toLowerCase().replace(/\s+/g, '-')
        const meetingId = `${client.ticker.toLowerCase()}-${meetingTypeSlug}-${yearConfig.year}`
        meetingIds.push(meetingId)
        meetingToClient[meetingId] = client
        meetingToDate[meetingId] = meetingDate // Store the meeting date

        // Determine status and phase
        let status: string
        let currentPhase: number
        let phaseName: string

        if (yearConfig.year === 2025) {
          // 2025 meetings are active - set specific phases per meeting type
          status = 'ACTIVE'
          if (meeting.type === 'Annual Meeting') {
            currentPhase = 1
            phaseName = 'Phase 1'
          } else if (meeting.type === 'Special Meeting') {
            currentPhase = 7
            phaseName = 'Phase 7'
          } else {
            currentPhase = 1 + ((clientIndex + meetingIndex) % 5)
            phaseName = `Phase ${currentPhase}`
          }
        } else {
          // Historical meetings are complete
          currentPhase = 8
          status = 'COMPLETE'
          phaseName = 'Phase 8'
        }

        // Set completion based on meeting type for active meetings
        let overallCompletion: number
        if (yearConfig.year === 2025) {
          if (meeting.type === 'Annual Meeting') {
            overallCompletion = 0 // Phase 1, 0% completion
          } else if (meeting.type === 'Special Meeting') {
            overallCompletion = 85 // Phase 7, 85% completion (near meeting date)
          } else {
            overallCompletion = Math.round(currentPhase * 12.5)
          }
        } else {
          overallCompletion = 100 // Historical meetings are 100% complete
        }

        // Find corresponding account for this client
        const account = seedConfig.accounts.find(
          (acc) => acc.clientTicker === client.ticker
        )
        if (!account) {
          throw new Error(`No account found for client ticker: ${client.ticker}`)
        }

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
        const transferAgent = 'Fidelity'
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
    if (year === 2025) {
      // Active meetings in 2025 - match the meeting generation logic exactly
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
      // Historical meetings are all complete
      currentPhase = 8
    }

    // Calculate meeting date using the SAME logic as tasks
    let baseMeetingDate = DateTime.now()
    if (year === 2025) {
      baseMeetingDate = baseMeetingDate.plus({ months: 6 + meetingIndex })
    } else if (year === 2024) {
      // For 2024 meetings, use dates from mid-2024 (6-9 months ago)
      baseMeetingDate = DateTime.fromObject({
        year: 2024,
        month: 6,
        day: 1,
      }) as DateTime<true>
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
        ? DateTime.fromISO(actualMeetingDateString)
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
      { title: 'DTCC authorization', type: 'Authorization', owner: 'issuer' },
      {
        title: 'Broadridge/ICS Access',
        type: 'Authorization',
        owner: 'issuer',
      },
      {
        title: 'Transfer Agent Registered File Request Form',
        type: 'Document',
        owner: 'issuer',
      },
      { title: 'Plan File Request form', type: 'Document', owner: 'issuer' },
    ],
    3: [
      { title: 'TA Registered File', type: 'File Upload', owner: 'issuer' },
      { title: 'DTCC SPR', type: 'File Upload', owner: 'issuer' },
      { title: 'Plan File(s)', type: 'File Upload', owner: 'issuer' },
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
      { title: 'TA Registered File', type: 'File Upload', owner: 'issuer' },
      { title: 'DTCC SPR', type: 'File Upload', owner: 'issuer' },
      { title: 'Plan File(s)', type: 'File Upload', owner: 'issuer' },
      {
        title: 'Beneficial Count Settlement',
        type: 'Settlement',
        owner: 'issuer',
      },
      {
        title: 'Proxy Stmt → electronic PDF proof',
        type: 'Document',
        owner: 'BetaNXT',
      },
      { title: 'Release to print 10-K', type: 'Release', owner: 'BetaNXT' },
      {
        title: 'Release to print Proxy Statement',
        type: 'Release',
        owner: 'BetaNXT',
      },
      {
        title: 'Final hi-res bookmarked PDFs shared with BetaNXT',
        type: 'Document',
        owner: 'BetaNXT',
      },
      {
        title: 'Approve Enhanced Annual Report/10-K & Proxy',
        type: 'Approval',
        owner: 'BetaNXT',
      },
      {
        title: 'Approve IVR, Document-hosting & eVote sites',
        type: 'Approval',
        owner: 'BetaNXT',
      },
      { title: 'File DEF 14A & DEFA 14A', type: 'Filing', owner: 'BetaNXT' },
      { title: 'File ARS', type: 'Filing', owner: 'BetaNXT' },
      {
        title: 'Deliver SH material (10-K & Proxy Stmt)',
        type: 'Delivery',
        owner: 'BetaNXT',
      },
      { title: 'Provide access to MIC', type: 'Access', owner: 'BetaNXT' },
      {
        title: '2024 FY filing deadline',
        type: 'Deadline',
        owner: 'BetaNXT',
      },
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
        const year = parseInt(meetingId.split('-').slice(-1)[0])
        let taskStatus: string
        if (year === 2025) {
          // 2025 meetings: most tasks incomplete, but special handling for authorization tasks
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
          // Historical meetings: all phases complete (with some authorized)
          if (task.title.includes('DTCC') && task.type === 'Authorization') {
            taskStatus = 'AUTHORIZED'
          } else if (
            task.title.includes('Broadridge/ICS') &&
            task.type === 'Authorization'
          ) {
            taskStatus = 'AUTHORIZED'
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
        taskCounter++
      })
    }
  })

  console.error(`Generated ${taskCounter} tasks for ${meetingIds.length} meetings`)
  sqlStatements.push(
    `-- Generated ${taskCounter} tasks for ${meetingIds.length} meetings`
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
      title: 'Meeting Phase 1 Started',
      message:
        'Phase 1 (Pre-Filing) has begun for your meeting. Please review the upcoming tasks.',
      type: 'info',
      priority: 'medium',
    },
    {
      title: 'Task Due Soon',
      message:
        'You have a task due within the next 2 days. Please review your task list.',
      type: 'warning',
      priority: 'high',
    },
    {
      title: 'Document Review Required',
      message: 'A new document has been uploaded and requires your review.',
      type: 'info',
      priority: 'medium',
    },
    {
      title: 'Filing Deadline Approaching',
      message: 'DEF 14A filing deadline is in 3 days.',
      type: 'warning',
      priority: 'high',
    },
    {
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 11 PM - 1 AM EST.',
      type: 'info',
      priority: 'low',
    },
  ]

  users.forEach((user, userIndex) => {
    // Generate 3-5 notifications per user
    const notificationCount = 3 + (userIndex % 3)

    for (let i = 0; i < notificationCount; i++) {
      const template = notificationTemplates[i % notificationTemplates.length]
      const notificationId = copycat.uuid(`notification-${user.id}-${i}`)
      const isRead = Math.random() > 0.4 // 60% chance of being read
      const createdAt = DateTime.now()
        .minus({ days: Math.floor(Math.random() * 7) })
        .toISO()
      const readAt = isRead
        ? DateTime.fromISO(createdAt)
            .plus({ hours: Math.floor(Math.random() * 48) })
            .toISO()
        : null
      const meetingId = meetingIds[userIndex % meetingIds.length] || null

      sqlStatements.push(
        `INSERT INTO notification(` +
          `id, title, message, type, priority, read, user_id, meeting_id, ` +
          `created_at, read_at) VALUES (` +
          `${sqlValue(notificationId)}, ` +
          `${sqlValue(template.title)}, ` +
          `${sqlValue(template.message)}, ` +
          `${sqlValue(template.type)}, ` +
          `${sqlValue(template.priority)}, ` +
          `${sqlValue(isRead)}, ` +
          `${sqlValue(user.id)}, ` +
          `${sqlValue(meetingId)}, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(readAt)});`
      )
    }
  })

  sqlStatements.push('')

  // Generate documents with all fields
  sqlStatements.push('-- Insert documents')
  const documentTypes = [
    'Proxy Statement',
    'Proxy Card',
    'Annual Report',
    'Voting Instruction Form',
    'Proxy Notice',
    'Affidavit',
    'Agenda',
    'Static Slides',
    'Virtual Annual Meeting Rules of Conduct',
    'Forward Looking Statements',
    'DSMGuest',
  ]
  const documentIds: string[] = []

  meetingIds.forEach((meetingId, index) => {
    const client = meetingToClient[meetingId]
    if (!client) return // Skip if client not found

    // Generate 3-5 documents per meeting
    const numDocs = 3 + (index % 3)
    for (let d = 0; d < numDocs; d++) {
      const documentId = copycat.uuid(`doc-${meetingId}-${d}`)
      documentIds.push(documentId)
      const docType = documentTypes[d % documentTypes.length]
      const docStatus = d === 0 ? 'COMPLETE' : d === 1 ? 'SIGNED' : 'UPLOADED'

      // Link some documents to tasks
      const linkedTaskId =
        d < taskIds.length / meetingIds.length
          ? taskIds[index * Math.floor(taskIds.length / meetingIds.length) + d]
          : null

      const uploadDate = DateTime.now()
        .minus({ days: 30 - d * 5 })
        .toISO()
      const signedDate =
        docStatus === 'SIGNED' || docStatus === 'COMPLETE'
          ? DateTime.now()
              .minus({ days: 20 - d * 5 })
              .toISO()
          : null
      const completedDate =
        docStatus === 'COMPLETE'
          ? DateTime.now()
              .minus({ days: 10 - d * 5 })
              .toISO()
          : null

      sqlStatements.push(
        `INSERT INTO "document"(` +
          `id, meeting_id, task_id, title, description, type, file_path, ` +
          `file_type, file_size, status, upload_date, uploaded_date, ` +
          `signed_date, authorized_date, completed_date, in_progress_date, ` +
          `history, created_at, updated_at) VALUES (` +
          `${sqlValue(documentId)}, ` +
          `${sqlValue(meetingId)}, ` +
          `${sqlValue(linkedTaskId)}, ` +
          `${sqlValue(docType + ' - ' + client.companyName)}, ` +
          `${sqlValue(docType + ' document for ' + client.companyName + ' meeting')}, ` +
          `${sqlValue(docType)}, ` +
          `${sqlValue(
            `/documents/${meetingId}/${docType.toLowerCase().replace(/ /g, '-')}.pdf`
          )}, ` +
          `${sqlValue('application/pdf')}, ` +
          `${1024 * (100 + d * 50)}, ` +
          `${sqlValue(docStatus)}, ` +
          `${sqlValue(uploadDate)}, ` +
          `${sqlValue(uploadDate)}, ` +
          `${sqlValue(signedDate)}, ` +
          `NULL, ` +
          `${sqlValue(completedDate)}, ` +
          `NULL, ` +
          `NULL, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(createdAt)});`
      )
    }
  })

  sqlStatements.push('')

  // Generate proposals with all fields
  sqlStatements.push('-- Insert proposals')
  const proposalIds: string[] = []

  meetingIds.forEach((meetingId, meetingIndex) => {
    const client = meetingToClient[meetingId]
    const isWendys = client?.ticker === 'WEN'

    // Use CSV data for Wendy's meetings, synthetic data for others
    let proposals: any[] = []

    if (isWendys && wendysTabulation.length > 0) {
      // Convert Wendy's tabulation data to proposals
      proposals = wendysTabulation.map((tabData, index) => {
        // Parse proposal number and title
        const proposalMatch = tabData.proposal.match(/^([\d.]+)\s+(.+)$/)
        const proposalNum = proposalMatch ? proposalMatch[1] : String(index + 1)
        const proposalTitle = proposalMatch ? proposalMatch[2] : tabData.proposal

        // Determine proposal type
        let proposalType = 'Other'
        let subtype: string | null = null
        if (proposalTitle.toLowerCase().includes('director')) {
          proposalType = 'Director Election'
          subtype = 'Individual'
        } else if (
          proposalTitle.toLowerCase().includes('deloitte') ||
          proposalTitle.toLowerCase().includes('ratification')
        ) {
          proposalType = 'Auditor Ratification'
        } else if (proposalTitle.toLowerCase().includes('executive comp')) {
          proposalType = 'Say on Pay'
        } else if (proposalTitle.toLowerCase().includes('emissions')) {
          proposalType = 'Shareholder Proposal'
        } else if (proposalTitle.toLowerCase().includes('worker')) {
          proposalType = 'Shareholder Proposal'
        } else if (proposalTitle.toLowerCase().includes('plastics')) {
          proposalType = 'Shareholder Proposal'
        }

        return {
          number: proposalNum,
          title: proposalTitle,
          type: proposalType,
          subtype: subtype,
          recommendation: tabData.mrv.toUpperCase(),
          forVotes: tabData.forVotes,
          againstVotes: tabData.againstVotes,
          abstainVotes: tabData.abstainVotes,
          totalVotes: tabData.totalVotes,
        }
      })
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

    // Add some director elections for the first proposal
    const directors = [
      {
        name: copycat.fullName(meetingId + 'dir1'),
        termYears: 1,
        class: 'I',
        expYear: 2026,
      },
      {
        name: copycat.fullName(meetingId + 'dir2'),
        termYears: 2,
        class: 'II',
        expYear: 2027,
      },
      {
        name: copycat.fullName(meetingId + 'dir3'),
        termYears: 3,
        class: 'III',
        expYear: 2028,
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

        const proposalId = copycat.uuid(
          `proposal-${meetingId}-${parseFloat(proposal.number)}`
        )
        proposalIds.push(proposalId)

        // Extract year from meetingId for results generation
        const meetingYear = meetingId.split('-').slice(-1)[0]
        const results = generateProposalResults(
          proposal.type,
          meetingYear,
          parseFloat(proposal.number),
          proposal.title,
          isWendys
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
            `${parseFloat(proposal.number)}, ` +
            `${sqlValue(proposal.title)}, ` +
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
        const results = generateProposalResults(
          proposal.type,
          meetingYear,
          parseFloat(proposal.number),
          proposal.title,
          isWendys
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
      } else if (!isWendys && propIndex === 0 && proposal.type === 'Director Election') {
        // For non-Wendy's director elections, create individual director proposals
        const meetingYear = meetingId.split('-').slice(-1)[0]

        directors.forEach((director, dirIndex) => {
          const proposalId = copycat.uuid(`proposal-${meetingId}-1${dirIndex}`)
          proposalIds.push(proposalId)

          // Generate results for each director
          const results = generateProposalResults(
            proposal.type,
            meetingYear,
            1 + dirIndex,
            director.name,
            isWendys
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
        const results = generateProposalResults(
          proposal.type,
          meetingYear,
          propIndex + directors.length,
          proposal.title,
          isWendys
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
            `${
              frequencyOptions ? sqlValue(JSON.stringify(frequencyOptions)) : 'NULL'
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

  // Generate positions with all fields matching CSV structure
  sqlStatements.push('-- Insert positions')
  const accountTypes = ['CEDE & CO / CTC & CO', 'Registered Account']
  const sources = ['WEB', 'PRINT', 'IVR']
  const positionIds: string[] = []
  const positionToMeetingMap: Record<string, string> = {}

  meetingIds.forEach((meetingId, meetingIndex) => {
    const client = meetingToClient[meetingId]
    if (!client) {
      console.warn(`No client found for meeting: ${meetingId}`)
      return // Skip if client not found
    }

    const isWendys = client.ticker === 'WEN'

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
    const meetingPhase =
      meetingYear !== '2025'
        ? 8 // Historical meetings are complete
        : isSpecialMeeting
          ? 7 // Special meetings are in Phase 7
          : 1 // Annual meetings are in Phase 1

    if (isWendys && wendysShareholderVotes.length > 0) {
      // Use CSV data for Wendy's positions
      wendysShareholderVotes.forEach((vote, index) => {
        const positionId = copycat.uuid(`position-${meetingId}-${index}`)
        positionIds.push(positionId)
        positionToMeetingMap[positionId] = meetingId

        // For Phase 1-5, override vote status to Unvoted
        let voteStatus = vote.voteStatus
        let sharesVoted = vote.sharesVoted
        let source = vote.source === 'PRI' ? 'PRINT' : vote.source // Map PRI to PRINT for enum compatibility
        let dateVoted = vote.dateVoted

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
            `${sqlValue(vote.cusip)}, ` +
            `${sqlValue(vote.accountType)}, ` +
            `${sqlValue(vote.setKey)}, ` +
            `${sqlValue(vote.name)}, ` +
            `${vote.accountNumber ? sqlValue(vote.accountNumber) : 'NULL'}, ` +
            `${sqlValue(voteStatus)}, ` +
            `${sqlValue('CTRL' + String(index + 1).padStart(6, '0'))}, ` +
            `${vote.shares.toFixed(6)}, ` +
            `${sharesVoted.toFixed(6)}, ` +
            `${sqlValue(source)}, ` +
            `${sqlValue(dateVoted)}, ` +
            `${sqlValue(createdAt)}, ` +
            `${sqlValue(createdAt)});`
        )
      })
    } else {
      // For non-Wendy's, use synthetic data
      // Generate a large CEDE & CO position first (like in the CSV)
      const cedePositionId = copycat.uuid(`position-${meetingId}-cede`)
      positionIds.push(cedePositionId)
      positionToMeetingMap[cedePositionId] = meetingId

      // Total shares for the company
      const totalSharesOutstanding = Number(account.totalSharesOutstanding)
      const cedeShares = Math.floor(totalSharesOutstanding * 0.75) // CEDE typically holds majority

      // Only allow voting if meeting is in Phase 6 or later (when tabulation begins)
      const cedeIsVoted =
        meetingPhase >= 6
          ? meetingYear !== '2025'
            ? Math.random() < 0.65 // Historical: 65% voted
            : Math.random() < 0.8 // Phase 6+: 80% voted
          : false // Phase 1-5: No votes yet
      const cedeVoteStatus = cedeIsVoted ? 'Voted' : 'Unvoted'
      const cedeSharesVoted = cedeIsVoted ? cedeShares : 0
      const cedeSource = cedeIsVoted ? 'WEB' : null
      const cedeDateVoted = cedeIsVoted
        ? DateTime.now()
            .minus({ days: Math.floor(Math.random() * 30) })
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
          `${sqlValue('CEDE & CO / CTC & CO')}, ` +
          `${sqlValue(client.ticker + 'J' + meetingYear)}, ` +
          `${sqlValue('CEDE & CO')}, ` +
          `NULL, ` +
          `${sqlValue(cedeVoteStatus)}, ` +
          `${sqlValue('CEDE001')}, ` +
          `${cedeShares.toFixed(6)}, ` +
          `${cedeSharesVoted.toFixed(6)}, ` +
          `${sqlValue(cedeSource)}, ` +
          `${sqlValue(cedeDateVoted)}, ` +
          `${sqlValue(createdAt)}, ` +
          `${sqlValue(createdAt)});`
      )

      // Generate synthetic registered positions for non-Wendy's
      const numPositions = 100 + meetingIndex * 50 + Math.floor(Math.random() * 200)
      const remainingShares = totalSharesOutstanding - cedeShares

      // Pre-calculate shares to ensure they total exactly remainingShares
      const positionShares: number[] = []
      let allocatedShares = 0

      // Allocate shares with realistic distribution
      for (let p = 0; p < numPositions; p++) {
        let shares: number
        if (p === 0) {
          shares = Math.floor(remainingShares * 0.15) // Largest holder gets 15%
        } else if (p < 10) {
          shares = Math.floor(remainingShares * 0.01) // Top 10 get 1% each
        } else if (p < 100) {
          shares = Math.floor(remainingShares * 0.001) // Mid-tier: 0.1% each
        } else {
          shares = Math.floor(remainingShares * 0.0001) + 1 // Small holders
        }
        positionShares.push(shares)
        allocatedShares += shares
      }

      // Adjust the largest position to exactly match remainingShares
      const difference = remainingShares - allocatedShares
      positionShares[0] += difference

      for (let p = 0; p < numPositions; p++) {
        const positionId = copycat.uuid(`position-${meetingId}-${p}`)
        positionIds.push(positionId)
        positionToMeetingMap[positionId] = meetingId

        // Only allow voting if meeting is in Phase 6 or later (when tabulation begins)
        const isVoted =
          meetingPhase >= 6
            ? meetingYear !== '2025'
              ? Math.random() < 0.65 // Historical: 65% voted
              : Math.random() < 0.8 // Phase 6+: 80% voted
            : false // Phase 1-5: No votes yet, tabulation hasn't started
        const voteStatus = isVoted ? 'Voted' : 'Unvoted'

        // Use pre-calculated shares
        const shares = positionShares[p]

        const sharesVoted = isVoted ? shares : 0
        const sources = ['WEB', 'PRINT', 'IVR']
        const source = isVoted ? sources[p % sources.length] : null
        const controlNumber = `${String(p + 1).padStart(8, '0')}`

        const dateVoted = isVoted
          ? DateTime.now()
              .minus({ days: Math.floor(Math.random() * 30) })
              .toFormat('MM/dd/yyyy hh:mma')
              .toUpperCase()
          : null

        // Generate realistic names with more variety
        const institutionalNames = [
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

        const individualNames = [
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

        let holderName: string
        if (p < institutionalNames.length) {
          holderName = institutionalNames[p]
        } else if (p < institutionalNames.length + individualNames.length) {
          holderName = individualNames[p - institutionalNames.length]
        } else {
          // Generate unique names using copycat for consistency
          const isInstitutional = Math.random() < 0.3
          if (isInstitutional) {
            const companyTypes = ['INC', 'CORP', 'LLC', 'LP', 'TRUST', 'FUND']
            const baseCompany = copycat.word(`company-${meetingId}-${p}`)
            holderName = `${baseCompany.toUpperCase()} CAPITAL ${companyTypes[p % companyTypes.length]}`
          } else {
            const firstName = copycat.firstName(`person-${meetingId}-${p}`)
            const lastName = copycat.lastName(`person-${meetingId}-${p}`)
            const suffixes = ['', ' JR', ' SR', ' III', ' TR', ' TTEE', ' & ASSOC']
            holderName = `${firstName.toUpperCase()} ${lastName.toUpperCase()}${suffixes[p % suffixes.length]}`
          }
        }

        sqlStatements.push(
          `INSERT INTO "position"(` +
            `id, meeting_id, cusip, account_type, set_key, name, account_number, ` +
            `vote_status, control_number, shares, shares_voted, source, date_voted, ` +
            `created_at, updated_at) VALUES (` +
            `${sqlValue(positionId)}, ` +
            `${sqlValue(meetingId)}, ` +
            `${sqlValue(account.cusip)}, ` +
            `${sqlValue('Registered Account')}, ` +
            `${sqlValue(client.ticker + 'J' + meetingYear)}, ` +
            `${sqlValue(holderName)}, ` +
            `${Math.random() < 0.2 ? 'NULL' : sqlValue('ACC' + String(p).padStart(6, '0'))}, ` +
            `${sqlValue(voteStatus)}, ` +
            `${sqlValue(controlNumber)}, ` +
            `${shares.toFixed(6)}, ` +
            `${sharesVoted.toFixed(6)}, ` +
            `${sqlValue(source)}, ` +
            `${sqlValue(dateVoted)}, ` +
            `${sqlValue(createdAt)}, ` +
            `${sqlValue(createdAt)});`
        )
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

  // Track position votes generated
  let totalVotes = 0
  let positionIndex = 0

  // Create a map to track meeting phases
  const meetingPhases: Record<string, number> = {}
  meetingIds.forEach((meetingId) => {
    const year = parseInt(meetingId.split('-').slice(-1)[0])
    if (year === 2025) {
      if (meetingId.includes('annual')) {
        meetingPhases[meetingId] = 1 // Annual meetings in phase 1
      } else if (meetingId.includes('special')) {
        meetingPhases[meetingId] = 7 // Special meetings in phase 7
      } else {
        meetingPhases[meetingId] = 1 // Default to phase 1
      }
    } else {
      meetingPhases[meetingId] = 8 // Historical meetings are complete
    }
  })

  // Generate position votes for positions belonging to meetings in phase 6+
  positionIds.forEach((positionId) => {
    const meetingId = positionToMeetingMap[positionId]
    if (!meetingId) return // Skip if no meeting mapping found

    const meetingProposals = meetingToProposalsMap[meetingId] || []
    const meetingPhase = meetingPhases[meetingId] || 1

    // Only create votes for meetings in phase 6 or later (tabulation phase)
    // Phase 6 is when tabulation begins and votes start coming in
    if (meetingPhase >= 6) {
      // Only create votes for positions that have voted (65% as per positions logic)
      const hasVoted = Math.random() < 0.65
      if (hasVoted && meetingProposals.length > 0) {
        meetingProposals.forEach((proposalId) => {
          if (!proposalId) return // Skip undefined proposals

          const voteId = copycat.uuid(`vote-${totalVotes}-${positionId.substring(0, 8)}`)

          // Determine vote based on proposal number and type
          let vote: string
          if (proposalId.includes('1')) {
            // Director elections (proposals 1-3) - mostly FOR
            vote = Math.random() < 0.85 ? 'FOR' : 'WITHHOLD'
          } else {
            // Other proposals - more varied voting
            const rand = Math.random()
            if (rand < 0.7) vote = 'FOR'
            else if (rand < 0.85) vote = 'AGAINST'
            else vote = 'ABSTAIN'
          }

          // Generate realistic share amounts for voting
          const baseShares = 500 + Math.floor(Math.random() * 10000)
          const sharesVoting = Math.max(100, baseShares)

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
      }
    }
  })

  sqlStatements.push(
    `-- Generated ${totalVotes} position votes for ${positionIds.length} positions`
  )

  sqlStatements.push('')

  // Generate comments for some documents
  sqlStatements.push('-- Insert comments')
  documentIds.slice(0, 10).forEach((documentId, index) => {
    const numComments = 1 + (index % 3)
    for (let c = 0; c < numComments; c++) {
      const userId = userIds[index % userIds.length]
      const user =
        seedConfig.users.issuerUsers[index % seedConfig.users.issuerUsers.length]

      sqlStatements.push(
        `INSERT INTO "comment"(` +
          `document_id, user_id, comment, first_name, last_name, created_at) VALUES (` +
          `${sqlValue(documentId)}, ` +
          `${sqlValue(userId)}, ` +
          `${sqlValue('Review comment ' + (c + 1) + ' for this document.')}, ` +
          `${sqlValue(user.firstName)}, ` +
          `${sqlValue(user.lastName)}, ` +
          `${sqlValue(DateTime.now().minus({ days: c }).toISO())});`
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

  // Update client table with related accounts and meetings JSON data
  sqlStatements.push('-- Update clients with related accounts and meetings')

  seedConfig.clients.forEach((client) => {
    const clientId = clientIds[client.ticker]

    // Find all accounts for this client
    const clientAccounts = seedConfig.accounts
      .filter((acc) => acc.clientTicker === client.ticker)
      .map((acc) => {
        const accountId = companyAccountIds[seedConfig.accounts.indexOf(acc)]
        return {
          id: accountId,
          name: acc.accountName,
          primary_contact: acc.primaryContact,
        }
      })

    // Find all meetings for this client
    const clientMeetings = meetingIds
      .filter((meetingId) => meetingToClient[meetingId]?.ticker === client.ticker)
      .map((meetingId) => {
        const meetingClient = meetingToClient[meetingId]
        const year = parseInt(meetingId.split('-').slice(-1)[0])
        const meetingType = meetingId.includes('annual')
          ? 'Annual Meeting'
          : meetingId.includes('special')
            ? 'Special Meeting'
            : 'Other'

        return {
          id: meetingId,
          title: meetingType,
          year: year,
          status: year === 2025 ? 'ACTIVE' : 'COMPLETE',
        }
      })

    // Update client with JSON data
    sqlStatements.push(
      `UPDATE client SET ` +
        `accounts = ${sqlValue(JSON.stringify(clientAccounts))}, ` +
        `meetings = ${sqlValue(JSON.stringify(clientMeetings))} ` +
        `WHERE id = ${sqlValue(clientId)};`
    )
  })

  sqlStatements.push('')

  // Output all SQL statements
  console.log(sqlStatements.join('\n'))
}

// Execute seed generation
main()
