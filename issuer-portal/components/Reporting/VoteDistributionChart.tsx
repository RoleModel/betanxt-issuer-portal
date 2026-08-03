"use client";

import { HowToVoteOutlined } from "@mui/icons-material";
import { Box, Card, CardContent, CardHeader } from "@mui/material";
import { useState } from "react";

import EmptyState from "@/components/EmptyState";
import SkeletonChart from "@/components/ui/SkeletonChart";
import { useTabulationDisplay } from "@/contexts/TabulationDisplayContext";
import {
  tabulationCardHeaderStyles,
  tabulationChartHeight,
  tabulationDonutCenterY,
  tabulationDonutChartMargin,
} from "@/utils/tabulation-card-layout";
import { formatTabulationMetric } from "@/utils/tabulation-display";
import { deselectedChartColor } from "@/utils/vote-chart-colors";

import type {
  AccountTypeId,
  VoteDistributionData,
  VoteStatusId,
} from "./vote-distribution-chart-data";

import {
  accountTypes,
  buildSliceId,
  minimumStatusShare,
  voteStatuses,
} from "./vote-distribution-chart-data";
import { VoteDistributionLegend } from "./VoteDistributionLegend";
import ConfiguredPieChart from "./ConfiguredPieChart";

interface VoteDistributionChartProps {
  readonly data: VoteDistributionData[];
  readonly loading?: boolean;
}

// Ring geometry. The inner ring is a filled circle of account types; the outer
// ring splits each of those into voted / not voted.
const accountRingOuterRadius = 92;
const statusRingInnerRadius = 92;
const statusRingOuterRadius = 126;

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

  // Both rings walk every account type and every status, whatever the legend
  // says, so the donut is the same shape however it is filtered. Deselecting
  // greys an arc rather than dropping it: the ring keeps reading as the whole,
  // and a single remaining slice can never look like 100%.
  const accountRecordedTotals = accountTypes.map((accountType) =>
    voteStatuses.reduce(
      (sum, status) => sum + sliceValue(accountType.id, status.id),
      0
    )
  );

  // The centre reads "Total Votes", so it counts only voted slices — summing
  // everything reported shares outstanding as votes.
  const visibleVotedTotal = accountTypes.reduce(
    (sum, accountType) =>
      hiddenStatuses.has("voted") || hiddenAccountTypes.has(accountType.id)
        ? sum
        : sum + sliceValue(accountType.id, "voted"),
    0
  );
  const totalMetric = formatTabulationMetric(
    visibleVotedTotal,
    recordedTotal,
    displayMode
  );
  const nothingSelected = recordedTotal > 0 && visibleVotedTotal === 0;

  const accountRingData = accountTypes.flatMap((accountType, index) => {
    const value = accountRecordedTotals[index] ?? 0;
    return value > 0
      ? [
          {
            color: hiddenAccountTypes.has(accountType.id)
              ? deselectedChartColor
              : accountType.color,
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
  const statusRingData = accountTypes.flatMap((accountType, index) => {
    const accountTotal = accountRecordedTotals[index] ?? 0;
    const statusValues = voteStatuses.flatMap((status) => {
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
      const isDeselected =
        hiddenAccountTypes.has(accountType.id) || hiddenStatuses.has(status.id);
      actualStatusValues.set(id, value);
      return {
        color: isDeselected
          ? deselectedChartColor
          : status.styleByAccountType[accountType.id].color,
        id,
        label: `${accountType.label} · ${status.label}`,
        value:
          (Math.max(value / accountTotal, minimumStatusShare) / weightedTotal) *
          accountTotal,
      };
    });
  });

  const formatDonutValue = (id: string, value: number): string => {
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
          <ConfiguredPieChart
            centerLabel={{
              centerTooltip: nothingSelected
                ? "Nothing selected - use the legend below"
                : totalMetric.alternate,
              centerValue: totalMetric.display,
              fill: "var(--mui-palette-primary-contrastText)",
              label: "Total Votes",
              showStroke: false,
              sliceData: [],
              total: visibleVotedTotal,
            }}
            height={tabulationChartHeight}
            margin={tabulationDonutChartMargin}
            rings={[
              {
                cy: tabulationDonutCenterY,
                data: accountRingData,
                highlightScope: { fade: "global", highlight: "item" },
                innerRadius: 0,
                outerRadius: accountRingOuterRadius,
                valueFormatter: (item) =>
                  formatDonutValue(String(item.id), item.value),
              },
              {
                cy: tabulationDonutCenterY,
                data: statusRingData,
                highlightScope: { fade: "global", highlight: "item" },
                innerRadius: statusRingInnerRadius,
                outerRadius: statusRingOuterRadius,
                valueFormatter: (item) =>
                  formatDonutValue(String(item.id), item.value),
              },
            ]}
          />
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
