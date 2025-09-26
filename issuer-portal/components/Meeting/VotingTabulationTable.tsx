'use client'

import { BNTypographyPair } from '@rolemodel/betanxt-design-system/components/BNTypographyPair'
import React from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  styled,
} from '@mui/material'

import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'

import type { ProposalVoting } from '@/types/phases'

interface VotingTabulationTableProps {
  proposals: ProposalVoting[]
  loading?: boolean
  onViewTabulation?: () => void
}

export default function VotingTabulationTable({
  proposals,
  loading = false,
  onViewTabulation,
}: VotingTabulationTableProps) {
  const formatShares = (shares: number) => {
    return shares.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader title="Tabulation" />
        <CardContent>
          <Typography>Loading voting data...</Typography>
        </CardContent>
      </Card>
    )
  }

  const TotalsRow = styled('tr')(({ theme }) => [
    {
      backgroundColor: theme.vars?.palette.grey[50],
    },
    theme.applyStyles('dark', {
      backgroundColor: theme.vars?.palette.grey[900],
    }),
  ])

  return (
    <Card>
      <CardHeader
        title="Tabulation"
        action={
          <Button
            variant="outlined"
            onClick={onViewTabulation}
            sx={{ textTransform: 'none' }}
          >
            View Tabulation
          </Button>
        }
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <SROnlyTableCaption>Voting tabulation for proposals.</SROnlyTableCaption>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Proposals</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  For
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Against
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Abstain
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow
                  key={proposal.proposalId}
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {proposal.proposalNumber}. {proposal.description}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    <Box>
                      <BNTypographyPair
                        fullWidth={true}
                        split={true}
                        primary={{
                          variant: 'body3',
                          fontWeight: 'medium',
                          sx: { textAlign: 'left' },
                          text: formatPercentage(proposal.votingResults.for.percentage),
                        }}
                        secondary={{
                          variant: 'body3',
                          text: formatShares(proposal.votingResults.for.shares),
                        }}
                      />
                      <LinearProgress
                        color="chartSeries[0].main"
                        variant="determinate"
                        value={proposal.votingResults.for.percentage}
                      />
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    <Box>
                      <BNTypographyPair
                        fullWidth={true}
                        split={true}
                        primary={{
                          variant: 'body3',
                          fontWeight: 'medium',
                          sx: { textAlign: 'left' },
                          text: formatPercentage(
                            proposal.votingResults.against.percentage
                          ),
                        }}
                        secondary={{
                          variant: 'body3',
                          text: formatShares(proposal.votingResults.against.shares),
                        }}
                      />
                      <LinearProgress
                        color="chartSeries[3].main"
                        variant="determinate"
                        value={proposal.votingResults.against.percentage}
                      />
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    <Box>
                      <BNTypographyPair
                        fullWidth={true}
                        split={true}
                        primary={{
                          variant: 'body3',
                          fontWeight: 'medium',
                          sx: { textAlign: 'left' },
                          text: formatPercentage(
                            proposal.votingResults.abstain.percentage
                          ),
                        }}
                        secondary={{
                          variant: 'body3',
                          text: formatShares(proposal.votingResults.abstain.shares),
                        }}
                      />
                      <LinearProgress
                        color="chartSeries[2].main"
                        variant="determinate"
                        value={proposal.votingResults.abstain.percentage}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals row */}
              {proposals.length > 0 && (
                <TotalsRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Totals</TableCell>
                  <TableCell align="right">
                    <Box>
                      <BNTypographyPair
                        fullWidth={true}
                        split={true}
                        primary={{
                          variant: 'body3',
                          fontWeight: 'medium',
                          sx: { textAlign: 'left' },
                          text: formatPercentage(
                            proposals.reduce(
                              (sum, p) => sum + p.votingResults.for.percentage,
                              0
                            ) / proposals.length
                          ),
                        }}
                        secondary={{
                          variant: 'body3',
                          text: formatShares(
                            proposals.reduce(
                              (sum, p) => sum + p.votingResults.for.shares,
                              0
                            )
                          ),
                        }}
                      />
                      <LinearProgress
                        color="chartSeries[0].main"
                        variant="determinate"
                        value={
                          proposals.reduce(
                            (sum, p) => sum + p.votingResults.for.percentage,
                            0
                          ) / proposals.length
                        }
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box>
                      <BNTypographyPair
                        fullWidth={true}
                        split={true}
                        primary={{
                          variant: 'body3',
                          fontWeight: 'medium',
                          sx: { textAlign: 'left' },
                          text: formatPercentage(
                            proposals.reduce(
                              (sum, p) => sum + p.votingResults.against.percentage,
                              0
                            ) / proposals.length
                          ),
                        }}
                        secondary={{
                          variant: 'body3',
                          text: formatShares(
                            proposals.reduce(
                              (sum, p) => sum + p.votingResults.against.shares,
                              0
                            )
                          ),
                        }}
                      />
                      <LinearProgress
                        color="chartSeries[3].main"
                        variant="determinate"
                        value={
                          proposals.reduce(
                            (sum, p) => sum + p.votingResults.against.percentage,
                            0
                          ) / proposals.length
                        }
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box>
                      <BNTypographyPair
                        fullWidth={true}
                        split={true}
                        primary={{
                          variant: 'body3',
                          fontWeight: 'medium',
                          sx: { textAlign: 'left' },
                          text: formatPercentage(
                            proposals.reduce(
                              (sum, p) => sum + p.votingResults.abstain.percentage,
                              0
                            ) / proposals.length
                          ),
                        }}
                        secondary={{
                          variant: 'body3',
                          text: formatShares(
                            proposals.reduce(
                              (sum, p) => sum + p.votingResults.abstain.shares,
                              0
                            )
                          ),
                        }}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={
                          proposals.reduce(
                            (sum, p) => sum + p.votingResults.abstain.percentage,
                            0
                          ) / proposals.length
                        }
                      />
                    </Box>
                  </TableCell>
                </TotalsRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}
