'use client'

import React from 'react'

import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  styled,
} from '@mui/material'

import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import { formatNumber } from '@/utils/numberUtils'

interface DetailedTabulationTableProps {
  meetingId: string
}

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  '& .MuiTableCell-root': {
    padding: theme.spacing(1, 2),
    fontSize: '0.875rem',
  },
  '& .MuiTableCell-head': {
    fontWeight: 600,
    backgroundColor: theme.vars.palette.dataGridHeaderRow.restingFill,
  },
}))

const ProposalHeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.vars.palette.action.hover,
  fontWeight: 600,
  borderBottom: `1px solid ${theme.palette.divider}`,
}))

const VoteTypeCell = styled(TableCell)(({ theme }) => ({
  paddingLeft: theme.spacing(4),
  fontWeight: 500,
}))

export default function DetailedTabulationTable({
  meetingId,
}: DetailedTabulationTableProps) {
  const { proposals, votingSummary, loading } = useVotingTabulation(meetingId)

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading tabulation data...</Typography>
      </Box>
    )
  }

  if (!proposals.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No proposal data available</Typography>
      </Box>
    )
  }

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`

  // Calculate totals for percentage calculations
  const totalOutstanding = votingSummary?.totalSharesOutstanding || 0
  const totalVoted = votingSummary?.totalSharesVoted || 0

  return (
    <StyledTableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell align="right">Vote Submitted</TableCell>
            <TableCell align="right">% of Outstanding</TableCell>
            <TableCell align="right">% of Total Voted</TableCell>
            <TableCell align="right">% of Proposal Votes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* CUSIP Header */}
          <TableRow>
            <TableCell colSpan={5}>
              <Typography variant="dataCell">
                CUSIP (multiplier): Sample CUSIP Information
              </Typography>
            </TableCell>
          </TableRow>

          {proposals.map((proposal) => {
            return (
              <React.Fragment key={proposal.proposalId}>
                {/* Proposal Header */}
                <TableRow>
                  <ProposalHeaderCell colSpan={5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="dataHeader">
                        Proposal {proposal.proposalNumber}
                      </Typography>
                      <Typography variant="dataCell" color="text.secondary">
                        {proposal.description}
                      </Typography>
                    </Stack>
                  </ProposalHeaderCell>
                </TableRow>

                {/* For Votes */}
                <TableRow>
                  <VoteTypeCell>For</VoteTypeCell>
                  <TableCell align="right">
                    {formatNumber(proposal.votingResults.for.shares)}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(
                      totalOutstanding > 0
                        ? (proposal.votingResults.for.shares / totalOutstanding) * 100
                        : 0
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(
                      totalVoted > 0
                        ? (proposal.votingResults.for.shares / totalVoted) * 100
                        : 0
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(proposal.votingResults.for.percentage)}
                  </TableCell>
                </TableRow>

                {/* Against Votes */}
                <TableRow>
                  <VoteTypeCell>Against</VoteTypeCell>
                  <TableCell align="right">
                    {formatNumber(proposal.votingResults.against.shares)}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(
                      totalOutstanding > 0
                        ? (proposal.votingResults.against.shares / totalOutstanding) * 100
                        : 0
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(
                      totalVoted > 0
                        ? (proposal.votingResults.against.shares / totalVoted) * 100
                        : 0
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(proposal.votingResults.against.percentage)}
                  </TableCell>
                </TableRow>

                {/* Abstain/Withold Votes */}
                <TableRow>
                  <VoteTypeCell>Abstain/Withold</VoteTypeCell>
                  <TableCell align="right">
                    {formatNumber(proposal.votingResults.abstain.shares)}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(
                      totalOutstanding > 0
                        ? (proposal.votingResults.abstain.shares / totalOutstanding) * 100
                        : 0
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(
                      totalVoted > 0
                        ? (proposal.votingResults.abstain.shares / totalVoted) * 100
                        : 0
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(proposal.votingResults.abstain.percentage)}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </StyledTableContainer>
  )
}
