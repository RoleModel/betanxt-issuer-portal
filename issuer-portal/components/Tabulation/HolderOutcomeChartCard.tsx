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
import { PieArcLabel, PieChart, pieClasses, type PieArcLabelProps } from "@mui/x-charts/PieChart";
import PieChart2IconWithAccent from "@rolemodel/betanxt-design-system/components/icons/brand/PieChart2Icon";

import type { VoteMatrixProposal, VoteMatrixRow } from "@/hooks/useTabulationInsights";

import { useTabulationDisplay } from "../../contexts/TabulationDisplayContext";
import { formatNumber } from "../../utils/number-utilities";
import {
  tabulationCardContentStyles,
  tabulationCardHeaderStyles,
  tabulationCardStyles,
} from "../../utils/tabulation-card-layout";
import { formatTabulationMetric } from "../../utils/tabulation-display";
import EmptyState from "../EmptyState";
import PieCenterLabel from "../Reporting/PieChartCenterLabel";
import {
  holderStyles,
  holderTypes,
  minimumOutcomeShare,
  voteOutcomes,
  type VoteOutcomeKey,
} from "./vote-breakdown-chart-data";

const outcomeArcLabelMinAngle = 24;
const outcomeArcLabelRadius = 116;

const arcLabelContrastColors = new Map<string, string>([
  ...voteOutcomes.map((outcome): [string, string] => [outcome.color, outcome.contrastColor]),
  ...Object.values(holderStyles).map((holder): [string, string] => [
    holder.color,
    holder.contrastColor,
  ]),
]);

const ContrastPieArcLabel = ({ color, style, ...props }: PieArcLabelProps) => {
  return (
    <PieArcLabel
      {...props}
      color={color}
      style={{
        ...style,
        fill: arcLabelContrastColors.get(color) ?? "var(--mui-palette-text-primary)",
      }}
    />
  );
};

/**
 * `proposalLabel` arrives as `Proposal 1.01: Arthur B. Winkleblack`. The select
 * is narrow and only needs the identifier, so keep everything before the first
 * colon. The untruncated label stays on the MenuItem's `title` for hover.
 */
const toProposalShortLabel = (proposalLabel: string): string => {
  const separatorIndex = proposalLabel.indexOf(":");
  return separatorIndex === -1 ? proposalLabel : proposalLabel.slice(0, separatorIndex).trim();
};

export interface HolderOutcomeChartCardProps {
  readonly hiddenOutcomeKeys: ReadonlySet<VoteOutcomeKey>;
  readonly loading: boolean;
  readonly onOutcomeToggle: (outcomeKey: VoteOutcomeKey) => void;
  readonly onProposalChange: (proposalId: string) => void;
  readonly proposals: readonly VoteMatrixProposal[];
  readonly rows: readonly VoteMatrixRow[];
  readonly selectedProposalId: string;
  readonly totalShares: number;
}

