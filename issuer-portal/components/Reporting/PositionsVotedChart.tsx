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
import React, { useState } from "react";

import PieCenterLabel from "./PieChartCenterLabel";

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
  meetingId?: string;
  setKeys?: string[];
  data?: Record<string, PositionsVotedData>;
  loading?: boolean;
}

interface DonutChartProps {
  data: { id: string; label: string; value: number; color: string }[];
  centerValue: number;
  centerLabel: string;
}

function DonutChart({ data, centerValue, centerLabel }: DonutChartProps) {
  return (
    <Box>
      <Box sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
        <PieChart
          series={[
            {
              data,
              innerRadius: 75,
              outerRadius: 100,
              highlightScope: { fade: "global", highlight: "item" },
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
}

export default function PositionsVotedChart({ setKeys = [], data = {} }: PositionsVotedChartProps) {
  const [selectedSetKey, setSelectedSetKey] = useState("");

  React.useEffect(() => {
    if (setKeys.length > 0 && !selectedSetKey) {
      setSelectedSetKey(setKeys[0]);
    }
  }, [setKeys, selectedSetKey]);

  const selectedData =
    selectedSetKey && data[selectedSetKey]
      ? data[selectedSetKey]
      : {
          registered: { voted: 0, notVoted: 0 },
          beneficial: { voted: 0, notVoted: 0 },
        };

  // Calculate totals and percentages
  const totalRegistered = selectedData.registered.voted + selectedData.registered.notVoted;
  const totalBeneficial = selectedData.beneficial.voted + selectedData.beneficial.notVoted;

  const registeredVotedPercentage =
    totalRegistered > 0 ? (selectedData.registered.voted / totalRegistered) * 100 : 0;
  const beneficialVotedPercentage =
    totalBeneficial > 0 ? (selectedData.beneficial.voted / totalBeneficial) * 100 : 0;

  const registeredData = [
    {
      id: "voted",
      label: `Voted (${registeredVotedPercentage.toFixed(2)}%)`,
      value: selectedData.registered.voted,
      color: "var(--mui-palette-chartSeries-1-main)",
    },
    {
      id: "not-voted",
      label: `Unvoted (${(100 - registeredVotedPercentage).toFixed(2)}%)`,
      value: selectedData.registered.notVoted,
      color: "var(--mui-palette-chartSeries-4-main)",
    },
  ];

  const beneficialData = [
    {
      id: "voted",
      label: `Voted (${beneficialVotedPercentage.toFixed(2)}%)`,
      value: selectedData.beneficial.voted,
      color: "var(--mui-palette-chartSeries-1-main)",
    },
    {
      id: "not-voted",
      label: `Unvoted (${(100 - beneficialVotedPercentage).toFixed(2)}%)`,
      value: selectedData.beneficial.notVoted,
      color: "var(--mui-palette-chartSeries-4-main)",
    },
  ];

  return (
    <Card sx={{ flex: "1 0 auto", height: "100%" }}>
      <CardHeader
        title="Positions Voted"
        action={
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={selectedSetKey ?? ""}
              onChange={(e) => setSelectedSetKey(e.target.value)}
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
          justifyContent={"center"}
          alignItems={"center"}
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
}
