import type { components } from '@/domain-models/generated-schema'

type DigitalShareholderMeeting = components['schemas']['DigitalShareholderMeeting']

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  filename?: string
  includeHeaders?: boolean
}

/**
 * Export attendees to CSV format
 */
function exportToCSV(attendees: DigitalShareholderMeeting[], filename: string): void {
  const headers = [
    'Type',
    'First Name',
    'Last Name',
    'Email',
    'Registration Questions',
    'Minutes Attended',
    'Created At',
  ]

  const csvRows = [
    headers.join(','),
    ...attendees.map((attendee) =>
      [
        attendee.registrantType || '',
        attendee.firstName || '',
        attendee.lastName || '',
        attendee.emailAddress || '',
        attendee.registrationQuestions ? `"${attendee.registrationQuestions.replace(/"/g, '""')}"` : '',
        attendee.minutesAttendedMeeting?.toString() || '',
        attendee.createdAt ? new Date(attendee.createdAt).toLocaleString() : '',
      ].join(',')
    ),
  ]

  const csvContent = csvRows.join('\n')
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;')
}

/**
 * Export attendees to Excel format (XLSX)
 * Note: This creates a simple TSV which Excel can open
 * For full XLSX support, would need a library like xlsx/exceljs
 */
function exportToExcel(attendees: DigitalShareholderMeeting[], filename: string): void {
  const headers = [
    'Type',
    'First Name',
    'Last Name',
    'Email',
    'Registration Questions',
    'Minutes Attended',
    'Created At',
  ]

  const rows = [
    headers.join('\t'),
    ...attendees.map((attendee) =>
      [
        attendee.registrantType || '',
        attendee.firstName || '',
        attendee.lastName || '',
        attendee.emailAddress || '',
        attendee.registrationQuestions || '',
        attendee.minutesAttendedMeeting?.toString() || '',
        attendee.createdAt ? new Date(attendee.createdAt).toLocaleString() : '',
      ].join('\t')
    ),
  ]

  const content = rows.join('\n')
  // Use .xls extension for better Excel compatibility
  const xlsFilename = filename.replace(/\.xlsx?$/, '.xls')
  downloadFile(content, xlsFilename, 'application/vnd.ms-excel;charset=utf-8;')
}

/**
 * Export attendees to PDF format
 * Note: This creates a simple HTML that can be printed to PDF
 * For full PDF generation, would need a library like jsPDF or pdfmake
 */
function exportToPDF(attendees: DigitalShareholderMeeting[], filename: string): void {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #0066cc;
      color: white;
      padding: 12px;
      text-align: left;
      border: 1px solid #ddd;
    }
    td {
      padding: 10px;
      border: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    tr:hover {
      background-color: #e6f2ff;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Digital Shareholder Meeting Attendees</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Total Attendees:</strong> ${attendees.length}</p>
  
  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Name</th>
        <th>Email</th>
        <th>Registration Questions</th>
        <th>Minutes Attended</th>
        <th>Registered At</th>
      </tr>
    </thead>
    <tbody>
      ${attendees
      .map(
        (attendee) => `
        <tr>
          <td>${attendee.registrantType || '-'}</td>
          <td>${attendee.firstName || ''} ${attendee.lastName || ''}</td>
          <td>${attendee.emailAddress || '-'}</td>
          <td>${attendee.registrationQuestions || '-'}</td>
          <td>${attendee.minutesAttendedMeeting?.toString() || '-'}</td>
          <td>${attendee.createdAt ? new Date(attendee.createdAt).toLocaleString() : '-'}</td>
        </tr>
      `
      )
      .join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>This report was generated automatically. For questions, contact your administrator.</p>
  </div>
</body>
</html>
  `

  // Open in new window for printing to PDF
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    // Small delay to ensure content is loaded before print dialog
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Main export function - handles all formats
 */
export function exportAttendees(
  attendees: DigitalShareholderMeeting[],
  options: ExportOptions
): void {
  const timestamp = new Date().toISOString().split('T')[0]
  const defaultFilename = `attendees-${timestamp}`
  const filename = options.filename || defaultFilename

  switch (options.format) {
    case 'csv':
      exportToCSV(attendees, `${filename}.csv`)
      break
    case 'excel':
      exportToExcel(attendees, `${filename}.xlsx`)
      break
    case 'pdf':
      exportToPDF(attendees, filename)
      break
    default:
      throw new Error(`Unsupported export format: ${options.format}`)
  }
}

/**
 * Filter attendees by type
 */
export function filterAttendeesByType(
  attendees: DigitalShareholderMeeting[],
  type: 'Shareholder' | 'Guest' | 'Proxy' | 'Other'
): DigitalShareholderMeeting[] {
  return attendees.filter((attendee) => attendee.registrantType === type)
}

/**
 * Filter attendees who actually attended (have minutes > 0)
 */
export function filterActualAttendees(
  attendees: DigitalShareholderMeeting[]
): DigitalShareholderMeeting[] {
  return attendees.filter((attendee) => (attendee.minutesAttendedMeeting ?? 0) > 0)
}

/**
 * Get attendee statistics
 */
export function getAttendeeStats(attendees: DigitalShareholderMeeting[]) {
  const byType = {
    Shareholder: filterAttendeesByType(attendees, 'Shareholder').length,
    Guest: filterAttendeesByType(attendees, 'Guest').length,
    Proxy: filterAttendeesByType(attendees, 'Proxy').length,
    Other: filterAttendeesByType(attendees, 'Other').length,
  }

  const actualAttendees = filterActualAttendees(attendees)
  const avgMinutesAttended =
    actualAttendees.reduce((sum, a) => sum + (a.minutesAttendedMeeting ?? 0), 0) /
    actualAttendees.length || 0

  return {
    total: attendees.length,
    byType,
    actualAttendees: actualAttendees.length,
    registeredOnly: attendees.length - actualAttendees.length,
    avgMinutesAttended: Math.round(avgMinutesAttended),
  }
}


