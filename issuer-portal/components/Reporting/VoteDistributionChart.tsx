"use client";

import { Box, Card, CardContent, CardHeader, Typography } from "@mui/material";
import { PieChart as MuiPieChart } from "@mui/x-charts/PieChart";

import PieCenterLabel from "@/components/Reporting/PieChartCenterLabel";
import SkeletonChart from "@/components/ui/SkeletonChart";
import {
  tabulationCardHeaderStyles,
  tabulationChartHeight,
  tabulationDonutCenterY,
  tabulationDonutChartMargin,
  tabulationDonutInnerRadius,
  tabulationDonutOuterRadius,
  TabulationPieArcLabel,
  tabulationVoteDistributionColors,
} from "@/utils/tabulation-card-layout";

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

const VoteDistributionChart = ({ data, loading }: VoteDistributionChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (loading === true) {
    return <SkeletonChart title="Vote Distribution by Account Type" height={300} showLegend />;
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader title="Vote Distribution by Account Type" />
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" height={300}>
            <Typography variant="body1" color="text.secondary">
              No vote distribution data available
            </Typography>
          </Box>
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
      <CardHeader title="Vote Distribution by Account Type" sx={tabulationCardHeaderStyles} />
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
                cy: tabulationDonutCenterY,
                data: pieChartData,
                highlightScope: { fade: "global", highlight: "item" },
                innerRadius: tabulationDonutInnerRadius,
                outerRadius: tabulationDonutOuterRadius,
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
                total,
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
