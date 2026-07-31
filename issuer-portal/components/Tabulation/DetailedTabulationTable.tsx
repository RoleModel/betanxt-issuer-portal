"use client";

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
} from "@mui/material";
import React from "react";

import { useMeeting } from "@/contexts/MeetingContext";
import { useVotingTabulation } from "@/hooks/use-voting-tabulation";
import { formatNumber } from "@/utils/number-utilities";
import { getVotingOptions } from "@/utils/votingOptions";

interface DetailedTabulationTableProps {
  readonly meetingId: string;
}

const StyledTableContainer = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => {
  return (
    <TableContainer
      sx={[
        (theme) => ({
          maxHeight: 900,
          "& .MuiTableCell-root": {
            padding: theme.spacing(1, 2),
            fontSize: "0.875rem",
          },
          "& .MuiTableCell-head": {
            fontWeight: 600,
            backgroundColor: theme.vars.palette.dataGridHeaderRow.restingFill,
          },
        }),
        (theme) =>
          theme.applyStyles("dark", {
            backgroundColor: theme.palette.common.black,
            "& .MuiTableCell-head": {
              fontWeight: 600,
              backgroundColor: theme.palette.common.black,
            },
          }),
      ]}
    >
      {children}
    </TableContainer>
  );
};

const ProposalHeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.vars.palette.action.hover,
  fontWeight: 600,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const VoteTypeCell = styled(TableCell)(({ theme }) => ({
  paddingLeft: theme.spacing(4),
  fontWeight: 500,
}));

const TotalsRow = ({ children }: { readonly children: React.ReactNode }) => {
  return (
    <TableRow
      sx={[
        (theme) => ({
          backgroundColor: theme.palette.common.white,
          // boxShadow: `0 1px 0px 0px inset ${theme.palette.divider}`,
        }),
        (theme) =>
          theme.applyStyles("dark", {
            backgroundColor: theme.palette.common.black,
          }),
      ]}
    >
      {children}
    </TableRow>
  );
};

const TotalsHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  paddingLeft: theme.spacing(2),
}));

const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

const DetailedTabulationTable = ({
  meetingId,
}: DetailedTabulationTableProps) => {
  const { currentMeeting } = useMeeting();
  const { proposals, votingSummary, loading } = useVotingTabulation(meetingId);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading tabulation data...</Typography>
      </Box>
    );
  }

  if (!proposals.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No proposal data available</Typography>
      </Box>
    );
  }

  // Calculate totals for percentage calculations
  const totalOutstanding = votingSummary?.totalSharesOutstanding ?? 0;

  return (
    <StyledTableContainer>
      <Table stickyHeader aria-label="Tabulation Details">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell align="right">Vote Submitted</TableCell>
            <TableCell align="right">% of Outstanding</TableCell>
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
            const votingLabels = getVotingOptions(
              proposal.proposalType,
              proposal.proposalNumber,
              currentMeeting?.ticker,
              proposal.directorName
            );

            // Calculate total votes for this proposal
            const proposalTotal =
              proposal.votingResults.for.shares +
              proposal.votingResults.against.shares +
              proposal.votingResults.abstain.shares;

            return (
              <React.Fragment key={proposal.proposalId}>
                {/* Proposal Header */}
                <TableRow>
                  <ProposalHeaderCell colSpan={4}>
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
                  <VoteTypeCell>{votingLabels.for}</VoteTypeCell>
                  <TableCell align="right">
                    {formatNumber(proposal.votingResults.for.shares)}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(
                      totalOutstanding > 0
                        ? (proposal.votingResults.for.shares /
                            totalOutstanding) *
                            100
                        : 0
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(proposal.votingResults.for.percentage)}
                  </TableCell>
                </TableRow>

                {/* Against/Withhold Votes */}
                <TableRow>
                  <VoteTypeCell>{votingLabels.against}</VoteTypeCell>
                  <TableCell align="right">
                    {formatNumber(proposal.votingResults.against.shares)}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(
                      totalOutstanding > 0
                        ? (proposal.votingResults.against.shares /
                            totalOutstanding) *
                            100
                        : 0
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(
                      proposal.votingResults.against.percentage
                    )}
                  </TableCell>
                </TableRow>

                {/* Abstain Votes */}
                <TableRow>
                  <VoteTypeCell>{votingLabels.abstain}</VoteTypeCell>
                  <TableCell align="right">
                    {formatNumber(proposal.votingResults.abstain.shares)}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(
                      totalOutstanding > 0
                        ? (proposal.votingResults.abstain.shares /
                            totalOutstanding) *
                            100
                        : 0
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercentage(
                      proposal.votingResults.abstain.percentage
                    )}
                  </TableCell>
                </TableRow>

                {/* Proposal Total */}
                <TotalsRow>
                  <TotalsHeaderCell>
                    <Typography variant="dataHeader">Total</Typography>
                  </TotalsHeaderCell>
                  <TableCell align="right">
                    <Typography variant="dataHeader">
                      {formatNumber(proposalTotal)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="dataHeader">
                      {formatPercentage(
                        totalOutstanding > 0
                          ? (proposalTotal / totalOutstanding) * 100
                          : 0
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="dataHeader">100.00%</Typography>
                  </TableCell>
                </TotalsRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
};

export default DetailedTabulationTable;
