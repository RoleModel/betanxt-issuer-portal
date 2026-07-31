import { styled } from "@mui/material/styles";
import { useDrawingArea } from "@mui/x-charts";

import { floorAndFormatNumber } from "@/utils/number-utilities";

export interface PieChartData {
  total: number;
  label: string;
  centerValue?: string;
  centerTooltip?: string;
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
  fontWeight: 600,
  fontSize: 38,
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

const PieCenterLabel = ({ data }: { readonly data: PieChartData }) => {
  const { width, height, left, top } = useDrawingArea();
  return (
    <>
      <StyledNumberText
        tabIndex={0}
        x={left + width / 2}
        y={top + height / 2}
        data-testid="totalCount"
        style={{ fontSize: 32 }}
      >
        <title>{data.centerTooltip}</title>
        {data.centerValue ?? floorAndFormatNumber(data.total)}
      </StyledNumberText>
      <StyledDescriptionText tabIndex={0} x={left + width / 2} y={top + height / 1.6}>
        {data.label}
      </StyledDescriptionText>
    </>
  );
};

export default PieCenterLabel;
