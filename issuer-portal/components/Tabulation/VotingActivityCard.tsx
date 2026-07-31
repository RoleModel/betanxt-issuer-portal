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
 * Registered Holders only — beneficial votes are excluded upstream by
 * {@link useVotingTabulation}, and the header/empty state call out the
 * registered-only scope. Zero-count methods are omitted from the chart.
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

  const total = votingMethodsData.reduce((sum, item) => sum + item.value, 0);
  const totalMetric = formatTabulationMetric(total, total, displayMode);
  const showArcLabels = shouldShowTabulationPieArcLabels(
    votingMethodsData.length
  );

  const pieChartData = votingMethodsData.map((item, index) => ({
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
                    const item = votingMethodsData[context.dataIndex];
                    const metric = formatTabulationMetric(
                      value.value,
                      total,
                      displayMode
                    );
                    return `${item.label}: ${metric.display} (${metric.alternate})`;
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
