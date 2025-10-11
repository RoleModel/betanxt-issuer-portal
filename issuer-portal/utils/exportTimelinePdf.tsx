import {
  Document,
  Font,
  Image as PDFImage,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer'
import React from 'react'

import { shiftWeekendToMonday } from '@/components/Calendar/CalendarUtils'

import type { KeyDate, Task } from '@/types/api-exports'

// Register Roboto font
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-300-normal.woff',
      fontWeight: 300,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.woff',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-500-normal.woff',
      fontWeight: 500,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-700-normal.woff',
      fontWeight: 700,
    },
  ],
})

interface CombinedItem {
  type: 'task' | 'keyDate'
  item: Task | KeyDate
  date: Date
  displayDate: string
}

interface ExportOptions {
  tasks: Task[]
  keyDates: KeyDate[]
  meetingTitle: string
  selectedPhase?: number | 'all'
  clientTicker?: string
}

// Phase colors (matching theme.palette.phase)
const phaseColors = [
  '#00838f', // cyan[800]
  '#00695c', // teal[800]
  '#7b1fa2', // purple[700]
  '#0288d1', // lightBlue[700]
  '#880e4f', // pink[900]
  '#1565c0', // blue[800]
  '#2e7d32', // green[800]
  '#4527a0', // deepPurple[800]
  '#616161', // grey[700]
]

// Helper to convert hex to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgb(${r}, ${g}, ${b})`
  }
  return 'rgb(0, 0, 0)'
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  betanxtLogo: {
    width: 86,
    height: 18.6,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
    fontFamily: 'Roboto',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
    fontFamily: 'Roboto',
  },
  phaseSection: {
    marginBottom: 15,
  },
  phaseHeader: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 5,
    fontFamily: 'Roboto',
  },
  table: {
    flexDirection: 'column',
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 24,
    alignItems: 'center',
  },
  keyDateRow: {
    backgroundColor: 'rgba(204, 229, 255, 0.5)',
    borderLeftWidth: 3,
    borderLeftColor: '#016397',
    paddingLeft: 8,
  },
  taskRow: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
    paddingLeft: 8,
  },
  taskCell: {
    flex: 1,
    fontSize: 10,
    paddingVertical: 4,
    paddingRight: 8,
    fontFamily: 'Roboto',
  },
  dateCell: {
    width: 80,
    fontSize: 10,
    textAlign: 'right',
    paddingVertical: 4,
    paddingRight: 8,
    fontFamily: 'Roboto',
  },
  boldText: {
    fontWeight: 700,
  },
  fallbackLogo: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'Roboto',
  },
  betanxtText: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0D6580',
    fontFamily: 'Roboto',
  },
})

// Helper function to parse date strings
const parseDateString = (dateStr: string): Date => {
  const cleanDateStr = dateStr.replace(/^[A-Za-z]+,\s*/, '')
  const currentYear = new Date().getFullYear()
  return new Date(`${cleanDateStr}, ${currentYear}`)
}

// Format date for display
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return ''

  const [year, month, day] = dateStr.split('-').map(Number)
  const originalDate = new Date(Date.UTC(year, month - 1, day))
  const adjustedDate = shiftWeekendToMonday(originalDate)

  return adjustedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// Format date to match Figma style (e.g., "Jun 18", "Jul 29")
function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return 'TBD'

  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    const adjustedDate = shiftWeekendToMonday(date)

    return adjustedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  } catch {
    return 'TBD'
  }
}

interface TimelinePDFDocumentProps {
  tasks: Task[]
  keyDates: KeyDate[]
  meetingTitle: string
  selectedPhase?: number | 'all'
  clientTicker?: string
  clientLogoUrl?: string
  betanxtLogoUrl?: string
}

