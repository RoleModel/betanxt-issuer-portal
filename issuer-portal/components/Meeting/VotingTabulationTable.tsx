"use client";

import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import type { ProposalVoting } from "@/types/phases";

import { useMeeting } from "@/contexts/MeetingContext";
import { useTabulationDisplay } from "@/contexts/TabulationDisplayContext";
import {
  formatTabulationMetric,
  formatTabulationPercentage,
} from "@/utils/tabulation-display";
import {
  getDistinctStringValues,
  numericFilterOperators,
  singleSelectFilterOperators,
  textFilterOperators,
} from "@/utils/tabulation-grid-filter-operators";
import { getTabulationHeaders } from "@/utils/votingOptions";

interface VotingTabulationTableProps {
  readonly proposals: readonly ProposalVoting[];
  readonly loading?: boolean;
}

interface ProposalGridRow {
  readonly id: string;
  readonly proposal: string;
  readonly isSubProposal: boolean;
  /** Label-only row introducing the director block; renders no vote metrics. */
  readonly isGroupHeader?: boolean;
  readonly recommendation: string;
  readonly forPercentage: number;
  readonly forShares: number;
  readonly againstPercentage: number;
  readonly againstShares: number;
  readonly abstainPercentage: number;
  readonly abstainShares: number;
  readonly brokerNonVote: number;
  readonly totalSharesVoted: number;
}

const VotingMetricCell = ({
  percentage,
  shares,
  totalShares,
  color,
}: {
  readonly percentage: number;
  readonly shares: number;
  readonly totalShares: number;
  readonly color: "primary" | "secondary" | "warning";
}) => {
  const { displayMode } = useTabulationDisplay();
  const isPercentage = displayMode === "percentages";
  const display = isPercentage
    ? formatTabulationPercentage(percentage)
    : formatTabulationMetric(shares, 1, "numbers").display;
  const alternate = isPercentage
    ? formatTabulationMetric(shares, 1, "numbers").display
    : formatTabulationPercentage(percentage);
  const accessibleValue =
    displayMode === "numbers"
      ? `${display} shares (${alternate})`
      : `${display} (${alternate} shares)`;
  const progressValue = isPercentage
    ? percentage
    : totalShares > 0
      ? (shares / totalShares) * 100
      : 0;

  return (
    <Tooltip title={alternate}>
      <Box sx={{ width: "100%" }}>
        <Typography variant="body3" fontWeight="medium">
          {display}
        </Typography>
        <LinearProgress
          aria-valuetext={accessibleValue}
          color={color}
          variant="determinate"
          value={progressValue}
        />
      </Box>
    </Tooltip>
  );
};

const ShareCountCell = ({ shares }: { readonly shares: number }) => (
  <Typography component="span" fontWeight="medium" variant="body3">
    {formatTabulationMetric(shares, 1, "numbers").display}
  </Typography>
);

const isSubProposal = (proposalNumber: number): boolean =>
  !Number.isInteger(proposalNumber);

const getAutoRowHeight = () => "auto" as const;

const getEstimatedRowHeight = () => 72;

