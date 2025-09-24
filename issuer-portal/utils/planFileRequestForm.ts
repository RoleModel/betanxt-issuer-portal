import { generatePDFForm } from './broadRidgeForm'

interface SignatureArea {
  id: string
  x: number
  y: number
  width: number
  height: number
  page?: number
  label?: string
  signed?: boolean
}

interface ClientData {
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

interface FormHandlerProps {
  onDocumentOpen: (
    documentUrl: string,
    documentId: string,
    signatureAreas: SignatureArea[]
  ) => void
  clientData?: ClientData
}

export const handleFormDownload = async (clientData?: ClientData) => {
  const pdfDataUri = await generatePDFForm(clientData)
  const downloadLink = document.createElement('a')
  downloadLink.href = pdfDataUri
  downloadLink.download = 'Broadridge_Corporate_Issuer_Profile_Form.pdf'
  downloadLink.click()
}

export const handleFormSign = async ({
  onDocumentOpen,
  clientData,
}: FormHandlerProps) => {
  // Generate the PDF form
  const pdfDataUri = await generatePDFForm(clientData)

  // Create unique document ID
  const documentId = `broadridge-form-${Date.now()}`

  // Define signature areas positioned over the form's signature lines
  const signatureAreas: SignatureArea[] = [
    {
      id: 'print-name-1',
      x: 12, // percentage from left - over print name line
      y: 80, // percentage from top - positioned over the actual signature line
      width: 25, // percentage width
      height: 5, // percentage height - smaller to fit on line
      page: 1,
      label: 'Print Name',
      signed: false,
    },
    {
      id: 'sig-1',
      x: 40, // percentage from left - over signature line
      y: 80, // percentage from top - positioned over the actual signature line
      width: 25, // percentage width
      height: 5, // percentage height - smaller to fit on line
      page: 1,
      label: 'Signature',
      signed: false,
    },
    {
      id: 'date-1',
      x: 69, // percentage from left - over date line
      y: 80, // percentage from top - positioned over the actual signature line
      width: 19, // percentage width
      height: 5, // percentage height - smaller to fit on line
      page: 1,
      label: 'Date',
      signed: false,
    },
  ]

  // Call the callback to open the document viewer
  onDocumentOpen(pdfDataUri, documentId, signatureAreas)
}
