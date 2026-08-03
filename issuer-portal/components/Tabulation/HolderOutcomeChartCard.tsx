"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import PieChart2IconWithAccent from "@rolemodel/betanxt-design-system/components/icons/brand/PieChart2Icon";

import type {
  VoteMatrixProposal,
  VoteMatrixRow,
} from "@/hooks/useTabulationInsights";

import ConfiguredPieChart from "@/components/Reporting/ConfiguredPieChart";
import { LegendToggle } from "@/components/ui/LegendToggle";

import { useTabulationDisplay } from "../../contexts/TabulationDisplayContext";
import { formatNumber } from "../../utils/number-utilities";
import {
  tabulationCardContentStyles,
  tabulationCardHeaderStyles,
  tabulationCardStyles,
} from "../../utils/tabulation-card-layout";
import { formatTabulationMetric } from "../../utils/tabulation-display";
import { deselectedChartColor } from "../../utils/vote-chart-colors";
import EmptyState from "../EmptyState";
import {
  holderStyles,
  holderTypes,
  minimumOutcomeShare,
  pieVoteOutcomes,
  sumPieOutcome,
  type HolderType,
  type VoteOutcomeKey,
} from "./vote-breakdown-chart-data";

/**
 * `proposalLabel` arrives as `Proposal 1.01: Arthur B. Winkleblack`. The select
 * is narrow and only needs the identifier, so keep everything before the first
 * colon. The untruncated label stays on the MenuItem's `title` for hover.
 */
const toProposalShortLabel = (proposalLabel: string): string => {
  const separatorIndex = proposalLabel.indexOf(":");
  return separatorIndex === -1
    ? proposalLabel
    : proposalLabel.slice(0, separatorIndex).trim();
};

export interface HolderOutcomeChartCardProps {
  readonly hiddenHolderTypes: ReadonlySet<HolderType>;
  readonly hiddenOutcomeKeys: ReadonlySet<VoteOutcomeKey>;
  readonly loading: boolean;
  readonly onHolderTypeToggle: (holderType: HolderType) => void;
  readonly onOutcomeToggle: (outcomeKey: VoteOutcomeKey) => void;
  readonly onProposalChange: (proposalId: string) => void;
  readonly proposals: readonly VoteMatrixProposal[];
  readonly rows: readonly VoteMatrixRow[];
  readonly selectedProposalId: string;
  readonly totalShares: number;
}

/**
 * Shows the selected proposal's vote outcomes inside their holder-type totals.
 *
 * @remarks
 * Legend toggles never change the donut's geometry: a deselected holder or
 * outcome keeps its arc and turns grey, so every remaining arc holds its share
 * of the proposal's original vote total and only the centre metric narrows.
 * Abstain and Withhold share a single arc — see `pieVoteOutcomes`. The centre
 * overlay uses the paired contrast token for the inner slice painted at the
 * chart centre.
 */
