"use client";

import { Box, Checkbox, FormControlLabel, FormGroup, Typography } from "@mui/material";

import type { ChecklistState } from "@/hooks/use-tabulation-report-review";

import { checklistKeys } from "@/hooks/use-tabulation-report-review";

const checklistLabels: Record<keyof ChecklistState, string> = {
  brokerNonVotes: "Broker non-vote totals are correct",
  proposalClassification: "Proposals are correctly classified routine / non-routine",
  voteCategories:
    "Votes are landing in the correct categories (beneficial / registered, routine / non-routine)",
};

interface ChecklistSectionProps {
  readonly checklist: ChecklistState;
  readonly disabled: boolean;
  readonly onToggle: (key: keyof ChecklistState, checked: boolean) => void;
}

/** Checklist gate that must be completed before a report can be verified. */
export const ChecklistSection = ({ checklist, disabled, onToggle }: ChecklistSectionProps) => (
  <Box sx={{ p: 3 }}>
    <Typography sx={{ mb: 1 }} variant="subtitle2">
      Verification checklist
    </Typography>
    <FormGroup>
      {checklistKeys.map((key) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={checklist[key]}
              disabled={disabled}
              onChange={(changeEvent) => {
                onToggle(key, changeEvent.target.checked);
              }}
            />
          }
          key={key}
          label={checklistLabels[key]}
        />
      ))}
    </FormGroup>
  </Box>
);
