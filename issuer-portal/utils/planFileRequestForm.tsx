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

interface SignatureArea {
  id: string
  x: number
  y: number
  width: number
  height: number
  page?: number
  label?: string
  signed?: boolean
  type?: 'signature' | 'text' | 'date'
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
  meetingDate?: string
  ticker?: string
}

interface FormHandlerProps {
  onDocumentOpen: (
    documentUrl: string,
    documentId: string,
    signatureAreas: SignatureArea[]
  ) => void
  clientData?: ClientData
}

// Create styles (same as transfer agent but with smaller logo)
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 36,
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  logo: {
    width: 60,
    height: 60,
  },
  logoPlaceholder: {
    width: 43,
    height: 43,
    backgroundColor: '#F0F0F0',
    borderColor: '#C8C8C8',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 8,
    color: '#969696',
    fontFamily: 'Roboto',
  },
  date: {
    fontSize: 10,
    fontFamily: 'Roboto',
  },
  recipient: {
    marginBottom: 20,
  },
  recipientText: {
    fontSize: 10,
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  mainText: {
    fontSize: 10,
    marginBottom: 10,
    lineHeight: 1.5,
    fontFamily: 'Roboto',
  },
  table: {
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tableLabel: {
    width: 108,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'Roboto',
  },
  tableValue: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Roboto',
  },
  noticeText: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 8,
    fontFamily: 'Roboto',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'Roboto',
  },
  bulletList: {
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 20,
    fontSize: 10,
    fontFamily: 'Roboto',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    fontFamily: 'Roboto',
  },
  deliveryText: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  signature: {
    marginTop: 10,
  },
  signatureThankYou: {
    fontSize: 10,
    marginBottom: 50,
    fontFamily: 'Roboto',
  },
  signatureName: {
    fontSize: 10,
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
})

interface PlanFileRequestPDFDocumentProps {
  clientData?: ClientData
  logoBase64?: string
}

