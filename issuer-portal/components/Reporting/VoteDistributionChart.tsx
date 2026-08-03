"use client";

import { HowToVoteOutlined } from "@mui/icons-material";
import { Box, Card, CardContent, CardHeader } from "@mui/material";
import { PieChart as MuiPieChart, pieClasses } from "@mui/x-charts/PieChart";
import { useState } from "react";

import EmptyState from "@/components/EmptyState";
import PieCenterLabel from "@/components/Reporting/PieChartCenterLabel";
import { createContrastPieArcLabel } from "@/components/ui/ContrastPieArcLabel";
import SkeletonChart from "@/components/ui/SkeletonChart";
import { useTabulationDisplay } from "@/contexts/TabulationDisplayContext";
import {
  tabulationCardHeaderStyles,
  tabulationChartHeight,
  tabulationDonutCenterY,
  tabulationDonutChartMargin,
  tabulationMinArcLabelAngle,
} from "@/utils/tabulation-card-layout";
import { formatTabulationMetric } from "@/utils/tabulation-display";

import type {
  AccountTypeId,
  VoteDistributionData,
  VoteStatusId,
} from "./vote-distribution-chart-data";

import {
  accountTypes,
  arcLabelContrastByColor,
  buildSliceId,
  hiddenRemainderColor,
  hiddenRemainderId,
  minimumStatusShare,
  neutralRingColor,
  statusArcLabelRadius,
  voteStatuses,
} from "./vote-distribution-chart-data";
import { VoteDistributionLegend } from "./VoteDistributionLegend";

interface VoteDistributionChartProps {
  readonly data: VoteDistributionData[];
  readonly loading?: boolean;
}

// Ring geometry. The inner ring is a filled circle of account types; the outer
// ring splits each of those into voted / not voted.
const accountRingOuterRadius = 92;
const statusRingInnerRadius = 92;
const statusRingOuterRadius = 126;

/** Stable across renders: the colour mapping never changes. */
const ContrastPieArcLabel = createContrastPieArcLabel(arcLabelContrastByColor);

const toggle = <T,>(previous: ReadonlySet<T>, value: T): ReadonlySet<T> => {
  const next = new Set(previous);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
};

