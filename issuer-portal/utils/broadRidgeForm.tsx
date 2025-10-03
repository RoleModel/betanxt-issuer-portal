import {
  Document,
  Font,
  Page,
  Image as PdfImage,
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

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Roboto',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 150,
    height: 30,
  },
  logoFallback: {
    fontSize: 20,
    color: '#00578E',
    fontWeight: 700,
    fontFamily: 'Roboto',
  },
  headerTitleBox: {
    flex: 1,
    backgroundColor: '#00578E',
    padding: 5,
    marginLeft: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 700,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  sectionHeader: {
    backgroundColor: '#00578E',
    padding: 3,
    marginTop: 10,
    marginBottom: 6,
  },
  sectionHeaderText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 700,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  greyHeader: {
    backgroundColor: '#808080',
    padding: 3,
    marginBottom: 5,
  },
  greyHeaderText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 700,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  descriptionText: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 10,
    textAlign: 'justify',
    fontFamily: 'Roboto',
  },
  subtitle: {
    fontSize: 8,
    marginBottom: 10,
    fontFamily: 'Roboto',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  formColumn: {
    flex: 1,
    paddingRight: 10,
  },
  formField: {
    fontSize: 8,
    marginBottom: 3,
    fontFamily: 'Roboto',
  },
  noteText: {
    fontSize: 7.5,
    color: '#000000',
    lineHeight: 1.3,
    marginTop: 5,
    marginBottom: 10,
    fontFamily: 'Roboto',
  },
  redText: {
    fontSize: 7.5,
    color: '#FF0000',
    lineHeight: 1.3,
    marginTop: 5,
    marginBottom: 10,
    fontFamily: 'Roboto',
  },
  redNoteText: {
    fontSize: 7.5,
    color: '#FF0000',
    lineHeight: 1.3,
    marginTop: 5,
    marginBottom: 10,
    fontFamily: 'Roboto',
  },
  additionalInfo: {
    fontSize: 7.5,
    lineHeight: 1.4,
    marginTop: 5,
    textAlign: 'justify',
    fontFamily: 'Roboto',
  },
  signatureSection: {
    marginTop: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureColumn: {
    width: '30%',
  },
  signatureLabel: {
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 15,
    fontFamily: 'Roboto',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
  },
  footerText: {
    fontSize: 8,
    textAlign: 'left',
    fontFamily: 'Roboto',
  },
})

interface BroadridgePDFDocumentProps {
  formData?: FormData
  logoBase64?: string
}

