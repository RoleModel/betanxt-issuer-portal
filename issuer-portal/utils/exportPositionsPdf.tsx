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

import { loadClientLogoAsPngBase64 } from '@/utils/clientBranding'

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

// Create styles based on the provided image styling
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
    marginBottom: 20,
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
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    fontFamily: 'Roboto',
    textAlign: 'center',
    color: '#666666',
  },
  table: {
    flexDirection: 'column',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 6,
    minHeight: 24,
  },
  tableRowAlternate: {
    backgroundColor: '#FAFAFA',
  },
  headerCell: {
    fontSize: 8,
    fontWeight: 700,
    paddingHorizontal: 4,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  cell: {
    fontSize: 7,
    paddingHorizontal: 4,
    fontFamily: 'Roboto',
  },
  cellCenter: {
    textAlign: 'center',
  },
  cellRight: {
    textAlign: 'right',
  },
  // Column widths (percentages)
  col1: { width: '8%' }, // CUSIP
  col2: { width: '10%' }, // Account Type
  col3: { width: '8%' }, // Set Key
  col4: { width: '18%' }, // Name
  col5: { width: '10%' }, // Account #
  col6: { width: '8%' }, // Vote Status
  col7: { width: '10%' }, // Control #
  col8: { width: '8%' }, // Shares
  col9: { width: '8%' }, // Shares Voted
  col10: { width: '6%' }, // Source
  col11: { width: '8%' }, // Date Voted
  col12: { width: '6%' }, // Sent By
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

// Helper function to load image as base64
const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
  try {
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
    throw error
  }
}

// Format number with thousand separators
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US')
}

// Format date
const formatDate = (date: string | null): string => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  })
}

interface PositionsPDFDocumentProps {
  positions: Position[]
  meetingTitle: string
  clientTicker?: string
  clientLogoBase64?: string
  betanxtLogoBase64?: string
}

// Positions PDF Document Component
const PositionsPDFDocument: React.FC<PositionsPDFDocumentProps> = ({
  positions,
  meetingTitle,
  clientTicker: _clientTicker,
  clientLogoBase64,
  betanxtLogoBase64,
}) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page} orientation="landscape">
        {/* Header with logos */}
        <View style={styles.header}>
          <View>
            {clientLogoBase64 && (
              <PDFImage style={styles.logo} src={clientLogoBase64} />
            )}
          </View>
          <View>
            {betanxtLogoBase64 && (
              <PDFImage style={styles.betanxtLogo} src={betanxtLogoBase64} />
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Positions Report</Text>
        <Text style={styles.subtitle}>{meetingTitle}</Text>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.col1]}>CUSIP</Text>
            <Text style={[styles.headerCell, styles.col2]}>Account Type</Text>
            <Text style={[styles.headerCell, styles.col3]}>Set Key</Text>
            <Text style={[styles.headerCell, styles.col4]}>Name</Text>
            <Text style={[styles.headerCell, styles.col5]}>Account #</Text>
            <Text style={[styles.headerCell, styles.col6]}>Vote Status</Text>
            <Text style={[styles.headerCell, styles.col7]}>Control #</Text>
            <Text style={[styles.headerCell, styles.col8]}>Shares</Text>
            <Text style={[styles.headerCell, styles.col9]}>Shares Voted</Text>
            <Text style={[styles.headerCell, styles.col10]}>Source</Text>
            <Text style={[styles.headerCell, styles.col11]}>Date Voted</Text>
            <Text style={[styles.headerCell, styles.col12]}>Sent By</Text>
          </View>

          {/* Table Rows */}
          {positions.map((position, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlternate : {},
              ]}
            >
              <Text style={[styles.cell, styles.col1, styles.cellCenter]}>
                {position.cusip}
              </Text>
              <Text style={[styles.cell, styles.col2, styles.cellCenter]}>
                {position.accountType}
              </Text>
              <Text style={[styles.cell, styles.col3, styles.cellCenter]}>
                {position.setKey}
              </Text>
              <Text style={[styles.cell, styles.col4]}>
                {position.name}
              </Text>
              <Text style={[styles.cell, styles.col5, styles.cellCenter]}>
                {position.accountNumber}
              </Text>
              <Text style={[styles.cell, styles.col6, styles.cellCenter]}>
                {position.voteStatus}
              </Text>
              <Text style={[styles.cell, styles.col7, styles.cellCenter]}>
                {position.controlNumber}
              </Text>
              <Text style={[styles.cell, styles.col8, styles.cellRight]}>
                {formatNumber(position.shares)}
              </Text>
              <Text style={[styles.cell, styles.col9, styles.cellRight]}>
                {formatNumber(position.sharesVoted)}
              </Text>
              <Text style={[styles.cell, styles.col10, styles.cellCenter]}>
                {position.source}
              </Text>
              <Text style={[styles.cell, styles.col11, styles.cellCenter]}>
                {formatDate(position.dateVoted)}
              </Text>
              <Text style={[styles.cell, styles.col12, styles.cellCenter]}>
                {position.sentBy ? 'Email' : 'File'}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

// Main export function
export async function exportPositionsToPdf(options: ExportOptions) {
  const { positions, meetingTitle, clientTicker } = options

  try {
    // Load logos as base64
    let clientLogoBase64: string | undefined
    let betanxtLogoBase64: string | undefined

    try {
      clientLogoBase64 = await loadClientLogoAsPngBase64({ ticker: clientTicker })
    } catch {
      // Client logo is optional
    }

    try {
      betanxtLogoBase64 = await loadImageAsBase64('/images/betanxt-logo.png')
    } catch {
      // BetaNXT logo is optional
    }

    // Generate the PDF
    const pdfBlob = await pdf(
      <PositionsPDFDocument
        positions={positions}
        meetingTitle={meetingTitle}
        clientTicker={clientTicker}
        clientLogoBase64={clientLogoBase64}
        betanxtLogoBase64={betanxtLogoBase64}
      />
    ).toBlob()

    // Create download link and trigger download
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    const fileName = `${meetingTitle.replace(/\s+/g, '_')}_Positions_${new Date().toISOString().split('T')[0]
      }.pdf`
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}
