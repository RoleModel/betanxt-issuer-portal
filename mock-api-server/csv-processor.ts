import { copycat } from '@snaplet/copycat'
import csvParser from 'csv-parser'
import { createReadStream } from 'fs'

type CsvRow = Record<string, string>

const isObject = (val: unknown): val is Record<string, unknown> =>
  typeof val === 'object' && val !== null

const isPositionRow = (row: unknown): row is CsvRow => {
  if (!isObject(row)) return false
  // minimally ensure expected keys exist as strings (or can be coerced)
  const keys = ['Cusip', 'Account Type', 'Set Key', 'Name', 'Shares', 'Shares Voted']
  return keys.every((k) => k in row)
}

const isTabulationRow = (row: unknown): row is CsvRow => {
  if (!isObject(row)) return false
  const keys = ['Proposal', 'MRV', 'For', 'Against', 'Abstain', 'Total']
  return keys.every((k) => k in row)
}

export interface WendysPositionData {
  cusip: string
  accountType: string
  setKey: string
  name: string
  accountNumber: string | null
  voteStatus: string
  shares: number
  sharesVoted: number
  source: string | null
  dateVoted: Date | null
}

export interface WendysTabulationData {
  proposal: string
  mrv: string
  for: number
  against: number
  abstain: number
  total: number
}

export interface CompanyMeetingInfo {
  company: string
  cusip: string
  meetingType: string
  recordDate: string
  meetingDate: string
  cutoffDate?: string
}

export interface CompanyProposalData {
  proposalNumber: string
  proposalTitle: string
  managementRecommendation: string
  votesFor: number
  votesAgainst: number
  votesAbstain: number
}

export interface CompanyPositionData {
  cusip: string
  accountType: string
  name: string
  accountNumber: string | null
  voteStatus: 'Voted' | 'Unvoted'
  shares: number
  sharesVoted: number
  source: string | null
  dateVoted: Date | null
  voteMethod?: string
  controlNumber?: string
}

