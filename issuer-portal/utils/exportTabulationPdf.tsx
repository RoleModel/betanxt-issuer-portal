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

interface ProposalVote {
  proposalNumber: string
  title: string
  directorName?: string
  voteFor: number
  voteAgainst: number
  voteAbstain: number
  percentFor: number
  percentAgainst: number
  percentAbstain: number
  percentOfOutstanding: number
  percentOfTotalVoted: number
  percentOfProposalVotes: number
}

interface TabulationData {
  companyName: string
  meetingType: string
  meetingDate: string
  recordDate: string
  totalOutstanding: number
  votesRepresentedForQuorum: number
  quorumPercentage: number
  quorumRequirement: string
  votesOverUnderQuorum: number
  cusipList: string
  proposals: ProposalVote[]
}

interface ExportOptions {
  tabulationData: TabulationData
  clientTicker?: string
}

// Create styles matching the Figma design
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
    marginBottom: 12,
    alignItems: 'center',
  },
  clientLogo: {
    width: 113,
    height: 24,
  },
  betanxtLogo: {
    width: 73,
    height: 17,
  },
  titleSection: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 30, 28, 0.12)',
    paddingBottom: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 2,
    fontFamily: 'Roboto',
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#666666',
  },
  infoSection: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 30, 28, 0.12)',
    paddingVertical: 8,
  },
  infoCell: {
    flex: 1,
    paddingHorizontal: 10,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 400,
    fontFamily: 'Roboto',
    color: '#1f1e1c',
    letterSpacing: 0.13,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 400,
    fontFamily: 'Roboto',
    color: '#1f1e1c',
  },
  cusipRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 30, 28, 0.12)',
  },
  cusipText: {
    fontSize: 11,
    fontFamily: 'Roboto',
    color: '#1f1e1c',
  },
  proposalSection: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 30, 28, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  proposalHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 30, 28, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: 500,
    fontFamily: 'Roboto',
    letterSpacing: 0.21,
  },
  cellBold: {
    fontSize: 11,
    fontWeight: 500,
    fontFamily: 'Roboto',
    letterSpacing: 0.21,
  },
  cell: {
    fontSize: 11,
    fontWeight: 400,
    fontFamily: 'Roboto',
    letterSpacing: 0.13,
  },
  cellRight: {
    textAlign: 'right',
  },
  // Column widths
  colLabel: { width: '14%' },
  colProposal: { flex: 1 },
  colVote: { width: '15%', textAlign: 'right' },
  colPercent: { width: '15%', textAlign: 'center' },
  colPercentRight: { width: '15%', textAlign: 'right' },
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
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 36,
    fontSize: 11,
    fontFamily: 'Roboto',
    color: '#1f1e1c',
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

// Format number with thousand separators and decimals
const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// Format date
const formatDate = (date: string): string => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

