"use client";

import { Box, Typography } from "@mui/material";
import {
  BarPlot,
  ChartsDataProvider,
  ChartsGrid,
  ChartsSurface,
  ChartsTooltip,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  MarkPlot,
} from "@mui/x-charts";
import React from "react";

import SkeletonChart from "@/components/ui/SkeletonChart";

import { CustomLegend } from "./index";

interface YearOverYearData {
  year: number;
  participationRate: number;
  registeredShares: number;
  beneficialShares: number;
  totalShares: number;
}

interface YearOverYearChartProps {
  data: YearOverYearData[];
  loading?: boolean;
  title?: string;
}

const YearOverYearChart: React.FC<YearOverYearChartProps> = ({
  data,
  loading = false,
  title: _title = "Year over Year Registered vs Beneficial Performance",
}) => {
  if (loading) {
    return <SkeletonChart height={320} showLegend noCard />;
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
          No year over year data available
        </Typography>
      </Box>
    );
  }

  const legendItems = [
    {
      label: "Registered",
      color: "var(--mui-palette-primary-main)",
      type: "bar" as const,
    },
    {
      label: "Beneficial",
      color: "var(--mui-palette-secondary-main)",
      type: "bar" as const,
    },
    {
      label: "Participation %",
      color: "var(--mui-palette-info-main)",
      type: "line" as const,
    },
  ];

  const years = data.map((item) => String(item.year));
  const participationRates = data.map((item) => item.participationRate);
  const registeredShares = data.map((item) => item.registeredShares);
  const beneficialShares = data.map((item) => item.beneficialShares);

  // Find the maximum total shares to set the y-axis scale
  const maxTotalShares = Math.max(...data.map((item) => item.totalShares), 1);

  // Round up to a nice number for the y-axis max
  const yAxisMax = Math.ceil(maxTotalShares / 1000000) * 1000000;

  return (
    <ChartsDataProvider
      // The configuration of the chart - stacked bars for Registered and Beneficial
      series={[
        // Registered shares
        {
          type: "bar",
          data: registeredShares,
          label: "Registered",
          color: "var(--mui-palette-primary-main)",
          yAxisId: "leftAxis",
          stack: "shares",
        },
        // Beneficial shares
        {
          type: "bar",
          data: beneficialShares,
          label: "Beneficial",
          color: "var(--mui-palette-secondary-main)",
          yAxisId: "leftAxis",
          stack: "shares",
        },
        {
          type: "line",
          data: participationRates,
          label: "Participation %",
          color: "var(--mui-palette-info-main)",
          curve: "catmullRom",
          showMark: false,
          yAxisId: "rightAxis",
        },
      ]}
      xAxis={[
        {
          scaleType: "band",
          data: years,
          id: "x-axis-id",
        },
      ]}
      yAxis={[
        {
          id: "leftAxis",
          scaleType: "linear",
          min: 0,
          max: yAxisMax,
          valueFormatter: (value) => {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            }
            if (value >= 1000) {
              return `${(value / 1000).toFixed(0)}K`;
            }
            return value.toFixed(0);
          },
        },
        {
          id: "rightAxis",
          scaleType: "linear",
          min: 0,
          max: 100,
          width: 100,
          valueFormatter: (value) => `${value ?? 0}%`,
        },
      ]}
      height={320}
      margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
    >
      <ChartsSurface>
        <ChartsGrid vertical horizontal />
        <BarPlot />
        <LinePlot />
        <MarkPlot />
        <ChartsXAxis axisId="x-axis-id" />
        <ChartsYAxis axisId="leftAxis" />
        <ChartsYAxis axisId="rightAxis" />
        <ChartsTooltip />
      </ChartsSurface>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <CustomLegend items={legendItems} />
      </Box>
    </ChartsDataProvider>
  );
};

export default YearOverYearChart;
