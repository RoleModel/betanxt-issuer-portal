"use client";

import { Box, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts";
import React from "react";

import SkeletonChart from "@/components/ui/SkeletonChart";
import { voteChartColors } from "@/utils/vote-chart-colors";

import CustomLegend from "./CustomLegend";

interface DirectorVotingData {
  year: number;
  forPercentage: number;
  againstPercentage: number;
  abstainPercentage: number;
}

interface IndividualDirectorChartProps {
  readonly directorName: string;
  readonly data: DirectorVotingData[];
  readonly loading?: boolean;
}

const LEGEND_ITEMS = [
  {
    label: "For",
    color: voteChartColors.outcomes.for.color,
    type: "line" as const,
  },
  {
    label: "Against",
    color: voteChartColors.outcomes.against.color,
    type: "line" as const,
  },
  {
    label: "Abstain",
    color: voteChartColors.outcomes.abstain.color,
    type: "line" as const,
  },
];

const IndividualDirectorChart: React.FC<IndividualDirectorChartProps> = ({
  directorName,
  data,
  loading = false,
}) => {
  if (loading) {
    return <SkeletonChart height={400} showLegend />;
  }

  if (!data || data.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={300}
      >
        <Typography variant="body1" color="text.secondary">
          No voting data available for {directorName}
        </Typography>
      </Box>
    );
  }

  // Sort data by year and extract series
  const sortedData = [...data].sort((a, b) => a.year - b.year);
  const years = sortedData.map((d) => d.year);
  const forVotes = sortedData.map((d) => d.forPercentage);
  const againstVotes = sortedData.map((d) => d.againstPercentage);
  const abstainVotes = sortedData.map((d) => d.abstainPercentage);

  return (
    <Box>
      <LineChart
        height={320}
        series={[
          {
            data: forVotes,
            label: "For",
            color: voteChartColors.outcomes.for.color,
            curve: "catmullRom",
            showMark: false,
          },
          {
            data: againstVotes,
            label: "Against",
            color: voteChartColors.outcomes.against.color,
            curve: "catmullRom",
            showMark: false,
          },
          {
            data: abstainVotes,
            label: "Abstain",
            color: voteChartColors.outcomes.abstain.color,
            curve: "catmullRom",
            showMark: false,
          },
        ]}
        xAxis={[
          {
            data: years,
            scaleType: "point",
            tickNumber: years.length,
          },
        ]}
        yAxis={[
          {
            min: 0,
            max: 100,
            tickNumber: 6,
            label: "Share of Votes %",
          },
        ]}
        margin={{ left: 20, right: 20, top: 20, bottom: 0 }}
        grid={{ vertical: true, horizontal: true }}
        slots={{
          legend: () => null,
        }}
      />
      <CustomLegend items={LEGEND_ITEMS} />
    </Box>
  );
};

export default IndividualDirectorChart;