const HolderOutcomeChartCard = ({
  hiddenOutcomeKeys,
  loading,
  onOutcomeToggle,
  onProposalChange,
  proposals,
  rows,
  selectedProposalId,
  totalShares,
}: HolderOutcomeChartCardProps) => {
  const { displayMode } = useTabulationDisplay();
  const visibleOutcomes = voteOutcomes.filter((outcome) => !hiddenOutcomeKeys.has(outcome.key));
  const holderTotals = holderTypes.map((holderType) =>
    rows
      .filter((row) => row.holderType === holderType)
      .reduce(
        (sum, row) =>
          sum +
          visibleOutcomes.reduce((outcomeTotal, outcome) => outcomeTotal + row[outcome.key], 0),
        0,
      ),
  );
  const visibleTotalShares = holderTotals.reduce((sum, holderTotal) => sum + holderTotal, 0);
  // Totals across every outcome, ignoring the legend. This separates "this
  // proposal genuinely has no votes" from "the user has toggled the outcomes
  // off", which previously looked identical and swapped the whole chart -
  // legend included - for an empty state with no way back.
  const recordedTotalShares = rows.reduce(
    (sum, row) =>
      sum + voteOutcomes.reduce((outcomeTotal, outcome) => outcomeTotal + row[outcome.key], 0),
    0,
  );
  const showNeutralRings = recordedTotalShares > 0 && visibleTotalShares === 0;
  // Equal, greyed slices so the donut keeps its geometry while nothing is
  // selected, rather than collapsing to nothing.
  const neutralRingData = holderTypes.map((holderType) => ({
    color: "var(--mui-palette-action-disabledBackground)",
    id: holderType,
    label: holderType,
    value: 1,
  }));
  const actualOutcomeValues = new Map<string, number>();
  const outcomeArcLabels = new Map<string, string>();
  const holderRingData = holderTypes.flatMap((holderType, index) => {
    const value = holderTotals[index] ?? 0;
    return value > 0
      ? [
          {
            color: holderStyles[holderType].color,
            id: holderType,
            label: holderType,
            value,
          },
        ]
      : [];
  });
  // Outer values are ordered by holder and each group sums to its inner slice,
  // keeping the shared ring boundaries aligned.
  const outcomeRingData = holderTypes.flatMap((holderType, holderIndex) => {
    const holderTotal = holderTotals[holderIndex] ?? 0;
    const holderRows = rows.filter((row) => row.holderType === holderType);
    const outcomeValues = visibleOutcomes.flatMap((outcome) => {
      const value = holderRows.reduce((sum, row) => sum + row[outcome.key], 0);
      return value > 0 ? [{ outcome, value }] : [];
    });

    if (holderTotal === 0 || outcomeValues.length === 0) {
      return [];
    }

    const weightedTotal = outcomeValues.reduce(
      (sum, item) => sum + Math.max(item.value / holderTotal, minimumOutcomeShare),
      0,
    );

    return outcomeValues.map(({ outcome, value }) => {
      const id = `${holderType}-${outcome.key}`;
      actualOutcomeValues.set(id, value);
      outcomeArcLabels.set(id, outcome.label);
      return {
        color: outcome.color,
        id,
        label: `${holderType} · ${outcome.label}`,
        value: (Math.max(value / holderTotal, minimumOutcomeShare) / weightedTotal) * holderTotal,
      };
    });
  });
  const formatDonutValue = (id: string, value: number): string => {
    const actualValue = actualOutcomeValues.get(id) ?? value;
    const metric = formatTabulationMetric(actualValue, totalShares, displayMode);
    return `${metric.display} (${metric.alternate})`;
  };
  const centerMetric = formatTabulationMetric(visibleTotalShares, totalShares, displayMode);

  return (
    <Card sx={tabulationCardStyles}>
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
              <PieChart
                height={300}
                hideLegend
                margin={{ bottom: 8, left: 8, right: 8, top: 8 }}
                series={[
                  {
                    arcLabel: (item) => (showNeutralRings ? "" : (item.label ?? "")),
                    arcLabelMinAngle: 20,
                    arcLabelRadius: 68,
                    cornerRadius: 3,
                    data: showNeutralRings ? neutralRingData : holderRingData,
                    highlightScope: { fade: "global", highlight: "item" },
                    highlighted: { additionalRadius: 1 },
                    innerRadius: 0,
                    outerRadius: 100,
                    valueFormatter: (item) => formatDonutValue(String(item.id), item.value),
                  },
                  {
                    arcLabel: (item) =>
                      showNeutralRings ? "" : (outcomeArcLabels.get(String(item.id)) ?? ""),
                    arcLabelMinAngle: outcomeArcLabelMinAngle,
                    arcLabelRadius: outcomeArcLabelRadius,
                    cornerRadius: 2,
                    data: showNeutralRings ? neutralRingData : outcomeRingData,
                    highlightScope: { fade: "global", highlight: "item" },
                    highlighted: { additionalRadius: 1 },
                    innerRadius: 102,
                    outerRadius: 128,
                    valueFormatter: (item) => formatDonutValue(String(item.id), item.value),
                  },
                ]}
                slots={{ pieArcLabel: ContrastPieArcLabel }}
                sx={{
                  [`& .${pieClasses.arcLabel}`]: {
                    fontSize: 13,
                    fontWeight: 700,
                  },
                }}
              >
                <PieCenterLabel
                  data={{
                    centerTooltip: showNeutralRings
                      ? "No outcomes selected - use the legend below"
                      : `${formatNumber(visibleTotalShares)} visible shares voted`,
                    centerValue: centerMetric.display,
                    fill: "var(--mui-palette-primary-contrastText)",
                    label: displayMode === "numbers" ? "Shares voted" : "of voted shares",
                    sliceData: [],
                    total: visibleTotalShares,
                  }}
                />
              </PieChart>
              <Box
                aria-label="Voting outcome legend"
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.5,
                  justifyContent: "center",
                }}
              >
                {voteOutcomes.map((outcome) => (
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
