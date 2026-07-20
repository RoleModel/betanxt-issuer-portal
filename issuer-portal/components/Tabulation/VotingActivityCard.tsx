"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Typography,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import React, { useMemo } from "react";

import PieCenterLabel from "@/components/Reporting/PieChartCenterLabel";
import {
  type RegisteredVotingMethods,
  useVotingTabulation,
} from "@/hooks/useVotingTabulation";

interface VotingActivityCardProps {
  meetingId: string;
  /** Pre-computed registered-holder method counts to render instead of fetching by `meetingId`. */
  registeredVotingMethodsOverride?: RegisteredVotingMethods | null;
  loadingOverride?: boolean;
}

/**
 * Donut chart of vote submissions by method (Web / Print / IVR) scoped to
 * Registered Holders only — beneficial votes are excluded upstream by
 * {@link useVotingTabulation}, and the header/empty state call out the
 * registered-only scope. Zero-count methods are omitted from the chart.
 */
export default function VotingActivityCard({
  meetingId,
  registeredVotingMethodsOverride,
  loadingOverride = false,
}: VotingActivityCardProps) {
  const { registeredVotingMethods, loading } = useVotingTabulation(meetingId);
  const resolvedMethods =
    registeredVotingMethodsOverride ?? registeredVotingMethods;

  const votingMethodsData = useMemo(() => {
    if (!resolvedMethods) return [];

    const methods: {
      id: string;
      label: string;
      value: number;
      color: string;
    }[] = [];

    if (resolvedMethods.web > 0) {
      methods.push({
        id: "web",
        label: "Web",
        value: resolvedMethods.web,
        color: "var(--mui-palette-chartSeries-0-main)",
      });
    }

    if (resolvedMethods.paper > 0) {
      methods.push({
        id: "print",
        label: "Print",
        value: resolvedMethods.paper,
        color: "var(--mui-palette-chartSeries-1-main)",
      });
    }

    if (resolvedMethods.phone > 0) {
      methods.push({
        id: "ivr",
        label: "IVR",
        value: resolvedMethods.phone,
        color: "var(--mui-palette-chartSeries-2-main)",
      });
    }

    return methods;
  }, [resolvedMethods]);

  const total = votingMethodsData.reduce((sum, item) => sum + item.value, 0);

  const pieChartData = votingMethodsData.map((item, index) => ({
    ...item,
    id: index,
  }));

  return (
    <Card sx={{ flex: 1, height: "100%" }}>
      <CardHeader
        title="Voting Activity — Registered Holders"
        subheader={
          <Typography variant="caption" color="text.secondary">
            Reflects Registered Holder voting only
          </Typography>
        }
      />
      <CardContent>
        {loading || loadingOverride ? (
          <Skeleton variant="rectangular" height={250} />
        ) : votingMethodsData.length === 0 ? (
          <Box
            sx={{
              height: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            No Registered Holder voting activity available
          </Box>
        ) : (
          <Box
            sx={{
              minHeight: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <PieChart
              series={[
                {
                  data: pieChartData,
                  innerRadius: 75,
                  outerRadius: 100,
                  highlightScope: { fade: "global", highlight: "item" },
                },
              ]}
              width={250}
              height={250}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              slotProps={{
                legend: {
                  direction: "horizontal",
                  position: { vertical: "bottom", horizontal: "center" },
                },
              }}
            >
              <PieCenterLabel
                data={{
                  total,
                  label: "Registered Votes",
                  sliceData: pieChartData,
                }}
              />
            </PieChart>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