const VotingTabulationTable = ({
  proposals,
  loading = false,
}: VotingTabulationTableProps) => {
  const { currentMeeting } = useMeeting();
  const { displayMode } = useTabulationDisplay();
  const votingLabels = getTabulationHeaders(
    Array.from(proposals),
    currentMeeting?.ticker
  );

  const sortedProposals = Array.from(proposals).sort(
    (firstProposal, secondProposal) =>
      firstProposal.proposalNumber - secondProposal.proposalNumber
  );

  const proposalRows: ProposalGridRow[] = sortedProposals.map((proposal) => ({
    abstainPercentage: proposal.votingResults.abstain.percentage,
    abstainShares: proposal.votingResults.abstain.shares,
    againstPercentage: proposal.votingResults.against.percentage,
    againstShares: proposal.votingResults.against.shares,
    brokerNonVote: currentMeeting?.brokerNonVote ?? 0,
    forPercentage: proposal.votingResults.for.percentage,
    forShares: proposal.votingResults.for.shares,
    id: proposal.proposalId,
    isSubProposal: isSubProposal(proposal.proposalNumber),
    proposal: `${proposal.proposalNumber}. ${proposal.description}`,
    recommendation: proposal.recommendation ?? "N/A",
    totalSharesVoted: proposal.totalShares,
  }));

  // Director elections arrive as sub-proposals (1.01, 1.02, …) with no parent
  // "1" row, so the grid would otherwise open straight into individual
  // directors. Synthesize the grouping row AgendaTable already renders. The
  // metrics are left blank rather than summed: each director is voted
  // separately, so a total across them would not mean anything.
  const directorCount = sortedProposals.filter(
    (proposal) =>
      proposal.proposalNumber.toString().startsWith("1.") &&
      proposal.directorName
  ).length;
  const hasParentProposalOne = sortedProposals.some(
    (proposal) => proposal.proposalNumber === 1
  );
  const needsDirectorGroupRow = directorCount > 0 && !hasParentProposalOne;

  const rows: ProposalGridRow[] = needsDirectorGroupRow
    ? [
        {
          abstainPercentage: 0,
          abstainShares: 0,
          againstPercentage: 0,
          againstShares: 0,
          brokerNonVote: 0,
          forPercentage: 0,
          forShares: 0,
          id: "proposal-1-director-group",
          isGroupHeader: true,
          isSubProposal: false,
          proposal: `1. Election of the ${directorCount} directors named in the accompanying Proxy Statement`,
          recommendation: "N/A",
          totalSharesVoted: 0,
        },
        ...proposalRows,
      ]
    : proposalRows;
  const gridHeight = Math.max(520, Math.min(rows.length, 25) * 52 + 388);
  const proposalPageSize = Math.max(rows.length, 1);
  const recommendationOptions = getDistinctStringValues(
    rows,
    (row) => row.recommendation
  );

  const columns: GridColDef<ProposalGridRow>[] = [
    {
      field: "proposal",
      filterOperators: textFilterOperators,
      flex: 1,
      headerName: "Proposals",
      minWidth: 320,
      renderCell: (
        parameters: GridRenderCellParams<ProposalGridRow, string>
      ) => (
        <Typography
          component="span"
          variant="body3"
          sx={{
            alignItems: "center",
            alignSelf: "stretch",
            display: "flex",
            lineHeight: 1.35,
            minWidth: 0,
            overflowWrap: "anywhere",
            fontWeight: parameters.row.isGroupHeader ? 600 : undefined,
            pl: parameters.row.isSubProposal ? 3 : 0,
            py: 1,
            whiteSpace: "normal",
            width: "100%",
          }}
        >
          {parameters.value}
        </Typography>
      ),
    },
    {
      field: "recommendation",
      filterOperators: singleSelectFilterOperators,
      headerName: "Management Recommendation",
      minWidth: 190,
      type: "singleSelect",
      valueOptions: recommendationOptions,
      renderCell: (
        parameters: GridRenderCellParams<ProposalGridRow, string>
      ) =>
        parameters.row.isGroupHeader ? null : (
          <Typography component="span" variant="body3">
            {parameters.value}
          </Typography>
        ),
    },
    {
      field: "forPercentage",
      filterOperators: numericFilterOperators,
      headerName: votingLabels.for,
      minWidth: 160,
      type: "number",
      valueGetter: (value, row) => {
        void value;
        return displayMode === "numbers" ? row.forShares : row.forPercentage;
      },
      renderCell: (
        parameters: GridRenderCellParams<ProposalGridRow, number>
      ) =>
        parameters.row.isGroupHeader ? null : (
          <VotingMetricCell
            color="primary"
            percentage={parameters.row.forPercentage}
            shares={parameters.row.forShares}
            totalShares={parameters.row.totalSharesVoted}
          />
        ),
    },
    {
      field: "againstPercentage",
      filterOperators: numericFilterOperators,
      headerName: votingLabels.against,
      minWidth: 160,
      type: "number",
      valueGetter: (value, row) => {
        void value;
        return displayMode === "numbers"
          ? row.againstShares
          : row.againstPercentage;
      },
      renderCell: (
        parameters: GridRenderCellParams<ProposalGridRow, number>
      ) =>
        parameters.row.isGroupHeader ? null : (
          <VotingMetricCell
            color="secondary"
            percentage={parameters.row.againstPercentage}
            shares={parameters.row.againstShares}
            totalShares={parameters.row.totalSharesVoted}
          />
        ),
    },
    {
      field: "abstainPercentage",
      filterOperators: numericFilterOperators,
      headerName: votingLabels.abstain,
      minWidth: 160,
      type: "number",
      valueGetter: (value, row) => {
        void value;
        return displayMode === "numbers"
          ? row.abstainShares
          : row.abstainPercentage;
      },
      renderCell: (
        parameters: GridRenderCellParams<ProposalGridRow, number>
      ) =>
        parameters.row.isGroupHeader ? null : (
          <VotingMetricCell
            color="warning"
            percentage={parameters.row.abstainPercentage}
            shares={parameters.row.abstainShares}
            totalShares={parameters.row.totalSharesVoted}
          />
        ),
    },
    {
      field: "totalSharesVoted",
      filterOperators: numericFilterOperators,
      headerName: "Total Shares Voted",
      minWidth: 170,
      type: "number",
      renderCell: (
        parameters: GridRenderCellParams<ProposalGridRow, number>
      ) =>
        parameters.row.isGroupHeader ? null : (
          <ShareCountCell shares={parameters.value ?? 0} />
        ),
    },
    {
      field: "brokerNonVote",
      filterOperators: numericFilterOperators,
      headerName: "BNV",
      minWidth: 120,
      type: "number",
      renderCell: (
        parameters: GridRenderCellParams<ProposalGridRow, number>
      ) =>
        parameters.row.isGroupHeader ? null : (
          <ShareCountCell shares={parameters.value ?? 0} />
        ),
    },
  ];

  return (
    <Box sx={{ height: gridHeight, width: "100%" }}>
      <DataGrid
        columns={columns}
        rows={rows}
        loading={loading}
        getEstimatedRowHeight={getEstimatedRowHeight}
        getRowHeight={getAutoRowHeight}
        showToolbar
        disableRowSelectionOnClick
        disableVirtualization
        paginationModel={{
          page: 0,
          pageSize: proposalPageSize,
        }}
        pageSizeOptions={[proposalPageSize]}
        slotProps={{
          toolbar: {
            quickFilterProps: {
              debounceMs: 300,
            },
            showQuickFilter: true,
          },
        }}
        sx={{
          border: 0,
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
            outline: "none",
          },
          "& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader, & .MuiDataGrid-footerContainer, & .MuiDataGrid-toolbarContainer":
            {
              typography: "body3",
            },
          "& .MuiDataGrid-cell, & .MuiDataGrid-cellContent": {
            alignItems: "center !important",
            display: "flex !important",
          },
          "&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell": { py: "8px" },
          "&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell": {
            py: "15px",
          },
          "&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell": {
            py: "22px",
          },
        }}
      />
    </Box>
  );
};

export default VotingTabulationTable;