const HolderOutcomeChartCard = ({
  hiddenHolderTypes,
  hiddenOutcomeKeys,
  loading,
  onHolderTypeToggle,
  onOutcomeToggle,
  onProposalChange,
  proposals,
  rows,
  selectedProposalId,
  totalShares,
}: HolderOutcomeChartCardProps) => {
  const { displayMode } = useTabulationDisplay();
  const visibleOutcomes = pieVoteOutcomes.filter(
    (outcome) => !hiddenOutcomeKeys.has(outcome.key)
  );
  // Both rings walk every holder type whatever the legend says, so the donut
  // holds its shape however it is filtered; a deselected holder is greyed in
  // place rather than dropped. Only the centre metric narrows to the selection.
  const visibleTotalShares = holderTypes.reduce(
    (sum, holderType) =>
      hiddenHolderTypes.has(holderType)
        ? sum
        : sum +
          rows
            .filter((row) => row.holderType === holderType)
            .reduce(
              (rowSum, row) =>
                rowSum +
                visibleOutcomes.reduce(
                  (outcomeTotal, outcome) =>
                    outcomeTotal + sumPieOutcome(row, outcome),
                  0
                ),
              0
            ),
    0
  );
  const allHolderTotals = holderTypes.map((holderType) =>
    rows
      .filter((row) => row.holderType === holderType)
      .reduce(
        (sum, row) =>
          sum +
          pieVoteOutcomes.reduce(
            (outcomeTotal, outcome) =>
              outcomeTotal + sumPieOutcome(row, outcome),
            0
          ),
        0
      )
  );
  // Totals across every outcome, ignoring the legend. This separates "this
  // proposal genuinely has no votes" from "the user has toggled the outcomes
  // off", which previously looked identical and swapped the whole chart -
  // legend included - for an empty state with no way back.
  const recordedTotalShares = rows.reduce(
    (sum, row) =>
      sum +
      pieVoteOutcomes.reduce(
        (outcomeTotal, outcome) => outcomeTotal + sumPieOutcome(row, outcome),
        0
      ),
    0
  );
  const nothingSelected = recordedTotalShares > 0 && visibleTotalShares === 0;
  const actualOutcomeValues = new Map<string, number>();
  const holderRingData = holderTypes.flatMap((holderType, index) => {
    const value = allHolderTotals[index] ?? 0;
    return value > 0
      ? [
          {
            color: hiddenHolderTypes.has(holderType)
              ? deselectedChartColor
              : holderStyles[holderType].color,
            id: holderType,
            label: holderType,
            value,
          },
        ]
      : [];
  });
  // Every pie slice meets at the chart centre. MUI paints the final inner
  // slice last, so use that holder's paired contrast token for the overlay —
  // unless that holder is deselected, where the grey takes the page foreground.
  const centerHolderType = [...holderTypes]
    .reverse()
    .find(
      (holderType) =>
        (allHolderTotals[holderTypes.indexOf(holderType)] ?? 0) > 0
    );
  const centerLabelColor =
    centerHolderType === undefined || hiddenHolderTypes.has(centerHolderType)
      ? "var(--mui-palette-text-primary)"
      : holderStyles[centerHolderType].contrastColor;
  // Outer values are ordered by holder and each group sums to its inner slice,
  // keeping the shared ring boundaries aligned.
  const outcomeRingData = holderTypes.flatMap((holderType, holderIndex) => {
    const holderTotal = allHolderTotals[holderIndex] ?? 0;
    const holderRows = rows.filter((row) => row.holderType === holderType);
    const outcomeValues = pieVoteOutcomes.flatMap((outcome) => {
      const value = holderRows.reduce(
        (sum, row) => sum + sumPieOutcome(row, outcome),
        0
      );
      return value > 0 ? [{ outcome, value }] : [];
    });

    if (holderTotal === 0 || outcomeValues.length === 0) {
      return [];
    }

    const weightedTotal = outcomeValues.reduce(
      (sum, item) =>
        sum + Math.max(item.value / holderTotal, minimumOutcomeShare),
      0
    );

    return outcomeValues.map(({ outcome, value }) => {
      const id = `${holderType}-${outcome.key}`;
      const isDeselected =
        hiddenOutcomeKeys.has(outcome.key) || hiddenHolderTypes.has(holderType);
      actualOutcomeValues.set(id, value);
      return {
        color: isDeselected ? deselectedChartColor : outcome.color,
        id,
        label: `${holderType} · ${outcome.label}`,
        value:
          (Math.max(value / holderTotal, minimumOutcomeShare) / weightedTotal) *
          holderTotal,
      };
    });
  });
  const formatDonutValue = (id: string, value: number): string => {
    const actualValue = actualOutcomeValues.get(id) ?? value;
    const metric = formatTabulationMetric(
      actualValue,
      totalShares,
      displayMode
    );
    return `${metric.display} (${metric.alternate})`;
  };
  const centerMetric = formatTabulationMetric(
    visibleTotalShares,
    totalShares,
    displayMode
  );

  return (
    <Card data-testid="holder-outcome-chart-card" sx={tabulationCardStyles}>
      <CardHeader
        action={
          proposals.length > 1 ? (
            <TextField
              label="Proposal"
              onChange={(event) => {
                onProposalChange(event.target.value);
              }}
              select
              size="small"
              sx={{ minWidth: 140 }}
              value={selectedProposalId}
            >
              {proposals.map((proposal) => (
                <MenuItem
                  key={proposal.proposalId}
                  title={proposal.proposalLabel}
                  value={proposal.proposalId}
                >
                  {toProposalShortLabel(proposal.proposalLabel)}
                </MenuItem>
              ))}
            </TextField>
          ) : undefined
        }
        sx={tabulationCardHeaderStyles}
        title="Beneficial vs. Registered"
      />
      <CardContent sx={tabulationCardContentStyles}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            width: "100%",
            height: "100%",
          }}
        >
          {loading ? (
            <Skeleton height={300} variant="rectangular" width="100%" />
          ) : recordedTotalShares === 0 ? (
            <EmptyState
              description="Once shares are voted, they will appear here."
              icon={
                <PieChart2IconWithAccent
                  accentColor="var(--mui-palette-primary-light)"
                  fontSize="large"
                />
              }
              minHeight="unset"
              title="No votes recorded yet"
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
                width: "100%",
                height: "100%",
              }}
            >
              <ConfiguredPieChart
                centerLabel={{
                  centerTooltip: nothingSelected
                    ? "No outcomes selected - use the legend below"
                    : `${formatNumber(visibleTotalShares)} visible shares voted`,
                  centerValue: centerMetric.display,
                  fill: centerLabelColor,
                  label:
                    displayMode === "numbers"
                      ? "Shares voted"
                      : "of voted shares",
                  sliceData: [],
                  total: visibleTotalShares,
                }}
                height={300}
                margin={{ bottom: 8, left: 8, right: 8, top: 8 }}
                rings={[
                  {
                    cornerRadius: 3,
                    data: holderRingData,
                    highlightScope: { fade: "global", highlight: "item" },
                    highlighted: { additionalRadius: 1 },
                    innerRadius: 0,
                    outerRadius: 100,
                    paddingAngle: 0,
                    valueFormatter: (item) =>
                      formatDonutValue(String(item.id), item.value),
                  },
                  {
                    cornerRadius: 2,
                    data: outcomeRingData,
                    highlightScope: { fade: "global", highlight: "item" },
                    highlighted: { additionalRadius: 1 },
                    innerRadius: 100,
                    outerRadius: 128,
                    paddingAngle: 0,
                    valueFormatter: (item) =>
                      formatDonutValue(String(item.id), item.value),
                  },
                ]}
              />
              <Box
                aria-label="Voting outcome legend"
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.5,
                  justifyContent: "center",
                }}
              >
                {holderTypes.map((holderType) => (
                  <LegendToggle
                    hidden={hiddenHolderTypes.has(holderType)}
                    key={holderType}
                    label={holderType}
                    onToggle={() => {
                      onHolderTypeToggle(holderType);
                    }}
                    testId={`outcome-holder-legend-${holderType.toLowerCase()}`}
                  >
                    <Box
                      aria-hidden="true"
                      sx={{
                        backgroundColor: holderStyles[holderType].color,
                        borderRadius: "2px",
                        height: 20,
                        width: 20,
                      }}
                    />
                  </LegendToggle>
                ))}
                {pieVoteOutcomes.map((outcome) => (
                  <Box
                    aria-pressed={!hiddenOutcomeKeys.has(outcome.key)}
                    component="button"
                    data-testid={`outcome-legend-${outcome.key}`}
                    key={outcome.key}
                    onClick={() => {
                      onOutcomeToggle(outcome.key);
                    }}
                    sx={{
                      alignItems: "center",
                      background: "none",
                      border: 0,
                      color: "text.primary",
                      cursor: "pointer",
                      display: "flex",
                      gap: 0.5,
                      opacity: hiddenOutcomeKeys.has(outcome.key) ? 0.45 : 1,
                      p: 0,
                    }}
                    type="button"
                  >
                    <Box
                      sx={{
                        backgroundColor: outcome.color,
                        borderRadius: "2px",
                        height: 20,
                        width: 20,
                      }}
                    />
                    <Typography variant="caption">{outcome.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default HolderOutcomeChartCard;
