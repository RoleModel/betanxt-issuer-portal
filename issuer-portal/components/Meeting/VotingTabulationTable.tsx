'use client'

import { BNTypographyPair } from '@rolemodel/betanxt-design-system/components/BNTypographyPair'
import React from 'react'

import {
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'

import type { ProposalVoting } from '@/types/phases'
import { getTabulationHeaders } from '@/utils/votingOptions'

import SkeletonTable from '../ui/SkeletonTable'

interface VotingTabulationTableProps {
  proposals: ProposalVoting[]
  loading?: boolean
}

export default function VotingTabulationTable({
  proposals,
  loading = false,
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

  // Get appropriate headers based on proposal types in this table
  const votingLabels = getTabulationHeaders(proposals)


  if (loading) {
    return (
      <TableContainer>
        <SkeletonTable rows={4} columns={4} />
      </TableContainer>
    )
  }

  return (
    <TableContainer>
      <Table>
        <SROnlyTableCaption>Voting tabulation for proposals.</SROnlyTableCaption>
        <TableHead>
          <TableRow>
            <TableCell>Proposals</TableCell>
            <TableCell align="right">{votingLabels.for}</TableCell>
            <TableCell align="right">{votingLabels.against}</TableCell>
            <TableCell align="right">{votingLabels.abstain}</TableCell>
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
                  <Typography variant="body3" sx={{ fontWeight: 'medium' }}>
                    {proposal.proposalNumber} {proposal.description}
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
                      text: formatPercentage(proposal.votingResults.against.percentage),
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
                      text: formatPercentage(proposal.votingResults.abstain.percentage),
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

        </TableBody>
      </Table>
    </TableContainer>
  )
}