// Timeline PDF Document Component
const TimelinePDFDocument = ({
  tasks,
  keyDates,
  meetingTitle,
  selectedPhase = 'all',
  clientTicker,
  clientLogoUrl,
  betanxtLogoUrl,
}: TimelinePDFDocumentProps) => {
  // Filter and sort data
  let filteredTasks = tasks
  let filteredKeyDates = keyDates

  if (selectedPhase !== 'all' && typeof selectedPhase === 'number') {
    filteredTasks = tasks.filter((t) => t.phaseNumber === selectedPhase)
    filteredKeyDates = keyDates.filter((k) => k.phaseNumber === selectedPhase)
  }

  // Combine and sort items chronologically
  const combinedItems: CombinedItem[] = []

  // Add tasks
  filteredTasks.forEach((task) => {
    if (task.dueDate) {
      const displayDate = formatDate(task.dueDate)
      combinedItems.push({
        type: 'task',
        item: task,
        date: parseDateString(displayDate),
        displayDate,
      })
    }
  })

  // Add key dates
  filteredKeyDates.forEach((keyDate) => {
    if (keyDate.date) {
      const displayDate = formatDate(keyDate.date)
      combinedItems.push({
        type: 'keyDate',
        item: keyDate,
        date: parseDateString(displayDate),
        displayDate,
      })
    }
  })

  // Sort chronologically
  combinedItems.sort((a, b) => {
    const dateComparison = a.date.getTime() - b.date.getTime()
    if (dateComparison !== 0) return dateComparison
    // Key dates before tasks on same date
    if (a.type === 'keyDate' && b.type === 'task') return -1
    if (a.type === 'task' && b.type === 'keyDate') return 1
    return 0
  })

  // Group by phases
  const phaseGroups = new Map<number, CombinedItem[]>()

  if (selectedPhase === 'all') {
    combinedItems.forEach((item) => {
      let phase = 1
      if (item.type === 'task') {
        const task = item.item as Task
        phase = task.phaseNumber || 1
      } else {
        const keyDate = item.item as KeyDate
        phase = keyDate.phaseNumber || 1
      }

      if (!phaseGroups.has(phase)) {
        phaseGroups.set(phase, [])
      }
      phaseGroups.get(phase)!.push(item)
    })
  } else if (typeof selectedPhase === 'number') {
    phaseGroups.set(selectedPhase, combinedItems)
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header with logos */}
        <View style={styles.header}>
          <View>
            {clientLogoUrl ? (
              <PDFImage style={styles.logo} src={clientLogoUrl} />
            ) : (
              <Text style={styles.fallbackLogo}>
                {clientTicker ? `${clientTicker} Logo` : 'Client Logo'}
              </Text>
            )}
          </View>
          <View>
            {betanxtLogoUrl ? (
              <PDFImage style={styles.betanxtLogo} src={betanxtLogoUrl} />
            ) : (
              <Text style={styles.betanxtText}>BetaNXT</Text>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Meeting Schedule</Text>
        <Text style={styles.subtitle}>{meetingTitle}</Text>

        {/* Phase Tables */}
        {Array.from({ length: 8 }, (_, i) => i + 1).map((phase) => {
          const items = phaseGroups.get(phase) || []
          if (items.length === 0) return null

          const phaseColor = hexToRgb(phaseColors[phase - 1])

          return (
            <View key={phase} style={styles.phaseSection} wrap={false}>
              <Text style={[styles.phaseHeader, { color: phaseColor }]}>
                Phase {phase}
              </Text>
              <View style={styles.table}>
                {items.map((item, index) => {
                  if (item.type === 'keyDate') {
                    const keyDate = item.item as KeyDate
                    return (
                      <View
                        key={`kd-${phase}-${index}`}
                        style={[styles.tableRow, styles.keyDateRow]}
                      >
                        <Text style={[styles.taskCell, styles.boldText]}>
                          {keyDate.title ?? 'Untitled Key Date'}
                        </Text>
                        <Text style={[styles.dateCell, styles.boldText]}>
                          {item.displayDate}
                        </Text>
                      </View>
                    )
                  } else {
                    const task = item.item as Task
                    const taskPhaseColor = hexToRgb(
                      phaseColors[(task.phaseNumber || 1) - 1]
                    )
                    return (
                      <View
                        key={`t-${phase}-${index}`}
                        style={[
                          styles.tableRow,
                          styles.taskRow,
                          { borderLeftColor: taskPhaseColor },
                        ]}
                      >
                        <Text style={styles.taskCell}>
                          {task.title ?? 'Untitled Task'}
                        </Text>
                        <Text style={styles.dateCell}>
                          {formatDateShort(task.dueDate || null)}
                        </Text>
                      </View>
                    )
                  }
                })}
              </View>
            </View>
          )
        })}
      </Page>
    </Document>
  )
}

// Simple PDF export function
export async function exportTimelineToPdf(options: ExportOptions) {
  const { tasks, keyDates, meetingTitle, selectedPhase = 'all', clientTicker } = options

  try {
    // Use direct image URLs (no base64 conversion needed)
    const clientLogoUrl = clientTicker
      ? `/logos/${clientTicker.toUpperCase()}_logo.png`
      : undefined
    const betanxtLogoUrl = '/images/betanxt-logo.png'

    // Create the PDF document
    const doc = (
      <TimelinePDFDocument
        tasks={tasks}
        keyDates={keyDates}
        meetingTitle={meetingTitle}
        selectedPhase={selectedPhase}
        clientTicker={clientTicker}
        clientLogoUrl={clientLogoUrl}
        betanxtLogoUrl={betanxtLogoUrl}
      />
    )

    // Generate PDF blob
    const pdfBlob = await pdf(doc).toBlob()

    // Create download link
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${meetingTitle.replace(/\s+/g, '_')}_Timeline_${new Date().toISOString().split('T')[0]}.pdf`

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Cleanup
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting PDF:', error)
    throw error
  }
}