// Broadridge PDF Document Component
const BroadridgePDFDocument: React.FC<BroadridgePDFDocumentProps> = ({
  formData = {},
  logoBase64,
}) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header with logo and title */}
        <View style={styles.headerRow}>
          {logoBase64 ? (
            <PdfImage style={styles.logo} src={logoBase64} />
          ) : (
            <Text style={styles.logoFallback}>Broadridge</Text>
          )}
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>CORPORATE ISSUER PROFILE FORM</Text>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Corporate Issuer Profile Form:</Text>
        </View>

        {/* Description */}
        <Text style={styles.descriptionText}>
          Broadridge Financial Solutions, Inc. provides proxy processing and corporate
          communication services for its Bank and Brokerage firm clients and we are
          committed to delivering excellent service. According to our records, your
          company or CUSIP are not listed or have changed due to corporate action. Please
          take this opportunity to provide your company&#39;s information for our Master
          File prior to your annual or special shareholders meeting, or any quarterly or
          other non-proxy mailings. If you are requesting a NOBO list or non-mailing data
          reporting, please submit the Issuer Profile along with the NOBO Request Form or
          Data report request form together in the same email.
        </Text>

        {/* Issuer Profile Information */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Issuer Profile Information:</Text>
        </View>

        <Text style={styles.subtitle}>
          (You are authorizing the below email address accounts, access to proxy data, and
          process setup on behalf of your company via myservice.broadridge.com)
        </Text>

        {/* Two column headers */}
        <View style={styles.formRow}>
          <View style={styles.formColumn}>
            <View style={styles.greyHeader}>
              <Text style={styles.greyHeaderText}>Corporate Issuer Billing Address</Text>
            </View>
          </View>
          <View style={styles.formColumn}>
            <View style={styles.greyHeader}>
              <Text style={styles.greyHeaderText}>
                Corporate Issuer Contact Information
              </Text>
            </View>
          </View>
        </View>

        {/* Form fields in two columns */}
        <View style={styles.formRow}>
          <View style={styles.formColumn}>
            <Text style={styles.formField}>
              Corporate Issuer Name: {formData.issuerName || ''}
            </Text>
            <Text style={styles.formField}>
              Full 9-digit CUSIP Number: {formData.cusipNumber || ''}
            </Text>
            <Text style={styles.formField}>Address: {formData.address || ''}</Text>
            <Text style={styles.formField}>City: {formData.city || ''}</Text>
            <Text style={styles.formField}>State: {formData.state || ''}</Text>
            <Text style={styles.formField}>Zip Code: {formData.zipCode || ''}</Text>
            <Text style={styles.formField}>Exchange: {formData.exchange || ''}</Text>
            <Text style={styles.formField}>Fiscal Year End:</Text>
          </View>
          <View style={styles.formColumn}>
            <Text style={styles.formField}>
              Contact Name: {formData.contactName || ''}
            </Text>
            <Text style={styles.formField}>Telephone: {formData.telephone || ''}</Text>
            <Text style={styles.formField}>Email Address 1: {formData.email || ''}</Text>
            <Text style={styles.formField}>
              Contact Name 2: {formData.contactName2 || ''}
            </Text>
            <Text style={styles.formField}>
              Email Address 2: {formData.emailAddress2 || ''}
            </Text>
            <Text style={styles.formField}>Fax Number: {formData.faxNumber || ''}</Text>
            <Text style={styles.formField}>Mailer Identification (MID) Number:</Text>
          </View>
        </View>

        {/* Note */}
        <Text style={styles.noteText}>
          <Text style={styles.redText}>Note:</Text> An officer of the Issuer company must
          sign and date the form in order to grant the myservice.broadridge.com access to
          above contact. If you have multiple agents that need to be added element control
          ne fee indenetieaire an addime muieiode users need to be added, please contact
          us for instructions on adding multiple users.
        </Text>

        {/* Solicitor section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>
            Solicitor and Tabulating Agent Entitlement
          </Text>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formColumn}>
            <Text style={styles.formField}>
              Voting To Agent Name: Mediant Communications
            </Text>
            <Text style={styles.formField}>Solicitor ID Number: S00454</Text>
          </View>
          <View style={styles.formColumn}>
            <Text style={styles.formField}>
              Tabulating Agent Name: Mediant Communications
            </Text>
            <Text style={styles.formField}>Solicitor ID Number: S00454</Text>
          </View>
        </View>

        {/* Red Note */}
        <Text style={styles.noteText}>
          <Text style={styles.redText}>Note:</Text> An officer of the Issuer company must
          sign and date the form in order to grant the entitlement. Coordinate with your
          agent to provide their Solicitor number. If you have multiple agents that need
          to be added, please contact us for instructions on adding multiple users.
        </Text>

        {/* Additional Information */}
        <Text style={styles.additionalInfo}>
          The most efficient way to provide Broadridge notification of your mailing is at:
          https://MyService.Broadridge.com. You will need your e-mail address and password
          to access our website. If you need your password reset, please click on
          &quot;Forgot Password&quot; and follow the instructions in the e-mail that will
          automatically be sent to you. You will have 15 minutes to reset your password
          before it expires.
        </Text>

        <Text style={styles.additionalInfo}>
          Our online Corporate Issuer Guidebook contains a wealth of information regarding
          job setup and management. Please use the link provided to view or print the
          document: https://broadridge.com/corporateguide.
        </Text>

        <Text style={styles.additionalInfo}>
          Discover who your shareholders are:
          https://www.broadridge.com/resource/nobo-list-requests.
        </Text>

        <Text style={styles.additionalInfo}>
          The United States Postal Service is requiring Broadridge to have a Mailer ID
          (MID) for each Issuer. Please provide your MID number, or we can assist in
          requesting it on your behalf, by requesting a MID Authorization Letter from us.
          We encourage and appreciate your prompt completion and return of this Issuer
          Profile to Corporate Client Service Department at:
          BSGIssuerServices@Broadridge.com indicating your CUSIP and company name in the
          subject line for update. If you have any questions, please do not hesitate in
          contacting us by telephone at (631) 254-7067, option 2.
        </Text>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureColumn}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Print Name</Text>
          </View>
          <View style={styles.signatureColumn}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Signature</Text>
          </View>
          <View style={styles.signatureColumn}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2021 Broadridge Financial Solutions, Inc 51 Menades Way, Edgewood, NY
            11717, Phone: 481.254.7057 www.broadridge.com
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export const generatePDFForm = async (formData: FormData = {}): Promise<string> => {
  // Try to load Broadridge logo
  let logoBase64: string | undefined

  try {
    const logoPath = '/logos/broadridge_logo.png'
    const response = await fetch(logoPath)
    if (response.ok) {
      const blob = await response.blob()
      const reader = new FileReader()
      logoBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to load image'))
        reader.readAsDataURL(blob)
      })
    }
  } catch {
    // Logo loading failed, will use text fallback
  }

  // Generate the PDF
  const pdfBlob = await pdf(
    <BroadridgePDFDocument formData={formData} logoBase64={logoBase64} />
  ).toBlob()

  // Convert blob to data URI
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(pdfBlob)
  })
}
