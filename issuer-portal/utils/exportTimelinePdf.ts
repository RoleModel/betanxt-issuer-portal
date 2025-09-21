import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Task, KeyDate } from '@/types/api'
import { shiftWeekendToMonday } from '@/components/Calendar/CalendarUtils'
import { theme } from '@/components/mui-styling/theme'

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
  clientTicker?: string // Add client ticker for logo selection
}

// Phase colors - extracted from theme
const phaseColors = theme.palette.phase.map(phase => phase.main)

// Helper function to load image as base64
const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
  try {
    // Handle both relative and absolute paths
    const fullPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
    const response = await fetch(fullPath)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        if (result && result.startsWith('data:')) {
          resolve(result)
        } else {
          reject(new Error('Invalid image data'))
        }
      }
      reader.onerror = () => reject(new Error('FileReader error'))
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to load image:', error)
    throw error
  }
}

// Setup Roboto font for PDF using Google Fonts API
async function setupRobotoFont(doc: jsPDF) {
  try {
    // Load Roboto fonts from Google Fonts API
    const robotoRegularWoff2 = await loadFontAsBase64('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2')
    const robotoBoldWoff2 = await loadFontAsBase64('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2')

    // Add fonts to jsPDF VFS (Virtual File System)
    doc.addFileToVFS('Roboto-Regular.woff2', robotoRegularWoff2)
    doc.addFont('Roboto-Regular.woff2', 'Roboto', 'normal')

    doc.addFileToVFS('Roboto-Bold.woff2', robotoBoldWoff2)
    doc.addFont('Roboto-Bold.woff2', 'Roboto', 'bold')

    // Set default font to Roboto
    doc.setFont('Roboto', 'normal')

    console.log('Roboto font loaded successfully from Google Fonts')
  } catch (error) {
    console.warn('Failed to load Roboto font from Google Fonts, using Helvetica fallback:', error)
    // Fallback to helvetica
    doc.setFont('helvetica')
  }
}

// Helper function to load font as base64 (WOFF2 format from Google Fonts)
const loadFontAsBase64 = async (fontUrl: string): Promise<string> => {
  try {
    const response = await fetch(fontUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i])
    }
    return btoa(binary)
  } catch (error) {
    console.error('Failed to load font:', error)
    throw error
  }
}

// Note: HTML generation functions removed - using manual table-like positioning for better compatibility

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

