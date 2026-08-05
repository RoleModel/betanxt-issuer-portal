import { Box, Card, CardContent, CardHeader, Skeleton } from "@mui/material";

interface SkeletonChartProps {
  readonly title?: string;
  readonly height?: number;
  readonly showLegend?: boolean;
  readonly noCard?: boolean;
}

const SkeletonChart = ({
  title,
  height = 300,
  showLegend = false,
  noCard = false,
}: SkeletonChartProps) => {
  const content = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Main chart area */}
      <Skeleton
        variant="rectangular"
        width="100%"
        height={height}
        sx={{ borderRadius: 1 }}
      />

      {/* Legend area */}
      {showLegend ? (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Skeleton variant="rectangular" width={80} height={20} />
          <Skeleton variant="rectangular" width={80} height={20} />
          <Skeleton variant="rectangular" width={80} height={20} />
        </Box>
      ) : null}
    </Box>
  );

  if (noCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader
        title={
          title ? (
            <Skeleton variant="text" width="60%" height={32} />
          ) : undefined
        }
      />
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default SkeletonChart;
