"use client";

import { Box, Card, CardContent, CardHeader, Skeleton } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";

import {
  type RegisteredVotingMethods,
  useVotingTabulation,
} from "../../hooks/use-voting-tabulation";
import {
  tabulationCardContentStyles,
  tabulationCardHeaderStyles,
  tabulationCardStyles,
  tabulationChartHeight,
  tabulationDonutCenterY,
  tabulationDonutChartMargin,
  tabulationDonutInnerRadius,
  tabulationDonutOuterRadius,
  shouldShowTabulationPieArcLabels,
  TabulationPieArcLabel,
} from "../../utils/tabulation-card-layout";
import PieCenterLabel from "../Reporting/PieChartCenterLabel";
import { useTabulationDisplay } from "../../contexts/TabulationDisplayContext";
import { formatTabulationMetric } from "../../utils/tabulation-display";

interface VotingActivityCardProps {
  readonly meetingId: string;
  /** Pre-computed registered-holder method counts to render instead of fetching by `meetingId`. */
  readonly registeredVotingMethodsOverride?: RegisteredVotingMethods | null;
  readonly loadingOverride?: boolean;
}

interface VotingMethodData {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly sharesVoted: number;
  readonly color: string;
}

const emptyPieSlice = {
  color: "var(--mui-palette-divider)",
  id: "empty",
  label: undefined,
  sharesVoted: 0,
  value: 1,
} as const;

const votingMethodDefinitions = [
  {
    id: "web",
    label: "Web",
    color: "var(--mui-palette-primary-main)",
  },
  {
    id: "print",
    label: "Print",
    color: "var(--mui-palette-secondary-main)",
  },
  {
    id: "ivr",
    label: "IVR",
    color: "var(--mui-palette-primary-light)",
  },
] as const;

const buildVotingMethodsData = (
  resolvedMethods: RegisteredVotingMethods | null
): VotingMethodData[] => {
  if (resolvedMethods === null) return [];

  const methods: VotingMethodData[] = [];

  if (resolvedMethods.web > 0) {
    methods.push({
      id: "web",
      label: "Web",
      value: resolvedMethods.web,
      color: "var(--mui-palette-primary-main)",
      sharesVoted: 34,
    });
  }

  if (resolvedMethods.paper > 0) {
    methods.push({
      id: "print",
      label: "Print",
      value: resolvedMethods.paper,
      color: "var(--mui-palette-secondary-main)",
      sharesVoted: 12,
    });
  }

  if (resolvedMethods.phone > 0) {
    methods.push({
      id: "ivr",
      label: "IVR",
      value: resolvedMethods.phone,
      color: "var(--mui-palette-primary-light)",
      sharesVoted: 4,
    });
  }

  return methods;
};

/**
 * Donut chart of vote submissions by method (Web / Print / IVR) scoped to
 * Registered Holders only. Beneficial votes are excluded upstream by
 * {@link useVotingTabulation}; when no registered votes exist, an empty
 * divider-colored donut preserves the chart layout. Zero-count methods remain
 * in the legend using the divider color.
 */
const VotingActivityCard = ({
  meetingId,
  registeredVotingMethodsOverride,
  loadingOverride = false,
}: VotingActivityCardProps) => {
  const { displayMode } = useTabulationDisplay();
  const { registeredVotingMethods, loading } = useVotingTabulation(meetingId);
  const resolvedMethods =
    registeredVotingMethodsOverride ?? registeredVotingMethods;

  const votingMethodsData = buildVotingMethodsData(resolvedMethods);
  const hasRegisteredVotingActivity = votingMethodsData.length > 0;
  const votingMethodsWithLegendItems = votingMethodDefinitions.map(
    (definition) => {
      const method = votingMethodsData.find(
        (item) => item.id === definition.id
      );

      return {
        ...definition,
        color:
          method === undefined
            ? "var(--mui-palette-divider)"
            : definition.color,
        sharesVoted: method?.sharesVoted ?? 0,
        value: method?.value ?? 0,
      };
    }
  );

  const total = votingMethodsData.reduce((sum, item) => sum + item.value, 0);
  const totalMetric = formatTabulationMetric(total, total, displayMode);
  const showArcLabels =
    hasRegisteredVotingActivity &&
    shouldShowTabulationPieArcLabels(votingMethodsData.length);

  const pieChartData = [
    ...votingMethodsWithLegendItems,
    ...(hasRegisteredVotingActivity ? [] : [emptyPieSlice]),
  ].map((item, index) => ({
    ...item,
    votes: item.value,
    id: index,
  }));

  return (
    <Card sx={tabulationCardStyles}>
      <CardHeader
        title="Voting Activity"
        subheader="Reflects Registered Holder voting only"
        sx={tabulationCardHeaderStyles}
      />
      <CardContent sx={tabulationCardContentStyles}>
        {loading || loadingOverride ? (
          <Skeleton variant="rectangular" height={250} />
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
                  cy: tabulationDonutCenterY,
                  innerRadius: tabulationDonutInnerRadius,
                  outerRadius: tabulationDonutOuterRadius,
                  highlightScope: { fade: "global", highlight: "item" },
                  arcLabel: showArcLabels
                    ? (item) => {
                        const votingMethod = pieChartData.find(
                          (currentMethod) => currentMethod.id === item.id
                        );
                        if (votingMethod === undefined) return "";

                        const metric = formatTabulationMetric(
                          votingMethod.value,
                          total,
                          displayMode
                        );
                        return `${votingMethod.label}: ${metric.display}`;
                      }
                    : undefined,
                  arcLabelMinAngle: showArcLabels ? 5 : undefined,
                  valueFormatter: (value, context) => {
                    const item = pieChartData[context.dataIndex];
                    if (item?.label === undefined) {
                      return "";
                    }

                    const metric = formatTabulationMetric(
                      value.value,
                      total,
                      displayMode
                    );
                    // The tooltip already renders the series label, so return
                    // only the value. Active display mode leads.
                    return `${metric.display} (${metric.alternate})`;
                  },
                },
              ]}
              width={300}
              height={tabulationChartHeight}
              margin={tabulationDonutChartMargin}
              slotProps={{
                legend: {
                  direction: "horizontal",
                  position: { vertical: "bottom", horizontal: "center" },
                },
              }}
              slots={{ pieArcLabel: TabulationPieArcLabel }}
            >
              <PieCenterLabel
                data={{
                  total,
                  centerTooltip: totalMetric.alternate,
                  centerValue: totalMetric.display,
                  label: "Votes",
                  sliceData: pieChartData,
                }}
              />
            </PieChart>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VotingActivityCard;