// Plan File Request PDF Document Component
const PlanFileRequestPDFDocument: React.FC<PlanFileRequestPDFDocumentProps> = ({
  clientData,
  logoBase64,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const meetingDateStr = clientData?.meetingDate
    ? new Date(clientData.meetingDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : (() => {
        const fallbackDate = new Date()
        fallbackDate.setDate(fallbackDate.getDate() + 60)
        return fallbackDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      })()

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header with logo and date */}
        <View style={styles.header}>
          {logoBase64 ? (
            <PDFImage style={styles.logo} src={logoBase64} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>{clientData?.ticker || 'LOGO'}</Text>
            </View>
          )}
          <Text style={styles.date}>{currentDate}</Text>
        </View>

        {/* Recipient information */}
        <View style={styles.recipient}>
          <Text style={styles.recipientText}>
            Dan Spengel (daniel.spengel@equiniti.com)
          </Text>
          <Text style={styles.recipientText}>EQ (AST &amp; Equiniti)</Text>
          <Text style={styles.recipientText}>
            Re: {clientData?.issuerName || '[COMPANY NAME]'}
          </Text>
        </View>

        {/* Main letter text - different from Transfer Agent */}
        <Text style={styles.mainText}>
          Please use this letter as authorization and instruction to send our Registered
          Shareholder files as of our Proxy Record Date as stated below.
        </Text>

        {/* Meeting details table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Issuer:</Text>
            <Text style={styles.tableValue}>
              {clientData?.issuerName || '[COMPANY NAME]'}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>CUSIP:</Text>
            <Text style={styles.tableValue}>{clientData?.cusipNumber || '[CUSIP]'}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Date:</Text>
            <Text style={styles.tableValue}>{currentDate}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Meeting Date:</Text>
            <Text style={styles.tableValue}>{meetingDateStr}</Text>
          </View>
        </View>

        {/* Important notice text */}
        <Text style={styles.noticeText}>
          Please ensure that the share total of the file extract matches the Proxy Record
          Date balance that is provided to us for inclusion into the Proxy Statement.
        </Text>

        <Text style={styles.noticeText}>
          An appropriate and adjusted file (if necessary) MUST be provided to BetaNXT so
          that the file as of the Record Date would MATCH the number you indicate that is
          to appear in our Proxy Statement.
        </Text>

        <Text style={styles.noticeText}>
          You will be contacted if adjustments must be made by BetaNXT in order to match
          or balance the file you deliver with the figure you provide to us as appearing
          in the Proxy Statement in order to maintain the integrity and accuracy of the
          shareholder record file.
        </Text>

        <Text style={styles.noticeText}>
          If there are any registered shareholder email addresses who have consented to
          receive electronic delivery of proxy material, please indicate and include on
          the record date file.
        </Text>

        {/* File requirements section */}
        <Text style={styles.sectionHeader}>
          In preparation for receiving the files, BetaNXT&#39;s file requirements are as
          follows:
        </Text>

        <View style={styles.bulletList}>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Flat file format either delimited or fixed-length (Excel is OK)
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Please provide a file layout if not identical to prescribed or
              pre-established standards
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Please provide control totals (Total Number of Records and Total Shares)
            </Text>
          </View>
        </View>

        {/* Delivery instructions */}
        <Text style={styles.deliveryText}>
          As is customary, BetaNXT will accept the files through their secure portal ONLY,
          or, password protected file through a secure, encrypted, and/or otherwise secure
          format as pre-established. Please note that the Relationship Manager assigned to
          handle my account is Robert Anderson robert.anderson@betanxt.com of Mediant
          Communications, and can also be reached at Mediant.Gold.Team@Betanxt.com
        </Text>

        {/* Signature section */}
        <View style={styles.signature}>
          <Text style={styles.signatureThankYou}>Thank you,</Text>
          <Text style={styles.signatureName}>
            {clientData?.contactName || '[AUTHORITY NAME]'}
          </Text>
          <Text style={styles.signatureName}>
            {clientData?.issuerName || '[COMPANY NAME]'}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

const generatePlanFileRequestPDF = async (clientData?: ClientData): Promise<string> => {
  // Try to load client logo
  let logoBase64: string | undefined

  if (clientData?.ticker) {
    try {
      const logoPath = `/logos/${clientData.ticker.toUpperCase()}_logo.png`
      // eslint-disable-next-line no-console
      console.log(
        '[PlanFileRequestForm] Loading logo from:',
        logoPath,
        'clientData:',
        clientData
      )
      const response = await fetch(logoPath)
      // eslint-disable-next-line no-console
      console.log(
        '[PlanFileRequestForm] Logo fetch response:',
        response.ok,
        response.status
      )
      if (response.ok) {
        const blob = await response.blob()
        const reader = new FileReader()
        logoBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        // eslint-disable-next-line no-console
        console.log(
          '[PlanFileRequestForm] Logo loaded successfully, base64 length:',
          logoBase64?.length
        )
      }
    } catch (error) {
       
      console.error('[PlanFileRequestForm] Logo loading failed:', error)
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('[PlanFileRequestForm] No ticker in clientData:', clientData)
  }

  // Generate the PDF
  const pdfBlob = await pdf(
    <PlanFileRequestPDFDocument clientData={clientData} logoBase64={logoBase64} />
  ).toBlob()

  // Convert blob to data URI
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(pdfBlob)
  })
}

export const handleFormDownload = async (clientData?: ClientData) => {
  const pdfDataUri = await generatePlanFileRequestPDF(clientData)
  const downloadLink = document.createElement('a')
  downloadLink.href = pdfDataUri
  downloadLink.download = 'Plan_File_Request_Form.pdf'
  downloadLink.click()
}

export const handleFormSign = async ({
  onDocumentOpen,
  clientData,
}: FormHandlerProps) => {
  // Generate the PDF form
  const pdfDataUri = await generatePlanFileRequestPDF(clientData)

  // Create unique document ID
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  const documentId = `plan-file-request-${timestamp}-${random}`

  // Define signature areas
  const signatureAreas: SignatureArea[] = [
    {
      id: 'signature-1',
      x: 6,
      y: 81,
      width: 35,
      height: 5,
      page: 1,
      label: 'Signature',
      type: 'signature',
      signed: false,
    },
  ]

  // Call the callback to open the document viewer
  onDocumentOpen(pdfDataUri, documentId, signatureAreas)
}
