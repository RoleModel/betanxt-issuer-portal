"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";

import type { Classification, ProposalRow } from "@/hooks/use-tabulation-report-review";

import { useProposalReviewLabel } from "@/hooks/use-tabulation-review-formatting";

interface ProposalClassificationSentenceProps {
  readonly disabled: boolean;
  readonly onRowUpdate: (newRow: ProposalRow, oldRow: ProposalRow) => ProposalRow;
  readonly original: ProposalRow | undefined;
  readonly row: ProposalRow;
}

/** Renders one proposal's routine/non-routine classification sentence. */
export const ProposalClassificationSentence = ({
  disabled,
  onRowUpdate,
  original,
  row,
}: ProposalClassificationSentenceProps) => {
  const proposalLabel = useProposalReviewLabel(row);
  const originalClassification = original?.classification ?? row.classification;
  const changed = row.classification !== originalClassification;

  return (
    <Box
      sx={{
        alignItems: { sm: "center" },
        border: "1px solid",
        borderColor: changed ? "warning.main" : "divider",
        borderRadius: 1,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.5,
        p: 2,
      }}
    >
      <Typography component="p" sx={{ flex: 1 }} variant="body2">
        {proposalLabel} is classified as
      </Typography>
      <FormControl disabled={disabled} size="small" sx={{ minWidth: 170 }}>
        <InputLabel id={`${row.id}-classification-label`}>Classification</InputLabel>
        <Select
          label="Classification"
          labelId={`${row.id}-classification-label`}
          onChange={(event) => {
            onRowUpdate({ ...row, classification: event.target.value as Classification }, row);
          }}
          value={row.classification}
        >
          <MenuItem value="ROUTINE">Routine</MenuItem>
          <MenuItem value="NON_ROUTINE">Non-routine</MenuItem>
        </Select>
      </FormControl>
      <Typography
        color={changed ? "warning.main" : "text.secondary"}
        minWidth={140}
        variant="caption"
      >
        Original {originalClassification === "ROUTINE" ? "Routine" : "Non-routine"}
      </Typography>
    </Box>
  );
};
