"use client";

import type { BarLabelProps } from "@mui/x-charts/BarChart";

import { Box, Card, CardContent, CardHeader, Skeleton } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { useEffect, useState } from "react";

import buildApiClient from "../../domain-models/apiClient";
import { formatNumber } from "../../utils/numberUtils";
import { asArray, asRecord, asString } from "../../utils/typeUtils";

interface Position {
  accountType: string;
  voteStatus: string;
  shares: number;
  sharesVoted: number;
}

interface BeneficialVsRegisteredCardProps {
  readonly meetingId: string;
  readonly chartOverride?: {
    readonly beneficial: number;
    readonly registered: number;
  };
  readonly loadingOverride?: boolean;
}

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = asString(value);
  if (str !== null && str.length > 0) return str;
  // Only convert to string if it's a primitive type
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return "";
};

const normalizePosition = (value: unknown): Position | null => {
  const record = asRecord(value);
  if (record === null) return null;

  // API returns snake_case from PostgREST
  return {
    accountType: toStringValue(record.account_type ?? record.accountType),
    voteStatus: toStringValue(record.vote_status ?? record.voteStatus),
    shares: toFiniteNumber(record.shares),
    sharesVoted: toFiniteNumber(record.shares_voted ?? record.sharesVoted),
  };
};

const StyledText = styled("text")(({ theme }) => ({
  ...theme.typography.body3,
  stroke: "none",
  fill: theme.vars.palette.text.primary,
  textAnchor: "middle",
  dominantBaseline: "central",
  pointerEvents: "none",
}));

const CustomBarLabel = (props: BarLabelProps) => {
  const { x, y, width, children, ...otherProps } = props;

  return (
    <StyledText {...otherProps} x={x + width / 2} y={y - 8} textAnchor="middle">
      {formatNumber(Number(children) || 0)}
    </StyledText>
  );
};

const BeneficialVsRegisteredCard = ({
  meetingId,
  chartOverride,
  loadingOverride = false,
}: BeneficialVsRegisteredCardProps) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (meetingId.length === 0) return;

    const fetchPositions = async () => {
      setLoading(true);
      try {
        const apiClient = await buildApiClient();
        const { data } = await apiClient.GET("/positions", {
          params: {
            query: { meetingId },
          },
        });

        const rawData: unknown[] = Array.isArray(data)
          ? data
          : asArray(asRecord(data)?.positions);

        const positionsList = rawData.reduce<Position[]>((acc, item) => {
          const normalized = normalizePosition(item);
          if (normalized !== null) acc.push(normalized);
          return acc;
        }, []);

        setPositions(positionsList);
      } catch (error) {
        console.error("Failed to fetch positions:", error);
      }

      setLoading(false);
    };

    void fetchPositions();
  }, [meetingId]);

  let chartData = chartOverride;

  if (chartData === undefined) {
    // Beneficial = Non-DTC (beneficial shareholders voting through brokers)
    // Based on wendys_non_dtc_vote_status.csv
    const beneficialVoted = positions
      .filter((p) => p.accountType === "Non-DTC" && p.voteStatus === "Voted")
      .reduce((sum, p) => sum + p.sharesVoted, 0);

    // Registered = DTC/CDS (registered holders/participants)
    // Based on wendys_dtc_vote_status.csv
    const registeredVoted = positions
      .filter((p) => p.accountType === "DTC/CDS" && p.voteStatus === "Voted")
      .reduce((sum, p) => sum + p.sharesVoted, 0);

    chartData = {
      beneficial: beneficialVoted,
      registered: registeredVoted,
    };
  }

  return (
    <Card sx={{ flex: 1, height: "100%" }}>
      <CardHeader title="Beneficial vs. Registered" />
      <CardContent>
        {loading || loadingOverride ? (
          <Skeleton variant="rectangular" height={300} />
        ) : (
          <Box>
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  data: ["Beneficial", "Registered"],
                  colorMap: {
                    type: "ordinal",
                    values: ["Beneficial", "Registered"],
                    colors: [
                      "var(--mui-palette-chartSeries-0-main)",
                      "var(--mui-palette-chartSeries-1-main)",
                    ],
                  },
                },
              ]}
              series={[
                {
                  data: [chartData.beneficial, chartData.registered],
                  barLabel: "value",
                },
              ]}
              height={350}
              margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
              hideLegend={true}
              slots={{ barLabel: CustomBarLabel }}
              yAxis={[
                {
                  position: "none",
                },
              ]}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BeneficialVsRegisteredCard;
