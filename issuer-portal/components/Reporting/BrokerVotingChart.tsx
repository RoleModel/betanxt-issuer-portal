"use client";

import {
  Card,
  CardContent,
  CardHeader,
  MenuItem,
  TextField,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import React, { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import SkeletonChart from "@/components/ui/SkeletonChart";
import { truncateNumber } from "@/utils/number-utilities";

interface BrokerVotingData {
  broker: string;
  for: number;
  against: number;
  abstain: number;
  total: number;
}

interface Proposal {
  id: string;
  proposalNumber: string;
  proposalTitle: string;
}

interface BrokerVotingChartProps {
  readonly meetingId?: string;
  readonly proposals?: readonly Proposal[];
  readonly brokerData?: Record<string, BrokerVotingData[]>;
  readonly loading?: boolean;
  /** Optional card subheader, e.g. the currently selected event. */
  readonly subheader?: string;
}

const EMPTY_PROPOSALS: readonly Proposal[] = [];
const EMPTY_BROKER_DATA: Record<string, BrokerVotingData[]> = {};

const BrokerVotingChart = ({
  proposals = EMPTY_PROPOSALS,
  brokerData = EMPTY_BROKER_DATA,
  loading = false,
  subheader,
}: BrokerVotingChartProps) => {
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");

  // Derive the effective selection during render: keep the user's choice while
  // it is still valid, otherwise fall back to the first available proposal.
  const effectiveProposalId =
    selectedProposalId &&
    proposals.some((proposal) => proposal.id === selectedProposalId)
      ? selectedProposalId
      : (proposals[0]?.id ?? "");

  // Map generic proposal keys (proposal1, proposal2) to actual proposal IDs based on order
  const mappedBrokerData = React.useMemo(() => {
    const mapped: Record<string, BrokerVotingData[]> = {};

    // Sort proposals by proposal number to get consistent order
    const sortedProposals = [...proposals].sort((a, b) => {
      const numA = parseFloat(a.proposalNumber.toString()) || 0;
      const numB = parseFloat(b.proposalNumber.toString()) || 0;
      return numA - numB;
    });

    Object.entries(brokerData).forEach(([key, data]) => {
      // Map "proposal1" -> first proposal, "proposal2" -> second proposal, etc.
      const proposalIndex = parseInt(key.replace("proposal", "")) - 1;
      if (proposalIndex >= 0 && proposalIndex < sortedProposals.length) {
        const proposalId = sortedProposals[proposalIndex]?.id;
        if (proposalId) {
          mapped[proposalId] = data;
        }
      }
    });

    return mapped;
  }, [brokerData, proposals]);

  // Get broker data for selected proposal
  const data =
    effectiveProposalId && mappedBrokerData[effectiveProposalId]
      ? mappedBrokerData[effectiveProposalId]
      : [];
  const hasData = Object.keys(mappedBrokerData).length > 0;

  // Early return for loading state - like other charts on the page
  if (loading) {
    return (
      <SkeletonChart
        title="Broker Voting by Proposal"
        height={350}
        showLegend
      />
    );
  }

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title="Broker Voting by Proposal"
        subheader={subheader}
        action={
          <TextField
            select
            size="small"
            label="Proposal"
            value={effectiveProposalId}
            onChange={(e) => {
              setSelectedProposalId(e.target.value);
            }}
            sx={{ minWidth: 200 }}
          >
            {proposals.map((proposal) => (
              <MenuItem key={proposal.id} value={proposal.id}>
                {proposal.proposalNumber}
              </MenuItem>
            ))}
          </TextField>
        }
      />
      <CardContent>
        {!hasData ? (
          <EmptyState
            title="No broker voting data available"
            description="Broker voting data will appear when available."
          />
        ) : data.length === 0 ? (
          <EmptyState
            title="No broker voting data for this proposal"
            description="Please select a different proposal."
          />
        ) : (
          <BarChart
            layout="horizontal"
            xAxis={[
              {
                scaleType: "linear",
                tickMinStep: 6,
                valueFormatter: (value) => {
                  if (value == null) return "0";
                  return String(truncateNumber(value));
                },
              },
            ]}
            yAxis={[
              {
                scaleType: "band",
                // Ensure all broker names are strings to prevent chart rendering errors
                data: data.map((d) => String(d.broker || "Unknown")),
                width: 100,
              },
            ]}
            series={[
              {
                data: data.map((d) => d.for),
                label: "For",
                stack: "total",
                color: "var(--mui-palette-chartSeries-1-main)",
              },
              {
                data: data.map((d) => d.against),
                label: "Against",
                stack: "total",
                color: "var(--mui-palette-chartSeries-5-main)",
              },
              {
                data: data.map((d) => d.abstain),
                label: "Abstain",
                stack: "total",
                color: "var(--mui-palette-action-active)",
              },
            ]}
            height={Math.max(330, data.length * 50 + 80)}
            margin={{ left: 10, right: 20, top: 10, bottom: 40 }}
            grid={{ vertical: true, horizontal: false }}
            slotProps={{
              legend: {
                direction: "horizontal",
                position: { vertical: "bottom", horizontal: "center" },
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BrokerVotingChart;
