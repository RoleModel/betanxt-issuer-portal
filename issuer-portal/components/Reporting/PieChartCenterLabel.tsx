import { styled } from "@mui/material/styles";
import { useDrawingArea } from "@mui/x-charts";

import { floorAndFormatNumber } from "@/utils/number-utilities";

export interface PieChartData {
  total: number;
  label: string;
  fill?: string;
  centerValue?: string;
  centerTooltip?: string;
  sliceData: {
    id: number;
    value: number;
    label: string | undefined;
    color: string;
  }[];
}
const StyledNumberText = styled("text")<{ fill?: string }>(
  ({ theme, fill }) => ({
    fill: fill || theme.vars.palette.text.primary,
    textAnchor: "middle",
    dominantBaseline: "central",
    lineHeight: 1.3,
    fontWeight: 600,
    fontSize: 40,
  })
);

const StyledDescriptionText = styled("text")<{ fill?: string }>(
  ({ theme, fill }) => ({
    fill: fill || theme.vars.palette.text.secondary,
    textAnchor: "middle",
    dominantBaseline: "central",
    lineHeight: "20px",
    fontWeight: 400,
    fontSize: 16,
    fontStyle: "normal",
  })
);
const StyledG = styled("g")(({ theme }) => ({
  fill: theme.vars.palette.background.paper,
}));

const PieCenterLabel = ({ data }: { readonly data: PieChartData }) => {
  const { width, height, left, top } = useDrawingArea();
  return (
    <StyledG transform={`translate(${left + width / 2}, ${top + height / 2})`}>
      <StyledNumberText fill={data.fill} tabIndex={0} data-testid="totalCount">
        <title>{data.centerTooltip}</title>
        {data.centerValue ?? floorAndFormatNumber(data.total)}
      </StyledNumberText>
      <StyledDescriptionText
        fill={data.fill}
        transform="translate(0, 30)"
        tabIndex={0}
      >
        {data.label}
      </StyledDescriptionText>
    </StyledG>
  );
};

export default PieCenterLabel;