export async function exportTimelineToPdf(options: ExportOptions) {
  const { tasks, keyDates, meetingTitle, selectedPhase = 'all', clientTicker } = options

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  })

  // Filter and sort data
  let filteredTasks = tasks
  let filteredKeyDates = keyDates

  if (selectedPhase !== 'all' && typeof selectedPhase === 'number') {
    filteredTasks = tasks.filter(t => t.phaseNumber === selectedPhase)
    filteredKeyDates = keyDates.filter(k => k.phaseNumber === selectedPhase)
  }

  // Combine and sort items chronologically
  const combinedItems: CombinedItem[] = []

  // Add tasks
  filteredTasks.forEach(task => {
    if (task.dueDate) {
      const displayDate = formatDate(task.dueDate)
      combinedItems.push({
        type: 'task',
        item: task,
        date: parseDateString(displayDate),
        displayDate
      })
    }
  })

  // Add key dates
  filteredKeyDates.forEach(keyDate => {
    if (keyDate.date) {
      const displayDate = formatDate(keyDate.date)
      combinedItems.push({
        type: 'keyDate',
        item: keyDate,
        date: parseDateString(displayDate),
        displayDate
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

  // Set up the document with custom fonts
  await setupRobotoFont(doc)

  // Add header with logos
  await addHeader(doc, clientTicker)

  // Add title
  doc.setFontSize(16)
  doc.setFont('Roboto', 'bold')
  doc.text('Meeting Schedule', 20, 30)
  doc.setFontSize(12)
  doc.setFont('Roboto', 'normal')
  doc.text(meetingTitle, 20, 36)

  let startY = 50

  // Generate tables using autoTable
  if (selectedPhase === 'all') {
    // Group by phases
    const phaseGroups = new Map<number, CombinedItem[]>()

    combinedItems.forEach(item => {
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

    // Render each phase as a separate table
    for (let phase = 1; phase <= 8; phase++) {
      const items = phaseGroups.get(phase) || []
      if (items.length === 0) continue

      startY = generatePhaseTable(doc, phase, items, startY)
    }
  } else {
    // Single phase table
    generatePhaseTable(doc, selectedPhase as number, combinedItems, startY)
  }

  // Save the PDF
  const fileName = `${meetingTitle.replace(/\s+/g, '_')}_Timeline_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

// Add header with logos
async function addHeader(doc: jsPDF, clientTicker?: string) {
  try {
    // Try to load client-specific logo based on ticker
    const clientLogoPath = '/images/logo.png' // Default logo
    if (clientTicker) {
      // Try ticker-specific logo first (SVG format in logos directory)
      const tickerLogoPath = `/logos/${clientTicker}_logo.svg`
      try {
        const clientLogoBase64 = await loadImageAsBase64(tickerLogoPath)
        doc.addImage(clientLogoBase64, 'SVG', 20, 8, 50, 10)
      } catch {
        // Fallback to default PNG logo
        const clientLogoBase64 = await loadImageAsBase64(clientLogoPath)
        doc.addImage(clientLogoBase64, 'PNG', 20, 8, 50, 10)
      }
    } else {
      // Use default logo
      const clientLogoBase64 = await loadImageAsBase64(clientLogoPath)
      doc.addImage(clientLogoBase64, 'PNG', 20, 8, 50, 10)
    }
  } catch (error) {
    // Fallback to text for client logo
    doc.setFontSize(12)
    doc.setFont('Roboto', 'bold')
    doc.text(clientTicker ? `${clientTicker} Logo` : 'Client Logo', 20, 15)
  }

  try {
    // Try to load BetaNXT PNG from public directory
    const betanxtLogoBase64 = await loadImageAsBase64('/images/betanxt-logo.png')
    doc.addImage(betanxtLogoBase64, 'PNG', 145, 10, 28, 6.2) // Maintaining aspect ratio
  } catch (error) {
    // Fallback to styled text
    doc.setFont('Roboto', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(13, 101, 128) // #0D6580 brand color
    doc.text('BetaNXT', 190, 15, { align: 'right' })
    doc.setTextColor(0, 0, 0) // Reset to black
  }
}

// Generate a table for a phase using autoTable
function generatePhaseTable(doc: jsPDF, phase: number, items: CombinedItem[], startY: number): number {
  const phaseColor = phaseColors[phase - 1]
  const rgb = hexToRgb(phaseColor)
  const pageHeight = doc.internal.pageSize.height

  // Add space above phase headers (except for the first phase)
  if (phase > 1) {
    startY += 7 // Space above phase header
  }

  const phaseHeaderHeight = 5 // Reduced height
  const minContentHeight = 20 // Minimum space needed for at least some content

  // Prevent orphaned headers - if header + minimal content won't fit, start new page
  if (startY + phaseHeaderHeight + minContentHeight > pageHeight - 30) {
    doc.addPage()
    startY = 30
  }

  // Add phase header with reduced spacing
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(rgb.r, rgb.g, rgb.b)
  doc.text(`Phase ${phase}`, 20, startY)
  doc.setTextColor(0, 0, 0)

  // Prepare table data - only 2 columns: task/key date name and date
  const tableData = items.map(item => {
    if (item.type === 'keyDate') {
      const keyDate = item.item as KeyDate
      return [
        keyDate.title,
        item.displayDate
      ]
    } else {
      const task = item.item as Task
      return [
        task.title,
        formatDateShort(task.dueDate)
      ]
    }
  })

  // Generate the table
  autoTable(doc, {
    startY: startY + phaseHeaderHeight,
    head: [],
    body: tableData,
    columnStyles: {
      0: { cellWidth: 130 }, // Task/key date name
      1: { cellWidth: 30, halign: 'right' } // Date column
    },
    styles: {
      fontSize: 10,
      cellPadding: 2,
      valign: 'middle',
      lineColor: [255, 255, 255], // White lines (invisible)
      lineWidth: 0,
      fillColor: [255, 255, 255], // White background (no zebra striping)
      font: 'Roboto' // Use Roboto font in tables
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255] // Ensure no alternating colors
    },
    didParseCell: function (data) {
      const item = items[data.row.index]

      if (item.type === 'keyDate') {
        // Key date styling - blue background for entire row
        data.cell.styles.fillColor = [204, 229, 255]
        data.cell.styles.fontStyle = 'bold'
        if (data.column.index === 0) {
          data.cell.styles.lineColor = [1, 99, 151]
          data.cell.styles.lineWidth = { left: 1 }
        }

      } else {
        // Task styling - white background with colored left border
        const task = item.item as Task
        const phaseColor = phaseColors[(task.phaseNumber || 1) - 1]
        const rgb = hexToRgb(phaseColor)

        data.cell.styles.fillColor = [255, 255, 255]

        // Add colored left border only to the first column
        if (data.column.index === 0) {
          data.cell.styles.lineColor = [rgb.r, rgb.g, rgb.b]
          data.cell.styles.lineWidth = { left: 1 } // Thick left border
        }
      }
    },
    margin: { left: 20, right: 20 }
  })

  type JsPDFWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } }
  const withAT = doc as JsPDFWithAutoTable
  const finalY = withAT.lastAutoTable?.finalY ?? startY
  return finalY + 5 // Return Y position after table with reduced spacing
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

// Note: getItemHeight function removed - now using HTML table approach

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

// Note: truncateText function removed - HTML tables handle text wrapping automatically