const VoteDistributionChart = ({
  data,
  loading,
}: VoteDistributionChartProps) => {
  const { displayMode } = useTabulationDisplay();
  const [hiddenAccountTypes, setHiddenAccountTypes] = useState<
    ReadonlySet<AccountTypeId>
  >(() => new Set());
  const [hiddenStatuses, setHiddenStatuses] = useState<
    ReadonlySet<VoteStatusId>
  >(() => new Set());

  const valueBySliceId = new Map(data.map((item) => [item.id, item.value]));
  const sliceValue = (
    accountType: AccountTypeId,
    status: VoteStatusId
  ): number => valueBySliceId.get(buildSliceId(accountType, status)) ?? 0;

  // Every slice regardless of the legend, so each slice's share of the whole
  // stays correct and so "nothing recorded" stays distinguishable from
  // "everything toggled off".
  const recordedTotal = data.reduce((sum, item) => sum + item.value, 0);
  const recordedVotedTotal = accountTypes.reduce(
    (sum, accountType) => sum + sliceValue(accountType.id, "voted"),
    0
  );

  const visibleAccountTypes = accountTypes.filter(
    (accountType) => !hiddenAccountTypes.has(accountType.id)
  );
  const visibleStatuses = voteStatuses.filter(
    (status) => !hiddenStatuses.has(status.id)
  );

  // Indexed by visibleAccountTypes; both rings walk that same list.
  const accountTotals = visibleAccountTypes.map((accountType) =>
    visibleStatuses.reduce(
      (sum, status) => sum + sliceValue(accountType.id, status.id),
      0
    )
  );
  const visibleTotal = accountTotals.reduce((sum, total) => sum + total, 0);

  // The centre reads "Total Votes", so it counts only voted slices — summing
  // everything reported shares outstanding as votes.
  const visibleVotedTotal = visibleAccountTypes.reduce(
    (sum, accountType) =>
      hiddenStatuses.has("voted")
        ? sum
        : sum + sliceValue(accountType.id, "voted"),
    0
  );
  const totalMetric = formatTabulationMetric(
    visibleVotedTotal,
    recordedTotal,
    displayMode
  );

  const showNeutralRings = recordedTotal > 0 && visibleTotal === 0;
  const neutralRingData = accountTypes.map((accountType) => ({
    color: neutralRingColor,
    id: accountType.id,
    label: accountType.label,
    value: 1,
  }));

  const accountRingData = visibleAccountTypes.flatMap((accountType, index) => {
    const value = accountTotals[index] ?? 0;
    return value > 0
      ? [
          {
            color: accountType.color,
            id: accountType.id,
            label: accountType.label,
            value,
          },
        ]
      : [];
  });

  // Outer values are ordered by account type and each group sums to its inner
  // slice, so the two rings share their boundaries.
  const actualStatusValues = new Map<string, number>();
  const statusArcLabels = new Map<string, string>();
  const statusRingData = visibleAccountTypes.flatMap((accountType, index) => {
    const accountTotal = accountTotals[index] ?? 0;
    const statusValues = visibleStatuses.flatMap((status) => {
      const value = sliceValue(accountType.id, status.id);
      return value > 0 ? [{ status, value }] : [];
    });

    if (accountTotal === 0 || statusValues.length === 0) {
      return [];
    }

    const weightedTotal = statusValues.reduce(
      (sum, item) =>
        sum + Math.max(item.value / accountTotal, minimumStatusShare),
      0
    );

    return statusValues.map(({ status, value }) => {
      const id = buildSliceId(accountType.id, status.id);
      actualStatusValues.set(id, value);
      statusArcLabels.set(id, status.label);
      return {
        color: status.styleByAccountType[accountType.id].color,
        id,
        label: `${accountType.label} · ${status.label}`,
        value:
          (Math.max(value / accountTotal, minimumStatusShare) / weightedTotal) *
          accountTotal,
      };
    });
  });

  // Both rings are scaled against the recorded total rather than the visible
  // one, so hidden series leave a gap instead of letting what remains stretch
  // to fill the circle - a single visible slice was reading as 100%.
  const hiddenRemainder = Math.max(recordedTotal - visibleTotal, 0);
  const withRemainder = <T extends { value: number }>(
    slices: readonly T[]
  ): (T | { color: string; id: string; label: string; value: number })[] =>
    hiddenRemainder > 0
      ? [
          ...slices,
          {
            color: hiddenRemainderColor,
            id: hiddenRemainderId,
            label: "",
            value: hiddenRemainder,
          },
        ]
      : [...slices];

  const formatDonutValue = (id: string, value: number): string => {
    if (id === hiddenRemainderId) {
      return "";
    }

    const actualValue = actualStatusValues.get(id) ?? value;
    const metric = formatTabulationMetric(
      actualValue,
      recordedTotal,
      displayMode
    );
    return `${metric.display} (${metric.alternate})`;
  };

  if (loading === true) {
    return (
      <SkeletonChart
        height={300}
        showLegend
        title="Vote Distribution by Account Type"
      />
    );
  }

  // Keyed off the recorded totals, not the visible ones: hiding every legend
  // entry must not look like "no votes exist" and take the legend away with it.
  if (data.length === 0 || recordedVotedTotal === 0) {
    return (
      <Card>
        <CardHeader
          sx={tabulationCardHeaderStyles}
          title="Vote Distribution by Account Type"
        />
        <CardContent sx={{ p: 0 }}>
          <EmptyState
            description="Once shares are voted, this chart will break the results down by account type."
            icon={<HowToVoteOutlined color="disabled" fontSize="large" />}
            minHeight="unset"
            title="No votes recorded yet"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        sx={tabulationCardHeaderStyles}
        title="Vote Distribution by Account Type"
      />
      <CardContent>
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: 250,
          }}
        >
          <MuiPieChart
            height={tabulationChartHeight}
            hideLegend
            margin={tabulationDonutChartMargin}
            series={[
              {
                cy: tabulationDonutCenterY,
                data: showNeutralRings
                  ? neutralRingData
                  : withRemainder(accountRingData),
                highlightScope: { fade: "global", highlight: "item" },
                innerRadius: 0,
                outerRadius: accountRingOuterRadius,
                valueFormatter: (item) =>
                  formatDonutValue(String(item.id), item.value),
              },
              {
                arcLabel: (item) =>
                  showNeutralRings
                    ? ""
                    : (statusArcLabels.get(String(item.id)) ?? ""),
                arcLabelMinAngle: tabulationMinArcLabelAngle,
                arcLabelRadius: statusArcLabelRadius,
                cy: tabulationDonutCenterY,
                data: showNeutralRings
                  ? neutralRingData
                  : withRemainder(statusRingData),
                highlightScope: { fade: "global", highlight: "item" },
                innerRadius: statusRingInnerRadius,
                outerRadius: statusRingOuterRadius,
                valueFormatter: (item) =>
                  formatDonutValue(String(item.id), item.value),
              },
            ]}
            slots={{ pieArcLabel: ContrastPieArcLabel }}
            sx={{
              [`& .${pieClasses.arcLabel}`]: {
                fontSize: 11,
                fontWeight: 700,
              },
            }}
          >
            <PieCenterLabel
              data={{
                centerTooltip: showNeutralRings
                  ? "Nothing selected - use the legend below"
                  : totalMetric.alternate,
                centerValue: totalMetric.display,
                label: "Total Votes",
                sliceData: [],
                total: visibleVotedTotal,
                fill: "var(--mui-palette-primary-contrastText)",
                showStroke: false,
              }}
            />
          </MuiPieChart>
          <VoteDistributionLegend
            hiddenAccountTypes={hiddenAccountTypes}
            hiddenStatuses={hiddenStatuses}
            onAccountTypeToggle={(accountType) => {
              setHiddenAccountTypes((previous) =>
                toggle(previous, accountType)
              );
            }}
            onStatusToggle={(status) => {
              setHiddenStatuses((previous) => toggle(previous, status));
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default VoteDistributionChart;
