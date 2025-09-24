import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type JsPDFInstance = InstanceType<typeof jsPDF>
type JsPDFWithAutoTable = JsPDFInstance & {
  lastAutoTable?: { finalY: number }
}

const getAutoTableFinalY = (doc: JsPDFWithAutoTable): number => {
  return doc.lastAutoTable?.finalY ?? 0
}

interface FormData {
  issuerName?: string
  cusipNumber?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  exchange?: string
  contactName?: string
  telephone?: string
  email?: string
  contactName2?: string
  emailAddress2?: string
  faxNumber?: string
}

const logoPath = '/logos/broadridge_logo.png'
const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
  const response = await fetch(imagePath)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to load image'))
    reader.readAsDataURL(blob)
  })
}

export const generatePDFForm = async (
  formData: FormData = {}
): Promise<string> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  // Add Broadridge logo
  try {
    const logoBase64 = await loadImageAsBase64(logoPath)
    doc.addImage(logoBase64, 'PNG', 20, 8, 50, 10)
  } catch (error) {
    console.warn('Failed to load Broadridge logo, using text fallback:', error)
    doc.setFontSize(20)
    doc.setTextColor(0, 87, 142)
    doc.text('Broadridge', 20, 15)
  }

  // Header with blue background
  autoTable(doc, {
    body: [['CORPORATE ISSUER PROFILE FORM']],
    margin: { left: 80, right: 20 },
    startY: 8,
    showHead: false,
    theme: 'plain',
    styles: {
      cellPadding: { top: 0, right: 10, bottom: 0, left: 10 },
      fontSize: 10,
      fontStyle: 'bold',
      minCellHeight: 10,
      fillColor: [0, 87, 142],
      textColor: [255, 255, 255],
      halign: 'center',
      valign: 'middle',
    },
  })

  // Blue bar with title
  autoTable(doc, {
    body: [['Corporate Issuer Profile Form:']],
    margin: { left: 20, right: 20 },
    startY: 28,
    showHead: false,
    theme: 'plain',
    styles: {
      cellPadding: { top: 0, right: 5, bottom: 0, left: 5 },
      fontSize: 9,
      fontStyle: 'bold',
      fillColor: [0, 87, 142],
      textColor: [255, 255, 255],
      halign: 'center',
    },
  })

  // Description text
  const descriptionText = `Broadridge Financial Solutions, Inc. provides proxy processing and corporate communication services for its Bank and Brokerage firm clients and we are committed to delivering excellent service. According to our records, your company or CUSIP are not listed or have changed due to corporate action. Please take this opportunity to provide your company's information for our Master File prior to your annual or special shareholders meeting, or any quarterly or other non-proxy mailings. If you are requesting a NOBO list or non-mailing data reporting, please submit the Issuer Profile along with the NOBO Request Form or Data report request form together in the same email.`

  autoTable(doc, {
    body: [[descriptionText]],
    margin: { left: 20, right: 20 },
    startY: getAutoTableFinalY(doc as JsPDFWithAutoTable) + 2,
    showHead: false,
    theme: 'plain',
    styles: {
      cellPadding: { top: 1, right: 0, bottom: 1, left: 0 },
      fontSize: 8.5,
      textColor: [0, 0, 0],
      halign: 'left',
      cellWidth: 'wrap',
    },
  })

  // Issuer Profile Information section with blue bar
  autoTable(doc, {
    body: [['Issuer Profile Information:']],
    margin: { left: 20, right: 20 },
    startY: getAutoTableFinalY(doc as JsPDFWithAutoTable) + 3,
    showHead: false,
    theme: 'plain',
    styles: {
      cellPadding: { top: 1, right: 5, bottom: 1, left: 5 },
      fontSize: 9,
      fontStyle: 'bold',
      fillColor: [0, 87, 142],
      textColor: [255, 255, 255],
      halign: 'center',
    },
  })

  // Issuer Profile subtitle
  autoTable(doc, {
    body: [
      [
        '(You are authorizing the below email address accounts, access to proxy data, and process setup on behalf of your company via myservice.broadridge.com)',
      ],
    ],
    margin: { left: 20, right: 20 },
    startY: getAutoTableFinalY(doc as JsPDFWithAutoTable),
    showHead: false,
    theme: 'plain',
    styles: {
      cellPadding: { top: 2, right: 0, bottom: 2, left: 0 },
      fontSize: 8,
      textColor: [0, 0, 0],
      halign: 'left',
    },
  })

  // Grey bars for billing and contact headers
  autoTable(doc, {
    body: [['Corporate Issuer Billing Address', 'Corporate Issuer Contact Information']],
    margin: { left: 20, right: 10, bottom: 20 },
    startY: getAutoTableFinalY(doc as JsPDFWithAutoTable) + 3,
    showHead: false,
    theme: 'plain',
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 85 },
    },
    styles: {
      cellPadding: { top: 1, right: 5, bottom: 1, left: 5 },
      fontSize: 8,
      fontStyle: 'bold',
      fillColor: [128, 128, 128], // Grey color
      textColor: [255, 255, 255],
      halign: 'center',
    },
  })

  // Corporate information data
  const formData1 = [
    [`Corporate Issuer Name: ${formData.issuerName || ''}`],
    [`Full 9-digit CUSIP Number: ${formData.cusipNumber || ''}`],
    [`Address: ${formData.address || ''}`],
    [`City: ${formData.city || ''}`],
    [`State: ${formData.state || ''}`],
    [`Zip Code: ${formData.zipCode || ''}`],
    [`Exchange: ${formData.exchange || ''}`],
    ['Fiscal Year End:'],
    [''],
  ]

  const formData2 = [
    [`Contact Name: ${formData.contactName || ''}`],
    [`Telephone: ${formData.telephone || ''}`],
    [`Email Address 1: ${formData.email || ''}`],
    [`Contact Name 2: ${formData.contactName2 || ''}`],
    [`Email Address 2: ${formData.emailAddress2 || ''}`],
    [`Fax Number: ${formData.faxNumber || ''}`],
    ['Mailer Identification (MID) Number:'],
    [''],
    [''],
  ]

  const combinedFormData = formData1.map((leftRow, index) => {
    return [leftRow[0], formData2[index] ? formData2[index][0] : '']
  })

  autoTable(doc, {
    body: combinedFormData,
    margin: { left: 20, right: 20 },
    startY: getAutoTableFinalY(doc as JsPDFWithAutoTable) + 4,
    showHead: false,
    theme: 'plain',
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 85 },
    },
    styles: {
      fontSize: 8,
      textColor: [0, 0, 0],
      cellPadding: { top: 1, right: 0, bottom: 1, left: 0 },
    },
  })

  // Note text
  const noteText = `Note: An officer of the Issuer company must sign and date the form in order to grant the myservice. broadridge.com access to above contact. If you have multiple agents that need to be added element control ne fee indenetieaire an addime muieiode users need to be added, please contact us for instructions on adding multiple users.`

  autoTable(doc, {
    body: [[noteText]],
    margin: { left: 20, right: 20 },
    startY: getAutoTableFinalY(doc as JsPDFWithAutoTable) + 1,
    showHead: false,
    theme: 'plain',
    styles: {
      cellPadding: { top: 1, right: 0, bottom: 2, left: 0 },
      fontSize: 7.5,
      textColor: [0, 0, 0], // Red text for "Note:"
      halign: 'left',
    },
  })

  // Solicitor section with blue bar
  autoTable(doc, {
    body: [['Solicitor and Tabulating Agent Entitlement']],
    margin: { left: 20, right: 20, bottom: 20 },
    startY: getAutoTableFinalY(doc as JsPDFWithAutoTable) + 2,
    showHead: false,
    theme: 'plain',
    styles: {
      cellPadding: { top: 1, right: 5, bottom: 1, left: 5 },
      fontSize: 9,
      fontStyle: 'bold',
      fillColor: [0, 87, 142],
      textColor: [255, 255, 255],
      halign: 'center',
    },
  })

  // Solicitor data
  autoTable(doc, {
    body: [
      [
        'Voting To Agent Name: Mediant Communications',
        'Tabulating Agent Name: Mediant Communications',
      ],
      ['Solicitor ID Number: S00454', 'Solicitor ID Number: S00454'],
    ],
    margin: { left: 20, right: 20 },
    startY: getAutoTableFinalY(doc as JsPDFWithAutoTable),
    showHead: false,
    theme: 'plain',
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 85 },
    },
    styles: {
      fontSize: 8,
      textColor: [0, 0, 0],
      cellPadding: { top: 1, right: 0, bottom: 1, left: 0 },
    },
  })

  // Solicitor note
  const solicitorNote = `Note: An officer of the Issuer company must sign and date the form in order to grant the entitlement. Coordinate with your agent to provide their Solicitor number. If you have multiple agents that need to be added, please contact us for instructions on adding multiple users.`

  autoTable(doc, {
    body: [[solicitorNote]],
    margin: { left: 20, right: 20 },
    startY: getAutoTableFinalY(doc as JsPDFWithAutoTable) + 1,
    showHead: false,
    theme: 'plain',
    styles: {
      cellPadding: { top: 1, right: 0, bottom: 2, left: 0 },
      fontSize: 7.5,
      textColor: [255, 0, 0], // Red text
      halign: 'left',
    },
  })

  // Additional information paragraphs
  const additionalInfo = `The most efficient way to provide Broadridge notification of your mailing is at: https://MyService.Broadridge.com. You will need your e-mail address and password to access our website. If you need your password reset, please click on "Forgot Password" and follow the instructions in the e-mail that will automatically be sent to you. You will have 15 minutes to reset your password before it expires.

Our online Corporate Issuer Guidebook contains a wealth of information regarding job setup and management. Please use the link provided to view or print the document: https://broadridge.com/corporateguide.

Discover who your shareholders are: https://www.broadridge.com/resource/nobo-list-requests.

The United States Postal Service is requiring Broadridge to have a Mailer ID (MID) for each Issuer. Please provide your MID number, or we can assist in requesting it on your behalf, by requesting a MID Authorization Letter from us. We encourage and appreciate your prompt completion and return of this Issuer Profile to Corporate Client Service Department at: BSGIssuerServices@Broadridge.com indicating your CUSIP and company name in the subject line for update. If you have any questions, please do not hesitate in contacting us by telephone at (631) 254-7067, option 2.`

  autoTable(doc, {
    body: [[additionalInfo]],
    margin: { left: 20, right: 20 },
    startY: getAutoTableFinalY(doc as JsPDFWithAutoTable) + 1,
    showHead: false,
    theme: 'plain',
    styles: {
      cellPadding: { top: 1, right: 0, bottom: 2, left: 0 },
      fontSize: 7.5,
      textColor: [0, 0, 0],
      halign: 'left',
    },
  })

  // Signature section with more space
  const currentY = getAutoTableFinalY(doc as JsPDFWithAutoTable) + 20

  // Print Name, Click to sign, Date labels - evenly spaced across page
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('Print Name', 20, currentY)
  doc.text('Click to sign', 85, currentY)
  doc.text('Date', 145, currentY)

  // Draw signature lines with equal spacing - three equal columns
  doc.setFont('helvetica', 'normal')
  doc.line(20, currentY - 4, 75, currentY - 4) // Print name line (50mm width)
  doc.line(85, currentY - 4, 135, currentY - 4) // Signature line (50mm width)
  doc.line(145, currentY - 4, 185, currentY - 4) // Date line (40mm width)

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(0, 0, 0)
  const footerY = currentY + 12
  doc.text(
    '© 2021 Broadridge Financial Solutions, Inc 51 Menades Way, Edgewood, NY 11717, Phone: 481.254.7057 www.broadridge.com',
    20,
    footerY
  )

  return doc.output('datauristring')
}
