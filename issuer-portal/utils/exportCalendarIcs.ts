import { shiftWeekendToMonday } from '@/components/Calendar/CalendarUtils'

import type { KeyDate, Task } from '@/types/api-exports'

interface IcsExportOptions {
  tasks: Task[]
  keyDates: KeyDate[]
  meetingTitle: string
  meetingId?: string
}

// Format date for ICS (YYYYMMDDTHHMMSS format in UTC)
const formatIcsDate = (dateStr: string | null): string => {
  if (!dateStr) return ''

  const [year, month, day] = dateStr.split('-').map(Number)
  const originalDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)) // Set to noon UTC
  const adjustedDate = shiftWeekendToMonday(originalDate)

  const yyyy = adjustedDate.getUTCFullYear()
  const mm = String(adjustedDate.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(adjustedDate.getUTCDate()).padStart(2, '0')

  return `${yyyy}${mm}${dd}T120000Z`
}

// Get current timestamp in ICS format
const getCurrentIcsTimestamp = (): string => {
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const min = String(now.getUTCMinutes()).padStart(2, '0')
  const ss = String(now.getUTCSeconds()).padStart(2, '0')

  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`
}

// Escape special characters in ICS text fields
const escapeIcsText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// Generate a unique UID for calendar events
const generateUid = (prefix: string, id: string): string => {
  return `${prefix}-${id}@betanxt-issuer-portal`
}

export async function exportCalendarToIcs(options: IcsExportOptions): Promise<void> {
  const { tasks, keyDates, meetingTitle, meetingId = 'meeting' } = options

  const now = getCurrentIcsTimestamp()
  const lines: string[] = []

  // ICS header
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//BetaNXT//Issuer Portal//EN')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:PUBLISH')
  lines.push(`X-WR-CALNAME:${escapeIcsText(meetingTitle)}`)
  lines.push('X-WR-TIMEZONE:UTC')

  // Add key dates as events
  keyDates.forEach((keyDate) => {
    if (!keyDate.date || !keyDate.title) return

    const dtstart = formatIcsDate(keyDate.date)
    if (!dtstart) return

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${generateUid('keydate', keyDate.id || String(Math.random()))}`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART;VALUE=DATE:${dtstart.split('T')[0]}`)
    lines.push(`SUMMARY:${escapeIcsText(keyDate.title)}`)
    lines.push('CATEGORIES:Key Date')
    lines.push(`X-MEETING-PHASE:${keyDate.phaseNumber || 1}`)
    lines.push('STATUS:CONFIRMED')
    lines.push('TRANSP:TRANSPARENT')
    lines.push('END:VEVENT')
  })

  // Add tasks as events
  tasks.forEach((task) => {
    if (!task.dueDate || !task.title) return

    const dtstart = formatIcsDate(task.dueDate)
    if (!dtstart) return

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${generateUid('task', task.id || String(Math.random()))}`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART;VALUE=DATE:${dtstart.split('T')[0]}`)
    lines.push(`SUMMARY:${escapeIcsText(task.title)}`)
    if (task.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(task.description)}`)
    }
    lines.push('CATEGORIES:Task')
    if (task.owner) {
      lines.push(`X-TASK-OWNER:${escapeIcsText(task.owner)}`)
    }
    if (task.status) {
      lines.push(`X-TASK-STATUS:${task.status}`)
    }
    lines.push(`X-MEETING-PHASE:${task.phaseNumber || 1}`)
    lines.push('STATUS:CONFIRMED')
    lines.push('TRANSP:TRANSPARENT')
    lines.push('END:VEVENT')
  })

  // ICS footer
  lines.push('END:VCALENDAR')

  // Join all lines with CRLF (required by ICS spec)
  const icsContent = lines.join('\r\n')

  // Create blob and download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${meetingTitle.replace(/\s+/g, '_')}_Calendar_${new Date().toISOString().split('T')[0]}.ics`

  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Cleanup
  URL.revokeObjectURL(url)
}
