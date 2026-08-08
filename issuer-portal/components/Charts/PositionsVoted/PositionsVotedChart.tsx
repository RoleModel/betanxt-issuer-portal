"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { useState } from "react";

import PieCenterLabel from "@/components/Charts/config/PieChartCenterLabel";

interface PositionsVotedData {
  registered: {
    voted: number;
    notVoted: number;
  };
  beneficial: {
    voted: number;
    notVoted: number;
  };
}

interface PositionsVotedChartProps {
  readonly meetingId?: string;
  readonly setKeys?: string[];
  readonly data?: Record<string, PositionsVotedData>;
  readonly loading?: boolean;
  /** Optional card subheader, e.g. the currently selected event. */
  readonly subheader?: string;
}

interface DonutChartProps {
  readonly data: { id: string; label: string; value: number; color: string }[];
  readonly centerValue: number;
  readonly centerLabel: string;
}

const positionCountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const formatPositionCount = (value: number): string =>
  positionCountFormatter.format(value);

const formatPositionPercentage = (value: number, total: number): string => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return `${percentage.toFixed(2)}%`;
};

const DonutChart = ({ data, centerValue, centerLabel }: DonutChartProps) => {
  return (
    <Box>
      <Box
        sx={{ position: "relative", display: "flex", justifyContent: "center" }}
      >
        <PieChart
          series={[
            {
              data,
              innerRadius: 75,
              outerRadius: 100,
              highlightScope: { fade: "global", highlight: "item" },
              // This chart renders outside TabulationDisplayProvider, so there
              // is no display mode to follow; always lead with the count.
              valueFormatter: (item) =>
                `${formatPositionCount(item.value)} (${formatPositionPercentage(
                  item.value,
                  centerValue
                )})`,
            },
          ]}
          width={300}
          height={200}
          slotProps={{
            legend: {
              direction: "horizontal",
              position: {
                vertical: "bottom",
                horizontal: "center",
              },
            },
          }}
          skipAnimation
        >
          <PieCenterLabel
            data={{
              total: centerValue,
              label: centerLabel,
              sliceData: data.map((item, index) => ({
                id: index,
                value: item.value,
                label: item.label,
                color: item.color,
              })),
            }}
          />
        </PieChart>
      </Box>
    </Box>
  );
};

const PositionsVotedChart = ({
  setKeys = [],
  data = {},
  subheader,
}: PositionsVotedChartProps) => {
  const [selectedSetKey, setSelectedSetKey] = useState("");

  // Derive the rendered key instead of syncing state via effects: fall back to
  // the first set whenever nothing is selected yet or the previous selection
  // belongs to another meeting, so the chart is populated on first load and
  // after event switches.
  const effectiveSetKey = setKeys.includes(selectedSetKey)
    ? selectedSetKey
    : (setKeys[0] ?? "");

  const selectedData =
    effectiveSetKey && data[effectiveSetKey]
      ? data[effectiveSetKey]
      : {
          registered: { voted: 0, notVoted: 0 },
          beneficial: { voted: 0, notVoted: 0 },
        };

  // Calculate totals and percentages
  const totalRegistered =
    selectedData.registered.voted + selectedData.registered.notVoted;
  const totalBeneficial =
    selectedData.beneficial.voted + selectedData.beneficial.notVoted;

  // Percentages live in the tooltip alongside the count, so the legend labels
  // stay plain and are not repeated in the hover text.
  const registeredData = [
    {
      id: "voted",
      label: "Voted",
      value: selectedData.registered.voted,
      color: "var(--mui-palette-voteDistribution-dtc-voted)",
    },
    {
      id: "not-voted",
      label: "Unvoted",
      value: selectedData.registered.notVoted,
      color: "var(--mui-palette-voteDistribution-dtc-unvoted)",
    },
  ];

  const beneficialData = [
    {
      id: "voted",
      label: "Voted",
      value: selectedData.beneficial.voted,
      color: "var(--mui-palette-voteDistribution-nonDtc-voted)",
    },
    {
      id: "not-voted",
      label: "Unvoted",
      value: selectedData.beneficial.notVoted,
      color: "var(--mui-palette-voteDistribution-nonDtc-unvoted)",
    },
  ];

  return (
    <Card sx={{ flex: "1 0 auto", height: "100%" }}>
      <CardHeader
        title="Positions Voted"
        subheader={subheader}
        action={
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={effectiveSetKey}
              onChange={(e) => {
                setSelectedSetKey(e.target.value);
              }}
              displayEmpty
            >
              {setKeys.length === 0 ? (
                <MenuItem value="" disabled>
                  No sets available
                </MenuItem>
              ) : (
                setKeys.map((key) => (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        }
      />
      <CardContent sx={{ height: "100%" }}>
        <Stack
          direction={{ xs: "column", sm: "column", md: "row", lg: "row" }}
          justifyContent="center"
          alignItems="center"
          spacing={{ xs: 2, md: 3 }}
        >
          <DonutChart
            centerLabel="Registered"
            data={registeredData}
            centerValue={totalRegistered}
          />

          <DonutChart
            centerLabel="Beneficial"
            data={beneficialData}
            centerValue={totalBeneficial}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PositionsVotedChart;
