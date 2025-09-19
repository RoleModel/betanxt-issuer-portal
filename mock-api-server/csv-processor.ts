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
              console.warn('Skipping invalid row (shape mismatch)')
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
            console.warn(`Skipping invalid row:`, row, error)
          }
        })
        .on('end', () => {
          console.log(`✅ Processed ${positions.length} positions from Wendy's CSV`)
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
              console.warn('Skipping invalid tabulation row (shape mismatch)')
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
            console.warn(`Skipping invalid tabulation row:`, row, error)
          }
        })
        .on('end', () => {
          console.log(
            `✅ Processed ${tabulation.length} proposals from Wendy's tabulation`
          )
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
}
