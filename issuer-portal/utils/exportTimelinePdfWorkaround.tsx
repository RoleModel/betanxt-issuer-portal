// Workaround for React 19 compatibility with @react-pdf/renderer
// This creates the PDF document structure without using React components
import type { KeyDate, Task } from '@/types/api-exports'

interface ExportOptions {
  tasks: Task[]
  keyDates: KeyDate[]
  meetingTitle: string
  selectedPhase?: number | 'all'
  clientTicker?: string
}

// Direct PDF generation without print dialog
export async function exportTimelineToPdf(options: ExportOptions) {
  const { tasks, keyDates, meetingTitle, selectedPhase = 'all', clientTicker } = options

  try {
    // Use jsPDF for direct PDF generation
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Generate PDF content
    await generatePdfContent(
      pdf,
      tasks,
      keyDates,
      meetingTitle,
      selectedPhase,
      clientTicker
    )

    // Download the PDF directly
    const fileName = `${meetingTitle.replace(/\s+/g, '_')}_Timeline_${
      new Date().toISOString().split('T')[0]
    }.pdf`

    pdf.save(fileName)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

async function generatePdfContent(
  pdf: unknown,
  tasks: Task[],
  keyDates: KeyDate[],
  meetingTitle: string,
  selectedPhase: number | 'all',
  clientTicker?: string
) {
  // Filter data based on phase
  let filteredTasks = tasks
  let filteredKeyDates = keyDates

  if (selectedPhase !== 'all' && typeof selectedPhase === 'number') {
    filteredTasks = tasks.filter((t) => t.phaseNumber === selectedPhase)
    filteredKeyDates = keyDates.filter((k) => k.phaseNumber === selectedPhase)
  }

  // Group by phases
  const phaseGroups = new Map<number, { tasks: Task[]; keyDates: KeyDate[] }>()

  for (let phase = 1; phase <= 8; phase++) {
    const phaseTasks = filteredTasks.filter((t) => t.phaseNumber === phase)
    const phaseKeyDates = filteredKeyDates.filter((k) => k.phaseNumber === phase)
    if (phaseTasks.length > 0 || phaseKeyDates.length > 0) {
      phaseGroups.set(phase, { tasks: phaseTasks, keyDates: phaseKeyDates })
    }
  }

  // Phase colors
  const phaseColors = [
    '#7E57C2',
    '#5E35B1',
    '#512DA8',
    '#4527A0',
    '#3949AB',
    '#303F9F',
    '#283593',
    '#1E88E5',
  ]

  // Generate HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${meetingTitle} Timeline</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        body {
          font-family: 'Roboto', 'Arial', sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
        }
        .logo {
          font-weight: bold;
          font-size: 18px;
          color: #333;
        }
        .betanxt-logo {
          color: #0D6580;
          font-weight: bold;
          font-size: 16px;
        }
        h1 {
          font-size: 24px;
          margin: 10px 0;
          color: #333;
        }
        h2 {
          font-size: 18px;
          margin: 5px 0 20px 0;
          color: #666;
          font-weight: normal;
        }
        .phase-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .phase-header {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .timeline-table {
          width: 100%;
          border-collapse: collapse;
        }
        .timeline-row {
          min-height: 30px;
          border-left: 3px solid;
          margin-bottom: 2px;
        }
        .key-date-row {
          background-color: rgba(204, 229, 255, 0.5);
          border-left-color: #016397;
          padding: 8px 12px;
          font-weight: bold;
        }
        .task-row {
          background-color: #ffffff;
          padding: 6px 12px;
          border-bottom: 1px solid #f0f0f0;
        }
        .row-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .task-title {
          flex: 1;
          padding-right: 20px;
        }
        .task-date {
          text-align: right;
          white-space: nowrap;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${clientTicker ? `${clientTicker} Logo` : 'Client Logo'}</div>
        <div class="betanxt-logo">BetaNXT</div>
      </div>

      <h1>Meeting Schedule</h1>
      <h2>${meetingTitle}</h2>

      ${Array.from(phaseGroups.entries())
        .map(
          ([phase, items]) => `
        <div class="phase-section">
          <div class="phase-header" style="color: ${phaseColors[phase - 1]}">
            Phase ${phase}
          </div>
          <div class="timeline-table">
            ${items.keyDates
              .map(
                (keyDate) => `
              <div class="timeline-row key-date-row">
                <div class="row-content">
                  <div class="task-title">${keyDate.title ?? 'Untitled Key Date'}</div>
                  <div class="task-date">${formatDate(keyDate.date)}</div>
                </div>
              </div>
            `
              )
              .join('')}
            ${items.tasks
              .map(
                (task) => `
              <div class="timeline-row task-row" style="border-left-color: ${phaseColors[phase - 1]}">
                <div class="row-content">
                  <div class="task-title">${task.title ?? 'Untitled Task'}</div>
                  <div class="task-date">${formatDate(task.dueDate)}</div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
        )
        .join('')}
    </body>
    </html>
  `
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'TBD'

  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  } catch {
    return 'TBD'
  }
}
