import * as XLSX from 'xlsx'

interface Position {
  cusip: string
  accountType: string
  setKey: string
  name: string
  accountNumber: string
  voteStatus: string
  controlNumber: string
  shares: number
  sharesVoted: number
  source: string
  dateVoted: string | null
  sentBy: string | null
}

interface ExportOptions {
  positions: Position[]
  meetingTitle: string
  clientTicker?: string
}

function formatDateYMD(date: string | null): string {
  if (!date) return ''
  try {
    let dateStr = date
    if (date.includes(' 12:00AM')) {
      dateStr = date.replace(' 12:00AM', '')
    }
    const parsed = new Date(dateStr)
    if (isNaN(parsed.getTime())) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10)
        const day = parseInt(parts[1], 10)
        const year = parseInt(parts[2], 10)
        const alt = new Date(year, month - 1, day)
        if (!isNaN(alt.getTime())) {
          const y = alt.getFullYear()
          const m = String(alt.getMonth() + 1).padStart(2, '0')
          const d = String(alt.getDate()).padStart(2, '0')
          return `${y}-${m}-${d}`
        }
      }
      return ''
    }
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  } catch {
    return ''
  }
}

export function exportPositionsToXlsx(options: ExportOptions): void {
  const { positions, meetingTitle } = options

  const today = new Date()
  const yyyymmdd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const meetingId = meetingTitle.toLowerCase().replace(/\s+/g, '_')
  const filename = `positions-${meetingId}-${yyyymmdd}.xlsx`

  const header = [
    'Name',
    'Account Type',
    'CUSIP',
    'Set Key',
    'Account #',
    'Control #',
    'Shares',
    'Shares Voted',
    'Vote Status',
    'Source',
    'Date Voted',
    'Sent By',
  ]

  const rows = positions.map((p) => [
    p.name,
    p.accountType,
    p.cusip,
    p.setKey,
    p.accountNumber,
    p.controlNumber,
    p.shares,
    p.sharesVoted,
    p.voteStatus,
    p.source,
    formatDateYMD(p.dateVoted),
    p.sentBy ? 'Email' : 'Mail',
  ])

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])

  ws['!cols'] = [
    { wch: 30 }, // Name
    { wch: 16 }, // Account Type
    { wch: 14 }, // CUSIP
    { wch: 10 }, // Set Key
    { wch: 18 }, // Account #
    { wch: 16 }, // Control #
    { wch: 14 }, // Shares
    { wch: 14 }, // Shares Voted
    { wch: 14 }, // Vote Status
    { wch: 14 }, // Source
    { wch: 14 }, // Date Voted
    { wch: 10 }, // Sent By
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Positions')
  XLSX.writeFile(wb, filename)
}