// Format percentage
const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`
}

interface TabulationPDFDocumentProps {
  tabulationData: TabulationData
  clientTicker?: string
  clientLogoBase64?: string
  betanxtLogoBase64?: string
}

// Tabulation PDF Document Component
const TabulationPDFDocument: React.FC<TabulationPDFDocumentProps> = ({
  tabulationData,
  clientTicker: _clientTicker,
  clientLogoBase64,
  betanxtLogoBase64,
}) => {
  const {
    companyName,
    meetingType,
    meetingDate,
    recordDate,
    totalOutstanding,
    votesRepresentedForQuorum,
    quorumPercentage,
    quorumRequirement,
    votesOverUnderQuorum,
    cusipList,
    proposals,
  } = tabulationData

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header with logos */}
        <View style={styles.header}>
          <View>
            {clientLogoBase64 && (
              <PDFImage style={styles.clientLogo} src={clientLogoBase64} />
            )}
          </View>
          <View>
            {betanxtLogoBase64 && (
              <PDFImage style={styles.betanxtLogo} src={betanxtLogoBase64} />
            )}
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Tabulation Report</Text>
          <Text style={styles.subtitle}>{meetingType}</Text>
        </View>

        {/* Meeting Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Company Name:</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoValue}>{companyName}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Total Outstanding:</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoValue}>{formatNumber(totalOutstanding)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Type:</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoValue}>{meetingType}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Votes Represented for Quorum:</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoValue}>{formatNumber(votesRepresentedForQuorum)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Meeting Date:</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoValue}>{formatDate(meetingDate)}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Quorum:</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoValue}>{formatPercent(quorumPercentage)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Record Date:</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoValue}>{formatDate(recordDate)}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>% Needed for Quorum:</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoValue}>{quorumRequirement}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCell} />
            <View style={styles.infoCell} />
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Votes over / (under) Quorum:</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoValue}>
                {votesOverUnderQuorum < 0 ? '(' : ''}
                {formatNumber(Math.abs(votesOverUnderQuorum), 0)}
                {votesOverUnderQuorum < 0 ? ')' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* CUSIP Information */}
        <View style={styles.cusipRow}>
          <Text style={styles.cusipText}>
            CUSIP(s): {cusipList || 'N/A'}
          </Text>
        </View>

        {/* Proposals Section */}
        <View style={styles.proposalSection}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colLabel} />
            <View style={styles.colProposal} />
            <Text style={[styles.headerCell, styles.colVote]}>
              Vote{'\n'}Submitted
            </Text>
            <Text style={[styles.headerCell, styles.colPercent]}>
              % of{'\n'}Outstanding
            </Text>
            <Text style={[styles.headerCell, styles.colPercent]}>
              % of{'\n'}Total Voted
            </Text>
            <Text style={[styles.headerCell, styles.colPercentRight]}>
              % of{'\n'}Proposal Votes
            </Text>
          </View>

          {/* Proposals */}
          {proposals && proposals.length > 0 ? (
            proposals.map((proposal, index) => (
              <View key={index}>
                {/* Proposal Header */}
                <View style={styles.proposalHeader}>
                  <Text style={[styles.cellBold, styles.colLabel]}>
                    Proposal {proposal.proposalNumber}
                  </Text>
                  <Text style={[styles.cellBold, styles.colProposal]}>
                    {proposal.title}
                  </Text>
                </View>

                {/* Director Name if applicable */}
                {proposal.directorName && (
                  <View style={styles.proposalHeader}>
                    <Text style={[styles.cellBold, styles.colLabel]}>
                      Proposal {proposal.proposalNumber}
                    </Text>
                    <Text style={[styles.cellBold, styles.colProposal]}>
                      {proposal.directorName}
                    </Text>
                  </View>
                )}

                {/* Vote rows */}
                <View style={styles.tableRow}>
                  <Text style={[styles.cellBold, styles.colLabel]}>For</Text>
                  <View style={styles.colProposal} />
                  <Text style={[styles.cell, styles.colVote, styles.cellRight]}>
                    {formatNumber(proposal.voteFor)}
                  </Text>
                  <Text style={[styles.cell, styles.colPercent]}>
                    {formatPercent(proposal.percentOfOutstanding)}
                  </Text>
                  <Text style={[styles.cell, styles.colPercent]}>
                    {formatPercent(proposal.percentOfTotalVoted)}
                  </Text>
                  <Text style={[styles.cell, styles.colPercentRight]}>
                    {formatPercent(proposal.percentFor)}
                  </Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.cellBold, styles.colLabel]}>Against</Text>
                  <View style={styles.colProposal} />
                  <Text style={[styles.cell, styles.colVote, styles.cellRight]}>
                    {formatNumber(proposal.voteAgainst)}
                  </Text>
                  <Text style={[styles.cell, styles.colPercent]}>
                    {formatPercent(proposal.percentAgainst)}
                  </Text>
                  <Text style={[styles.cell, styles.colPercent]}>
                    {formatPercent(0)}
                  </Text>
                  <Text style={[styles.cell, styles.colPercentRight]}>
                    {formatPercent(0)}
                  </Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.cellBold, styles.colLabel]}>Abstain/Withold</Text>
                  <View style={styles.colProposal} />
                  <Text style={[styles.cell, styles.colVote, styles.cellRight]}>
                    {formatNumber(proposal.voteAbstain)}
                  </Text>
                  <Text style={[styles.cell, styles.colPercent]}>
                    {formatPercent(proposal.percentAbstain)}
                  </Text>
                  <Text style={[styles.cell, styles.colPercent]}>
                    {formatPercent(1.60)}
                  </Text>
                  <Text style={[styles.cell, styles.colPercentRight]}>
                    {formatPercent(1.60)}
                  </Text>
                </View>
              </View>
            ))) : (
            <View style={styles.tableRow}>
              <Text style={styles.cell}>No proposals to display</Text>
            </View>
          )}
        </View>

        {/* Page Number */}
        <Text style={styles.pageNumber}>Page 1 of 2</Text>
      </Page>
    </Document>
  )
}

// Main export function
export async function exportTabulationPdf(options: ExportOptions) {
  const { tabulationData, clientTicker } = options

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
      <TabulationPDFDocument
        tabulationData={tabulationData}
        clientTicker={clientTicker}
        clientLogoBase64={clientLogoBase64}
        betanxtLogoBase64={betanxtLogoBase64}
      />
    ).toBlob()

    // Create download link and trigger download
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    const fileName = `${tabulationData.companyName.replace(/\s+/g, '_')}_Tabulation_Report_${new Date().toISOString().split('T')[0]
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
