"use client";

import { Box, Stack, Typography } from "@mui/material";

import type { ProposalRow } from "@/hooks/use-tabulation-report-review";

import { useProposalReviewLabel } from "@/hooks/use-tabulation-review-formatting";

import { NumberReviewField } from "./number-review-field";

interface ProposalTotalsSentenceProps {
  readonly disabled: boolean;
  readonly onRowUpdate: (newRow: ProposalRow, oldRow: ProposalRow) => ProposalRow;
  readonly original: ProposalRow | undefined;
  readonly row: ProposalRow;
}

/** Renders one proposal's editable vote totals with original values nearby. */
export const ProposalTotalsSentence = ({
  disabled,
  onRowUpdate,
  original,
  row,
}: ProposalTotalsSentenceProps) => {
  const proposalLabel = useProposalReviewLabel(row);
  const originalRow = original ?? row;
  const updateNumber = (
    field: "brokerNonVotes" | "totalVotesAbstain" | "totalVotesAgainst" | "totalVotesFor",
    value: number | null,
  ) => {
    onRowUpdate({ ...row, [field]: value }, row);
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 2,
      }}
    >
      <Stack spacing={1.5}>
        <Typography
          component="p"
          variant="body2"
          sx={{ fontWeight: row.isDirectorSubProposal ? 600 : undefined }}
        >
          {proposalLabel} has vote totals:
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1.5}>
          <NumberReviewField
            disabled={disabled}
            label="For"
            onChange={(value) => {
              updateNumber("totalVotesFor", value);
            }}
            original={originalRow.totalVotesFor}
            value={row.totalVotesFor}
          />
          <NumberReviewField
            disabled={disabled}
            label="Against"
            onChange={(value) => {
              updateNumber("totalVotesAgainst", value);
            }}
            original={originalRow.totalVotesAgainst}
            value={row.totalVotesAgainst}
          />
          <NumberReviewField
            disabled={disabled}
            label="Abstain"
            onChange={(value) => {
              updateNumber("totalVotesAbstain", value);
            }}
            original={originalRow.totalVotesAbstain}
            value={row.totalVotesAbstain}
          />
          <NumberReviewField
            disabled={disabled}
            label="Broker non-votes"
            onChange={(value) => {
              updateNumber("brokerNonVotes", value);
            }}
            original={originalRow.brokerNonVotes}
            value={row.brokerNonVotes}
          />
        </Stack>
      </Stack>
    </Box>
  );
};
