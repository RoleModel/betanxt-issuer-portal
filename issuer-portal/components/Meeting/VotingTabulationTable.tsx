"use client";

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
} from "@mui/material";

import type { ProposalVoting } from "@/types/phases";

import SROnlyTableCaption from "@/components/ui/SROnlyTableCaption";
import { useMeeting } from "@/contexts/MeetingContext";
import { getTabulationHeaders } from "@/utils/votingOptions";

import SkeletonTable from "../ui/SkeletonTable";

interface VotingTabulationTableProps {
  proposals: ProposalVoting[];
  loading?: boolean;
}

/**
 * Per-proposal voting results table showing the For / Against / Abstain share
 * buckets with percentages. The aggregate "Total Votes" column was removed in
 * favor of the per-bucket breakdown (002-tabulation-enhancements).
 */
const VotingTabulationTable = ({
  proposals,
  loading = false,
}: VotingTabulationTableProps) => {
  const { currentMeeting } = useMeeting();

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  // Get appropriate headers based on proposal types in this table
  const votingLabels = getTabulationHeaders(proposals, currentMeeting?.ticker);

  if (loading) {
    return (
      <TableContainer>
        <SkeletonTable rows={4} columns={5} />
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <Table>
        <SROnlyTableCaption>
          Voting tabulation for proposals.
        </SROnlyTableCaption>
        <TableHead>
          <TableRow>
            <TableCell>Proposals</TableCell>
            <TableCell sx={{ width: "100px" }}>
              Management Recommendation
            </TableCell>
            <TableCell align="right">{votingLabels.for}</TableCell>
            <TableCell align="right">{votingLabels.against}</TableCell>
            <TableCell align="right">{votingLabels.abstain}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {proposals.map((proposal) => (
            <TableRow
              key={proposal.proposalId}
              sx={{ "&:hover": { backgroundColor: "action.hover" } }}
            >
              <TableCell>
                <Box>
                  <Typography variant="body3" sx={{ fontWeight: "medium" }}>
                    {proposal.proposalNumber}. {proposal.description}
                  </Typography>
                </Box>
              </TableCell>

              <TableCell>
                <Typography variant="body3">
                  {proposal.recommendation || "N/A"}
                </Typography>
              </TableCell>

              <TableCell align="right">
                <Box>
                  <Typography
                    variant="body3"
                    fontWeight="medium"
                    sx={{ textAlign: "left" }}
                  >
                    {formatPercentage(proposal.votingResults.for.percentage)}
                  </Typography>
                  <LinearProgress
                    color="chartSeries[0].main"
                    variant="determinate"
                    value={proposal.votingResults.for.percentage}
                  />
                </Box>
              </TableCell>

              <TableCell align="right">
                <Box>
                  <Typography
                    variant="body3"
                    fontWeight="medium"
                    sx={{ textAlign: "left" }}
                  >
                    {formatPercentage(
                      proposal.votingResults.against.percentage
                    )}
                  </Typography>
                  <LinearProgress
                    color="chartSeries[3].main"
                    variant="determinate"
                    value={proposal.votingResults.against.percentage}
                  />
                </Box>
              </TableCell>

              <TableCell align="right">
                <Box>
                  <Typography
                    variant="body3"
                    fontWeight="medium"
                    sx={{ textAlign: "left" }}
                  >
                    {formatPercentage(
                      proposal.votingResults.abstain.percentage
                    )}
                  </Typography>
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
  );
};

export default VotingTabulationTable;