export class CSVProcessor {
  /**
   * Process Wendy's shareholder votes CSV data
   */
  static async processWendysVotes(filePath: string): Promise<WendysPositionData[]> {
    const positions: WendysPositionData[] = []

    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csvParser({ headers: true }))
        .on('data', (row: unknown) => {
          try {
            if (!isPositionRow(row)) {
              return
            }
            positions.push({
              cusip: row.Cusip || '',
              accountType: row['Account Type'] || '',
              setKey: row['Set Key'] || '',
              name: row.Name || '',
              accountNumber: row['Account #'] || null,
              voteStatus: row['Vote Status'] || 'Unvoted',
              shares: this.parseNumber(row.Shares),
              sharesVoted: this.parseNumber(row['Shares Voted']),
              source: row.Source || null,
              dateVoted: this.parseDate(row['Date Voted']),
            })
          } catch (error) {
          }
        })
        .on('end', () => {
          resolve(positions)
        })
        .on('error', reject)
    })
  }

  /**
   * Process Wendy's tabulation data CSV
   */
  static async processWendysTabulation(
    filePath: string
  ): Promise<WendysTabulationData[]> {
    const tabulation: WendysTabulationData[] = []

    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csvParser({ headers: true }))
        .on('data', (row: unknown) => {
          try {
            if (!isTabulationRow(row)) {
              return
            }
            tabulation.push({
              proposal: row.Proposal || '',
              mrv: row.MRV || '',
              for: this.parseNumber(row.For),
              against: this.parseNumber(row.Against),
              abstain: this.parseNumber(row.Abstain),
              total: this.parseNumber(row.Total),
            })
          } catch (error) {
          }
        })
        .on('end', () => {
          resolve(tabulation)
        })
        .on('error', reject)
    })
  }

  /**
   * Generate realistic position data for other companies based on Wendy's patterns
   */
  static generateCompanyPositions(
    company: { ticker: string; cusip: string; totalSharesOutstanding: number },
    wendysPattern: WendysPositionData[],
    targetCount: number = 2500
  ): Omit<WendysPositionData, 'cusip' | 'setKey'>[] {
    const positions: Omit<WendysPositionData, 'cusip' | 'setKey'>[] = []

    // Calculate scaling factor based on shares outstanding
    const wendysTotal = 176618508 // From CSV data
    const scaleFactor = company.totalSharesOutstanding / wendysTotal

    // Sample positions from Wendy's pattern and scale
    for (let i = 0; i < targetCount; i++) {
      const sampleIndex = i % wendysPattern.length
      const sample = wendysPattern[sampleIndex]

      const scaledShares = Math.floor(sample.shares * scaleFactor)
      const scaledVoted = Math.floor(sample.sharesVoted * scaleFactor)

      positions.push({
        accountType: sample.accountType,
        name: copycat.fullName(`${company.ticker}-position-${i}`),
        accountNumber: copycat
          .int(`${company.ticker}-account-${i}`, { min: 100000, max: 999999 })
          .toString(),
        voteStatus: copycat.oneOf(`${company.ticker}-vote-status-${i}`, [
          'Voted',
          'Unvoted',
        ]),
        shares: scaledShares,
        sharesVoted: scaledVoted,
        source: sample.source,
        dateVoted: sample.dateVoted,
      })
    }

    return positions
  }

  /**
   * Parse number from CSV string (handles commas and empty values)
   */
  private static parseNumber(value: string): number {
    if (!value || value.trim() === '') return 0
    const cleaned = value.replace(/,/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  /**
   * Parse date from CSV string
   */
  private static parseDate(value: string): Date | null {
    if (!value || value.trim() === '') return null
    try {
      return new Date(value)
    } catch {
      return null
    }
  }

  /**
   * Process company meeting info CSV
   */
  static async processCompanyMeetingInfo(filePath: string): Promise<CompanyMeetingInfo | null> {
    return new Promise((resolve, reject) => {
      let meetingInfo: CompanyMeetingInfo | null = null
      let isFirstRow = true

      createReadStream(filePath)
        .pipe(csvParser({ headers: true }))
        .on('data', (row: Record<string, string>) => {
          if (isFirstRow) {
            meetingInfo = {
              company: row['Company'] || row['Issuer'] || '',
              cusip: row['CUSIP'] || row['Cusip'] || '',
              meetingType: row['Meeting Type'] || 'Annual Meeting',
              recordDate: row['Record Date'] || '',
              meetingDate: row['Meeting Date'] || '',
              cutoffDate: row['Cutoff Date'] || row['Cut Off Date'] || undefined
            }
            isFirstRow = false
          }
        })
        .on('end', () => {
          resolve(meetingInfo)
        })
        .on('error', reject)
    })
  }

  /**
   * Process company proposal CSV
   */
  static async processCompanyProposals(filePath: string): Promise<CompanyProposalData[]> {
    const proposals: CompanyProposalData[] = []

    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csvParser({ headers: true }))
        .on('data', (row: Record<string, string>) => {
          proposals.push({
            proposalNumber: row['Proposal Number'] || row['Prop'] || '',
            proposalTitle: row['Proposal Title'] || row['Proposal'] || row['Description'] || '',
            managementRecommendation: row['MRV'] || row['Management Recommendation'] || 'For',
            votesFor: this.parseNumber(row['For'] || row['Votes For'] || '0'),
            votesAgainst: this.parseNumber(row['Against'] || row['Votes Against'] || '0'),
            votesAbstain: this.parseNumber(row['Abstain'] || row['Abstentions'] || row['Votes Abstain'] || '0')
          })
        })
        .on('end', () => {
          resolve(proposals)
        })
        .on('error', reject)
    })
  }

  /**
   * Process generic company position data CSV
   */
  static async processCompanyPositions(
    filePath: string,
    cusip: string,
    limit?: number
  ): Promise<CompanyPositionData[]> {
    const positions: CompanyPositionData[] = []
    let rowCount = 0

    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csvParser({ headers: true }))
        .on('data', (row: Record<string, string>) => {
          if (limit && rowCount >= limit) return

          // Skip if no shares
          const shares = this.parseNumber(row['Shares'] || row['Share Count'] || row['Holdings'] || '0')
          if (shares === 0) return

          positions.push({
            cusip: cusip,
            accountType: row['Account Type'] || row['Type'] || 'Registered Account',
            name: row['Account'] || row['Account Name'] || row['Name'] || row['Shareholder'] || 'Unknown',
            accountNumber: row['Account#'] || row['Account Number'] || row['Account'] || null,
            voteStatus: (row['Status'] || row['Vote Status'] || 'Unvoted') as 'Voted' | 'Unvoted',
            shares: shares,
            sharesVoted: this.parseNumber(row['Shares Voted'] || row['Voted Shares'] || '0'),
            source: row['Source'] || row['Vote Method'] || null,
            dateVoted: this.parseDate(row['Time Stamp'] || row['Vote Date'] || row['Voted Date'] || ''),
            voteMethod: row['Vote Method'] || row['Method'] || row['Source'] || undefined,
            controlNumber: row['Control Number'] || row['Control'] || undefined
          })
          rowCount++
        })
        .on('end', () => {
          resolve(positions)
        })
        .on('error', reject)
    })
  }
}
