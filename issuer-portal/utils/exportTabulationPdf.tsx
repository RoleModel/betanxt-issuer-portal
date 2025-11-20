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
  reportTitle?: string // Optional custom title (Preliminary vs Final)
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
    width: 60,
    height: 60,
  },
  betanxtLogo: {
    width: 73,
    height: 17,
  },
  titleSection: {
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
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
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  infoLabel: {
    fontSize: 7,
    fontWeight: 400,
    fontFamily: 'Roboto',
    color: '#1f1e1c',
    letterSpacing: 0.13,
  },
  infoValue: {
    fontSize: 7,
    fontWeight: 400,
    fontFamily: 'Roboto',
    color: '#1f1e1c',
  },
  cusipRow: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  cusipText: {
    fontSize: 7,
    fontFamily: 'Roboto',
    color: '#1f1e1c',
  },
  proposalSection: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  proposalHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 4,
    whiteSpace: 'nowrap'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  headerCell: {
    fontSize: 7,
    fontWeight: 500,
    fontFamily: 'Roboto',
    letterSpacing: 0.21,
    whiteSpace: 'nowrap',
  },
  cellBold: {
    fontSize: 7,
    fontWeight: 500,
    fontFamily: 'Roboto',
    letterSpacing: 0.21,
    whiteSpace: 'nowrap'
  },
  cell: {
    fontSize: 7,
    fontWeight: 400,
    fontFamily: 'Roboto',
    letterSpacing: 0.13,
    whiteSpace: 'nowrap'
  },
  cellRight: {
    textAlign: 'right',
  },
  // Column widths
  colLabel: { width: '100%', whiteSpace: 'nowrap' },
  colProposal: { flex: 1 },
  colVote: { width: '30%', textAlign: 'right', whiteSpace: 'nowrap', wordBreak: "keep-all" },
  colPercent: { width: '30%', textAlign: 'right', whiteSpace: 'nowrap', wordBreak: "keep-all" },
  colPercentRight: { width: '30%', textAlign: 'right', whiteSpace: 'nowrap', wordBreak: "keep-all" },
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
    fontSize: 7,
    fontFamily: 'Roboto',
    color: '#1f1e1c',
  },
})

// Format number with thousand separators and decimals
const formatNumber = (num: number, decimals = 2): string => {
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
  clientLogoUrl?: string
  betanxtLogoUrl?: string
}

// Tabulation PDF Document Component
const TabulationPDFDocument: React.FC<TabulationPDFDocumentProps> = ({
  tabulationData,
  clientTicker,
  clientLogoUrl,
  betanxtLogoUrl,
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
            {clientLogoUrl ? (
              <PDFImage style={styles.clientLogo} src={clientLogoUrl} />
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

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {tabulationData.reportTitle || 'Preliminary Tabulation Results'}
          </Text>
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
              <Text style={styles.infoValue}>
                {formatNumber(votesRepresentedForQuorum)}
              </Text>
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
          <Text style={styles.cusipText}>CUSIP(s): {cusipList ?? 'N/A'}</Text>
        </View>

        {/* Proposals Section */}
        <View style={styles.proposalSection}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colLabel} />
            <View style={styles.colProposal} />
            <Text style={[styles.headerCell, styles.colVote]}>Vote{'\n'}Submitted</Text>
            <Text style={[styles.headerCell, styles.colPercent]}>
              % of{'\n'}Outstanding
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
                    Proposal {proposal.proposalNumber} {proposal.title}
                  </Text>
                </View>

                {/* Vote rows */}
                <View style={styles.tableRow}>
                  <Text style={[styles.cellBold, styles.colLabel]}>For</Text>
                  <View style={styles.colProposal} />
                  <Text style={[styles.cell, styles.colVote, styles.cellRight]}>
                    {formatNumber(proposal.voteFor)}
                  </Text>
                  <Text style={[styles.cell, styles.colPercent]}>
                    {formatPercent(
                      tabulationData.totalOutstanding > 0
                        ? (proposal.voteFor / tabulationData.totalOutstanding) * 100
                        : 0
                    )}
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
                    {formatPercent(
                      tabulationData.totalOutstanding > 0
                        ? (proposal.voteAgainst / tabulationData.totalOutstanding) * 100
                        : 0
                    )}
                  </Text>
                  <Text style={[styles.cell, styles.colPercentRight]}>
                    {formatPercent(proposal.percentAgainst)}
                  </Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.cellBold, styles.colLabel]}>Abstain/Withold</Text>
                  <View style={styles.colProposal} />
                  <Text style={[styles.cell, styles.colVote, styles.cellRight]}>
                    {formatNumber(proposal.voteAbstain)}
                  </Text>
                  <Text style={[styles.cell, styles.colPercent]}>
                    {formatPercent(
                      tabulationData.totalOutstanding > 0
                        ? (proposal.voteAbstain / tabulationData.totalOutstanding) * 100
                        : 0
                    )}
                  </Text>
                  <Text style={[styles.cell, styles.colPercentRight]}>
                    {formatPercent(proposal.percentAbstain)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
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
    // Use direct image URLs (no base64 conversion needed)
    const clientLogoUrl = clientTicker
      ? `/logos/${clientTicker.toLowerCase()}_logo.png`
      : undefined
    const betanxtLogoUrl = '/images/betanxt-logo.png'

    // Generate the PDF
    const pdfBlob = await pdf(
      <TabulationPDFDocument
        tabulationData={tabulationData}
        clientTicker={clientTicker}
        clientLogoUrl={clientLogoUrl}
        betanxtLogoUrl={betanxtLogoUrl}
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
