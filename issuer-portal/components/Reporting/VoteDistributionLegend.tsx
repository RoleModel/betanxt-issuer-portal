"use client";

import { Box } from "@mui/material";

import { LegendToggle } from "@/components/ui/LegendToggle";

import type {
  AccountTypeId,
  VoteStatusId,
} from "./vote-distribution-chart-data";

import { accountTypes, voteStatuses } from "./vote-distribution-chart-data";

const swatchSize = 20;

export interface VoteDistributionLegendProps {
  readonly hiddenAccountTypes: ReadonlySet<AccountTypeId>;
  readonly hiddenStatuses: ReadonlySet<VoteStatusId>;
  readonly onAccountTypeToggle: (accountType: AccountTypeId) => void;
  readonly onStatusToggle: (status: VoteStatusId) => void;
}

/**
 * Legend for the vote distribution donut. Account types filter the inner ring
 * (and everything under it), statuses filter the outer ring.
 */
export const VoteDistributionLegend = ({
  hiddenAccountTypes,
  hiddenStatuses,
  onAccountTypeToggle,
  onStatusToggle,
}: VoteDistributionLegendProps) => (
  <Box
    aria-label="Vote distribution legend"
    sx={{
      display: "flex",
      flexWrap: "wrap",
      gap: 1.5,
      justifyContent: "center",
      pt: 1,
    }}
  >
    {accountTypes.map((accountType) => (
      <LegendToggle
        hidden={hiddenAccountTypes.has(accountType.id)}
        key={accountType.id}
        label={accountType.label}
        onToggle={() => {
          onAccountTypeToggle(accountType.id);
        }}
        testId={`distribution-account-legend-${accountType.id}`}
      >
        <Box
          aria-hidden="true"
          sx={{
            backgroundColor: accountType.color,
            borderRadius: "2px",
            height: swatchSize,
            width: swatchSize,
          }}
        />
      </LegendToggle>
    ))}
    {voteStatuses.map((status) => (
      <LegendToggle
        hidden={hiddenStatuses.has(status.id)}
        key={status.id}
        label={status.label}
        onToggle={() => {
          onStatusToggle(status.id);
        }}
        testId={`distribution-status-legend-${status.id}`}
      >
        {/* Split swatch: this status shaded for each account type, since the
            outer ring takes its colour from whichever slice it sits under. */}
        <Box
          aria-hidden="true"
          sx={{
            borderRadius: "2px",
            display: "flex",
            height: swatchSize,
            overflow: "hidden",
            width: swatchSize,
          }}
        >
          {accountTypes.map((accountType) => (
            <Box
              key={accountType.id}
              sx={{
                backgroundColor: status.colorByAccountType[accountType.id],
                flex: 1,
              }}
            />
          ))}
        </Box>
      </LegendToggle>
    ))}
  </Box>
);

export default VoteDistributionLegend;
