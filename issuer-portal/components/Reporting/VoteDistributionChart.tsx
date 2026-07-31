"use client";

import { HowToVoteOutlined } from "@mui/icons-material";
import { Box, Card, CardContent, CardHeader } from "@mui/material";
import { PieChart as MuiPieChart } from "@mui/x-charts/PieChart";

import EmptyState from "@/components/EmptyState";
import PieCenterLabel from "@/components/Reporting/PieChartCenterLabel";
import SkeletonChart from "@/components/ui/SkeletonChart";
import { useTabulationDisplay } from "@/contexts/TabulationDisplayContext";
import {
  shouldShowTabulationPieArcLabels,
  tabulationCardHeaderStyles,
  tabulationChartHeight,
  tabulationDonutCenterY,
  tabulationDonutChartMargin,
  tabulationDonutInnerRadius,
  tabulationDonutOuterRadius,
  tabulationMinArcLabelAngle,
  TabulationPieArcLabel,
  tabulationVoteDistributionColors,
} from "@/utils/tabulation-card-layout";
import { formatTabulationMetric } from "@/utils/tabulation-display";

interface VoteDistributionData {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface VoteDistributionChartProps {
  readonly data: VoteDistributionData[];
  readonly loading?: boolean;
}

/** Slice ids that represent shares actually voted, as opposed to unvoted. */
const VOTED_SLICE_IDS: ReadonlySet<string> = new Set([
  "dtc-voted",
  "non-dtc-voted",
]);

const VoteDistributionChart = ({
  data,
  loading,
}: VoteDistributionChartProps) => {
  const { displayMode } = useTabulationDisplay();
  // Every slice, voted and unvoted, so each slice's share of the whole is right.
  const distributionTotal = data.reduce((sum, item) => sum + item.value, 0);
  // The centre reads "Total Votes", so it must count only the voted slices.
  // Summing all of them reported total shares outstanding as votes, showing
  // tens of millions of votes on meetings where nothing had been voted yet.
  const totalVotes = data.reduce(
    (sum, item) => (VOTED_SLICE_IDS.has(item.id) ? sum + item.value : sum),
    0
  );
  const totalMetric = formatTabulationMetric(
    totalVotes,
    distributionTotal,
    displayMode
  );

  if (loading === true) {
    return (
      <SkeletonChart
        title="Vote Distribution by Account Type"
        height={300}
        showLegend
      />
    );
  }

  // With no votes cast there is no distribution to draw — every slice would be
  // an unvoted bucket around a zero centre, which reads as though millions of
  // votes exist. Show the empty state until something has actually been voted.
  if (data.length === 0 || totalVotes === 0) {
    return (
      <Card>
        <CardHeader
          title="Vote Distribution by Account Type"
          sx={tabulationCardHeaderStyles}
        />
        <CardContent sx={{ p: 0 }}>
          <EmptyState
            description="Once shares are voted, this chart will break the results down by account type."
            icon={<HowToVoteOutlined color="disabled" fontSize="large" />}
            minHeight="unset"
            title="No votes recorded yet"
          />
        </CardContent>
      </Card>
    );
  }

  // Normalize ids to numeric values for components expecting number ids
  const pieChartData = data.map((item, index) => ({
    ...item,
    color: tabulationVoteDistributionColors[item.id] ?? item.color,
    id: index,
  }));

  return (
    <Card>
      <CardHeader
        title="Vote Distribution by Account Type"
        sx={tabulationCardHeaderStyles}
      />
      <CardContent>
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            minHeight: 250,
          }}
        >
          <MuiPieChart
            series={[
              {
                arcLabel: shouldShowTabulationPieArcLabels(pieChartData.length)
                  ? (item) => {
                      const metric = formatTabulationMetric(
                        item.value,
                        distributionTotal,
                        displayMode
                      );
                      return `${item.label ?? ""}: ${metric.display}`;
                    }
                  : undefined,
                arcLabelMinAngle: tabulationMinArcLabelAngle,
                cy: tabulationDonutCenterY,
                data: pieChartData,
                highlightScope: { fade: "global", highlight: "item" },
                innerRadius: tabulationDonutInnerRadius,
                outerRadius: tabulationDonutOuterRadius,
                // Show both representations; the active display mode leads.
                valueFormatter: (item) => {
                  const metric = formatTabulationMetric(
                    item.value,
                    distributionTotal,
                    displayMode
                  );
                  return `${metric.display} (${metric.alternate})`;
                },
              },
            ]}
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
                total: totalVotes,
                centerTooltip: totalMetric.alternate,
                centerValue: totalMetric.display,
                label: "Total Votes",
                sliceData: pieChartData,
              }}
            />
          </MuiPieChart>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VoteDistributionChart;
