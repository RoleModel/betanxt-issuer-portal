import { styled } from "@mui/material/styles";
import { useDrawingArea } from "@mui/x-charts";

import { floorAndFormatNumber, fontSizeScaledBy } from "@/utils/numberUtils";

export interface PieChartData {
  total: number;
  label: string;
  centerPercentage?: string;
  sliceData: {
    id: number;
    value: number;
    label: string | undefined;
    color: string;
  }[];
}
const StyledNumberText = styled("text")(({ theme }) => ({
  fill: theme.vars.palette.text.primary,
  textAnchor: "middle",
  dominantBaseline: "central",
  lineHeight: 1.3,
  fontWeight: 700,
  fontSize: 32,
}));

const StyledDescriptionText = styled("text")(({ theme }) => ({
  fill: theme.vars.palette.text.secondary,
  textAnchor: "middle",
  dominantBaseline: "central",
  lineHeight: "20px",
  fontWeight: 400,
  fontSize: "100%",
  fontStyle: "normal",
}));

function PieCenterLabel({ data }: { data: PieChartData }) {
  const { width, height, left, top } = useDrawingArea();
  return (
    <>
      <StyledNumberText
        tabIndex={0}
        x={left + width / 2}
        y={top + height / 2.1}
        data-testid="totalCount"
        style={{ fontSize: fontSizeScaledBy(data.total) }}
      >
        {data.centerPercentage ?? floorAndFormatNumber(data.total)}
      </StyledNumberText>
      <StyledDescriptionText tabIndex={0} x={left + width / 2} y={top + height / 1.7}>
        {data.label}
      </StyledDescriptionText>
    </>
  );
}

export default PieCenterLabel;
