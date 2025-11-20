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
  brokerNonVote: number
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
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  clientLogo: {
    width: 50,
    height: 50,
  },
  betanxtLogo: {
    width: 60,
    height: 14,
    marginBottom: 4,
  },
  mediantLogo: {
    width: 60,
    height: 14,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  titleLeft: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#666666',
    textAlign: 'center',
  },
  infoSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    gap: 8,
  },
  infoCell: {
    flexDirection: 'row',
    gap: 4,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Roboto',
    color: '#1f1e1c',
  },
  infoValue: {
    fontSize: 8,
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
    marginTop: 16,
  },
  tableContainer: {
    borderWidth: 0.5,
    borderColor: '#333333',
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  proposalHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F487D',
    paddingVertical: 4,
    paddingHorizontal: 6,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  proposalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  proposalSubheader: {
    flexDirection: 'row',
    backgroundColor: '#1F487D',
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: '#A3E1EA',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  headerCell: {
    fontSize: 7,
    fontWeight: 700,
    fontFamily: 'Roboto',
    color: '#000000',
    textAlign: 'left',
    paddingHorizontal: 4,
    whiteSpace: 'nowrap',
  },
  cellBold: {
    fontSize: 7,
    fontWeight: 700,
    fontFamily: 'Roboto',
    paddingHorizontal: 4,
    whiteSpace: 'nowrap',
  },
  cell: {
    fontSize: 7,
    fontWeight: 400,
    fontFamily: 'Roboto',
    paddingHorizontal: 4,
    whiteSpace: 'nowrap',
  },
  cellRight: {
    textAlign: 'right',
  },
  cellLeft: {
    textAlign: 'left',
  },
  // Column widths - updated to match image layout with borders
  colEmpty: { width: '8%', minWidth: 50 },
  colVoteSubmitted: { width: '16%', minWidth: 95 },
  colAsPercentOS: { width: '13%', minWidth: 75, textAlign: 'right' },
  colAsPercentTotal: { width: '13%', minWidth: 80, textAlign: 'right' },
  colAsPercentProposal: { width: '13%', minWidth: 90, textAlign: 'right' },
  colAsPercentExcluding: { width: '20%', minWidth: 110, textAlign: 'right' },
  colBrokerNonVote: { width: '17%', minWidth: 90, textAlign: 'right' },
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
    brokerNonVote,
    proposals,
  } = tabulationData

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
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
          <View style={{ marginBottom: 8, textAlign: 'center' }}>
            <Text style={styles.title}>US TABULATION PROPOSAL REPORT</Text>
            <Text style={styles.subtitle}>
              Run Date: {new Date().toLocaleString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}
            </Text>
          </View>
          <View>
            {betanxtLogoUrl ? (
              <PDFImage style={styles.betanxtLogo} src={betanxtLogoUrl} />
            ) : (
              <Text style={styles.betanxtText}>BetaNXT</Text>
            )}
          </View>
        </View>


        {/* Meeting Information Table - 5 rows, 4 columns */}
        <View style={{ marginBottom: 8, fontSize: 8 }}>
          {/* Row 1 */}
          <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={[styles.infoLabel, { width: '15%' }]}>Company Name:</Text>
            <Text style={[styles.infoValue, { width: '35%' }]}>{companyName}</Text>
            <Text style={[styles.infoLabel, { width: '35%', textAlign: 'right' }]}>Total Outstanding:</Text>
            <Text style={[styles.infoValue, { width: '15%', textAlign: 'right' }]}>{formatNumber(totalOutstanding)}</Text>
          </View>

          {/* Row 2 */}
          <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={[styles.infoLabel, { width: '15%' }]}>Type:</Text>
            <Text style={[styles.infoValue, { width: '35%' }]}>{meetingType}</Text>
            <Text style={[styles.infoLabel, { width: '35%', textAlign: 'right' }]}>Votes Represented for Quorum:</Text>
            <Text style={[styles.infoValue, { width: '15%', textAlign: 'right' }]}>{formatNumber(votesRepresentedForQuorum)}</Text>
          </View>

          {/* Row 3 */}
          <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={[styles.infoLabel, { width: '15%' }]}>Meeting Date:</Text>
            <Text style={[styles.infoValue, { width: '35%' }]}>{formatDate(meetingDate)}</Text>
            <Text style={[styles.infoLabel, { width: '35%', textAlign: 'right' }]}>Quorum:</Text>
            <Text style={[styles.infoValue, { width: '15%', textAlign: 'right' }]}>{formatPercent(quorumPercentage)}</Text>
          </View>

          {/* Row 4 */}
          <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={[styles.infoLabel, { width: '15%' }]}>Record Date:</Text>
            <Text style={[styles.infoValue, { width: '35%' }]}>{formatDate(recordDate)}</Text>
            <Text style={[styles.infoLabel, { width: '35%', textAlign: 'right' }]}>% Needed for Quorum:</Text>
            <Text style={[styles.infoValue, { width: '15%', textAlign: 'right' }]}>{quorumRequirement} + 1 Vote</Text>
          </View>

          {/* Row 5 */}
          <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={[styles.infoLabel, { width: '15%' }]}>CUSIP(s) (multiplier):</Text>
            <Text style={[styles.infoValue, { width: '35%' }]}>{cusipList ?? 'N/A'}</Text>
            <Text style={[styles.infoLabel, { width: '35%', textAlign: 'right' }]}>Votes over / (under) Quorum:</Text>
            <Text style={[styles.infoValue, { width: '15%', textAlign: 'right' }]}>{formatNumber(votesOverUnderQuorum)}</Text>
          </View>


        </View>

        {/* CUSIP Information */}


        {/* Proposals Section */}
        <View style={styles.proposalSection}>
          {/* Render proposals by grouping director elections */}
          {proposals && proposals.length > 0 ? (
            (() => {
              // Group proposals by type
              const directorProposals = proposals.filter(p => p.directorName)
              const otherProposals = proposals.filter(p => !p.directorName)

              return (
                <>
                  {directorProposals.length > 0 && (
                    <View style={styles.proposalSection}>
                      {directorProposals.map((proposal, index) => {
                        const totalVotes = proposal.voteFor + proposal.voteAgainst + proposal.voteAbstain
                        const excludingAbstain = proposal.voteFor + proposal.voteAgainst
                        return (
                          <View key={`director-${index}`} style={styles.tableContainer} wrap={false}>
                            <View style={styles.proposalHeader}>
                              <Text style={[styles.cellBold, { color: '#ffffff' }]}>
                                Proposal {proposal.proposalNumber}
                              </Text>
                              <Text style={[styles.cellBold, styles.cellLeft, { color: '#ffffff' }]}>
                                {proposal.directorName}
                              </Text>
                            </View>
                            <View style={styles.tableHeader}>
                              <View style={styles.colEmpty} />
                              <Text style={[styles.headerCell, styles.colVoteSubmitted, styles.cellRight]}>VOTES Submitted</Text>
                              <Text style={[styles.headerCell, styles.colAsPercentOS, styles.cellRight]}>As % of O/S</Text>
                              <Text style={[styles.headerCell, styles.colAsPercentTotal, styles.cellRight]}>As % TOTAL Voted</Text>
                              <Text style={[styles.headerCell, styles.colAsPercentProposal, styles.cellRight]}>As % of Proposal Votes</Text>
                              <Text style={[styles.headerCell, styles.colAsPercentExcluding, styles.cellRight]}>As % of Proposal Votes{'\n'}(Excluding Withhold/Abstain)</Text>
                              <Text style={[styles.headerCell, styles.colBrokerNonVote, styles.cellRight]}>Broker Non Vote</Text>
                            </View>
                            <View style={styles.tableRow}>
                              <Text style={[styles.cellBold, { width: '10%' }]}>For</Text>
                              <Text style={[styles.cell, styles.colVoteSubmitted, styles.cellRight]}>
                                {formatNumber(proposal.voteFor)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentOS, styles.cellRight]}>
                                {formatPercent((proposal.voteFor / totalOutstanding) * 100)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentTotal, styles.cellRight]}>
                                {formatPercent((proposal.voteFor / votesRepresentedForQuorum) * 100)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentProposal, styles.cellRight]}>
                                {formatPercent(proposal.percentFor)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentExcluding, styles.cellRight]}>
                                {formatPercent((proposal.voteFor / excludingAbstain) * 100)}
                              </Text>
                              <Text style={[styles.cell, styles.colBrokerNonVote, styles.cellRight]}>
                                {formatNumber(brokerNonVote)}
                              </Text>
                            </View>
                            <View style={styles.tableRowAlt}>
                              <Text style={[styles.cellBold, { width: '10%' }]}>Against</Text>
                              <Text style={[styles.cell, styles.colVoteSubmitted, styles.cellRight]}>
                                {formatNumber(proposal.voteAgainst)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentOS, styles.cellRight]}>
                                {formatPercent((proposal.voteAgainst / totalOutstanding) * 100)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentTotal, styles.cellRight]}>
                                {formatPercent((proposal.voteAgainst / votesRepresentedForQuorum) * 100)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentProposal, styles.cellRight]}>
                                {formatPercent(proposal.percentAgainst)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentExcluding, styles.cellRight]}>
                                {formatPercent((proposal.voteAgainst / excludingAbstain) * 100)}
                              </Text>
                              <Text style={[styles.cell, styles.colBrokerNonVote, styles.cellRight]} />
                            </View>
                            <View style={styles.tableRow}>
                              <Text style={[styles.cellBold, { width: '10%' }]}>Withhold/Abstain</Text>
                              <Text style={[styles.cell, styles.colVoteSubmitted, styles.cellRight]}>
                                {formatNumber(proposal.voteAbstain)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentOS, styles.cellRight]}>
                                {formatPercent((proposal.voteAbstain / totalOutstanding) * 100)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentTotal, styles.cellRight]}>
                                {formatPercent((proposal.voteAbstain / votesRepresentedForQuorum) * 100)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentProposal, styles.cellRight]}>
                                {formatPercent(proposal.percentAbstain)}
                              </Text>
                              <Text style={[styles.cell, styles.colAsPercentExcluding, styles.cellRight]} />
                              <Text style={[styles.cell, styles.colBrokerNonVote, styles.cellRight]} />
                            </View>
                            <View style={[styles.tableRow, { backgroundColor: '#FFFFFF' }]}>
                              <Text style={[styles.cellBold, { width: '10%' }]} />
                              <Text style={[styles.cellBold, styles.colVoteSubmitted]}>
                                {formatNumber(totalVotes)}
                              </Text>
                              <Text style={[styles.cellBold, styles.colAsPercentOS]} />
                              <Text style={[styles.cellBold, styles.colAsPercentTotal]} />
                              <Text style={[styles.cellBold, styles.colAsPercentProposal]} />
                              <Text style={[styles.cellBold, styles.colAsPercentExcluding]} />
                              <Text style={[styles.cellBold, styles.colBrokerNonVote]} />
                            </View>
                          </View>
                        )
                      })}
                    </View>
                  )}

                  {/* Other Proposals */}
                  {otherProposals.map((proposal, proposalIndex) => {
                    const totalVotes = proposal.voteFor + proposal.voteAgainst + proposal.voteAbstain
                    const excludingAbstain = proposal.voteFor + proposal.voteAgainst

                    return (
                      <View key={`other-${proposalIndex}`} style={styles.tableContainer} wrap={false}>
                        {/* Proposal Header */}
                        <View style={styles.proposalHeader}>
                          <Text style={[styles.cellBold, { color: '#ffffff' }]}>
                            Proposal {proposal.proposalNumber}
                          </Text>
                          <Text style={[styles.cellBold, styles.cellLeft, { color: '#ffffff' }]}>
                            {proposal.title}
                          </Text>
                        </View>

                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                          <View style={styles.colEmpty} />
                          <Text style={[styles.headerCell, styles.colVoteSubmitted, styles.cellRight]}>
                            VOTES Submitted
                          </Text>
                          <Text style={[styles.headerCell, styles.colAsPercentOS, styles.cellRight]}>
                            As % of O/S
                          </Text>
                          <Text style={[styles.headerCell, styles.colAsPercentTotal, styles.cellRight]}>
                            As % TOTAL Voted
                          </Text>
                          <Text style={[styles.headerCell, styles.colAsPercentProposal, styles.cellRight]}>
                            As % of Proposal Votes
                          </Text>
                          <Text style={[styles.headerCell, styles.colAsPercentExcluding, styles.cellRight]}>
                            As % of Proposal Votes{'\n'}(Excluding Withhold/Abstain)
                          </Text>
                          <Text style={[styles.headerCell, styles.colBrokerNonVote, styles.cellRight]}>
                            Broker Non Vote
                          </Text>
                        </View>

                        {/* For Row */}
                        <View style={styles.tableRow}>
                          <Text style={[styles.cellBold, { width: '10%' }]}>For</Text>
                          <Text style={[styles.cell, styles.colVoteSubmitted, styles.cellRight]}>
                            {formatNumber(proposal.voteFor)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentOS, styles.cellRight]}>
                            {formatPercent((proposal.voteFor / totalOutstanding) * 100)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentTotal, styles.cellRight]}>
                            {formatPercent((proposal.voteFor / votesRepresentedForQuorum) * 100)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentProposal, styles.cellRight]}>
                            {formatPercent(proposal.percentFor)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentExcluding, styles.cellRight]}>
                            {formatPercent((proposal.voteFor / excludingAbstain) * 100)}
                          </Text>
                          <Text style={[styles.cell, styles.colBrokerNonVote, styles.cellRight]}>
                            {formatNumber(brokerNonVote)}
                          </Text>
                        </View>

                        {/* Against Row */}
                        <View style={styles.tableRowAlt}>
                          <Text style={[styles.cellBold, { width: '10%' }]}>Against</Text>
                          <Text style={[styles.cell, styles.colVoteSubmitted, styles.cellRight]}>
                            {formatNumber(proposal.voteAgainst)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentOS, styles.cellRight]}>
                            {formatPercent((proposal.voteAgainst / totalOutstanding) * 100)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentTotal, styles.cellRight]}>
                            {formatPercent((proposal.voteAgainst / votesRepresentedForQuorum) * 100)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentProposal, styles.cellRight]}>
                            {formatPercent(proposal.percentAgainst)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentExcluding, styles.cellRight]}>
                            {formatPercent((proposal.voteAgainst / excludingAbstain) * 100)}
                          </Text>
                          <Text style={[styles.cell, styles.colBrokerNonVote, styles.cellRight]} />
                        </View>

                        {/* Abstain Row */}
                        <View style={styles.tableRow}>
                          <Text style={[styles.cellBold, { width: '10%' }]}>Abstain</Text>
                          <Text style={[styles.cell, styles.colVoteSubmitted, styles.cellRight]}>
                            {formatNumber(proposal.voteAbstain)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentOS, styles.cellRight]}>
                            {formatPercent((proposal.voteAbstain / totalOutstanding) * 100)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentTotal, styles.cellRight]}>
                            {formatPercent((proposal.voteAbstain / votesRepresentedForQuorum) * 100)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentProposal, styles.cellRight]}>
                            {formatPercent(proposal.percentAbstain)}
                          </Text>
                          <Text style={[styles.cell, styles.colAsPercentExcluding, styles.cellRight]} />
                          <Text style={[styles.cell, styles.colBrokerNonVote, styles.cellRight]} />
                        </View>

                        {/* Total Row */}
                        <View style={[styles.tableRow, { backgroundColor: '#FFFFFF' }]}>
                          <Text style={[styles.cellBold, { width: '10%' }]} />
                          <Text style={[styles.cellBold, styles.colVoteSubmitted]}>
                            {formatNumber(totalVotes)}
                          </Text>
                          <Text style={[styles.cellBold, styles.colAsPercentOS]} />
                          <Text style={[styles.cellBold, styles.colAsPercentTotal]} />
                          <Text style={[styles.cellBold, styles.colAsPercentProposal]} />
                          <Text style={[styles.cellBold, styles.colAsPercentExcluding]} />
                          <Text style={[styles.cellBold, styles.colBrokerNonVote]} />
                        </View>
                      </View>
                    )
                  })}
                </>
              )
            })()
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

// Helper function to convert image URL to base64
async function imageUrlToBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch image: ${url} - Status: ${response.status}`)
      return undefined
    }
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (result && result.startsWith('data:')) {
          resolve(result)
        } else {
          console.error('Invalid base64 result for:', url)
          resolve(undefined)
        }
      }
      reader.onerror = () => {
        console.error('FileReader error for:', url)
        reject(new Error('Failed to read file'))
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to convert image to base64:', url, error)
    return undefined
  }
}

// Main export function
export async function exportTabulationPdf(options: ExportOptions) {
  const { tabulationData, clientTicker } = options

  try {
    // Use absolute URLs for production compatibility
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Convert images to base64 for PDF generation
    const clientLogoUrl = clientTicker
      ? await imageUrlToBase64(`${baseUrl}/logos/${clientTicker.toUpperCase()}_logo.png`)
      : undefined
    const betanxtLogoUrl = await imageUrlToBase64(`${baseUrl}/images/betanxt-logo.png`)

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
