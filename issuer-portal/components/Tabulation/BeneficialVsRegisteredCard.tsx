"use client";

import type { BarLabelProps } from "@mui/x-charts/BarChart";

import { Box, Card, CardContent, CardHeader, Skeleton } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { useEffect, useState } from "react";

import { useTabulationDisplay } from "../../contexts/TabulationDisplayContext";
import buildApiClient from "../../domain-models/apiClient";
import {
  getHolderTypeFromCategory,
  type HolderCategory,
  normalizeHolderCategory,
} from "../../utils/holderCategory";
import { formatNumber } from "../../utils/number-utilities";
import {
  tabulationCardContentStyles,
  tabulationCardHeaderStyles,
  tabulationCardStyles,
} from "../../utils/tabulation-card-layout";
import {
  formatTabulationMetric,
  formatTabulationPercentage,
} from "../../utils/tabulation-display";
import { asArray, asRecord, asString } from "../../utils/typeUtils";

interface Position {
  accountType: string;
  holderCategory: HolderCategory | null;
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

const beneficialBarColor = "var(--mui-palette-secondary-main)";
const beneficialBarContrastText = "var(--mui-palette-secondary-contrastText)";
const registeredBarColor = "var(--mui-palette-primary-main)";
const registeredBarContrastText = "var(--mui-palette-primary-contrastText)";

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
    holderCategory: normalizeHolderCategory(
      record.holder_category ?? record.holderCategory
    ),
    voteStatus: toStringValue(record.vote_status ?? record.voteStatus),
    shares: toFiniteNumber(record.shares),
    sharesVoted: toFiniteNumber(record.shares_voted ?? record.sharesVoted),
  };
};

const getBarContrastText = (barColor: string): string => {
  if (barColor === beneficialBarColor) return beneficialBarContrastText;
  if (barColor === registeredBarColor) return registeredBarContrastText;
  return "var(--mui-palette-text-primary)";
};

const CustomBarLabel = (props: BarLabelProps) => {
  const { displayMode } = useTabulationDisplay();
  const { children, className, color, style, width, x, y } = props;
  const value = Number(children) || 0;

  return (
    <text
      className={className}
      dominantBaseline="central"
      fill={getBarContrastText(color)}
      pointerEvents="none"
      stroke="none"
      style={style}
      textAnchor="middle"
      x={x + width / 2}
      y={y + 20}
    >
      {displayMode === "numbers"
        ? formatNumber(value)
        : formatTabulationPercentage(value)}
    </text>
  );
};

const BeneficialVsRegisteredCard = ({
  meetingId,
  chartOverride,
  loadingOverride = false,
}: BeneficialVsRegisteredCardProps) => {
  const { displayMode } = useTabulationDisplay();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (meetingId.length === 0) return;

    let ignore = false;

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

        if (!ignore) setPositions(positionsList);
      } catch (error) {
        console.error("Failed to fetch positions:", error);
      }

      if (!ignore) setLoading(false);
    };

    void fetchPositions();

    return () => {
      ignore = true;
    };
  }, [meetingId]);

  let chartData = chartOverride;

  if (chartData === undefined) {
    const beneficialVoted = positions
      .filter(
        (position) =>
          position.voteStatus === "Voted" &&
          getHolderTypeFromCategory(
            position.holderCategory,
            position.accountType
          ) === "beneficial"
      )
      .reduce((sum, p) => sum + p.sharesVoted, 0);

    const registeredVoted = positions
      .filter(
        (position) =>
          position.voteStatus === "Voted" &&
          getHolderTypeFromCategory(
            position.holderCategory,
            position.accountType
          ) === "registered"
      )
      .reduce((sum, p) => sum + p.sharesVoted, 0);

    chartData = {
      beneficial: beneficialVoted,
      registered: registeredVoted,
    };
  }

  const totalShares = chartData.beneficial + chartData.registered;
  const shareCounts = [chartData.beneficial, chartData.registered];
  const displayedValues = shareCounts.map((value) =>
    displayMode === "numbers"
      ? value
      : totalShares > 0
        ? (value / totalShares) * 100
        : 0
  );

  return (
    <Card sx={tabulationCardStyles}>
      <CardHeader
        title="Beneficial vs. Registered"
        sx={tabulationCardHeaderStyles}
      />
      <CardContent sx={tabulationCardContentStyles}>
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
                    colors: [beneficialBarColor, registeredBarColor],
                  },
                },
              ]}
              series={[
                {
                  data: displayedValues,
                  barLabel: "value",
                  valueFormatter: (value, context) => {
                    if (!Number.isFinite(value)) return "";
                    const shareCount = shareCounts[context.dataIndex] ?? 0;
                    const metric = formatTabulationMetric(
                      shareCount,
                      totalShares,
                      displayMode
                    );
                    return `${metric.display} (${metric.alternate})`;
                  },
                },
              ]}
              height={360}
              margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
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
