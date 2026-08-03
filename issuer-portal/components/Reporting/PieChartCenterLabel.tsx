import { styled } from "@mui/material/styles";
import { useDrawingArea } from "@mui/x-charts";

import { floorAndFormatNumber } from "@/utils/number-utilities";

export interface PieChartData {
  total: number;
  label: string;
  fill?: string;
  showStroke?: boolean;
  stroke?: string;
  centerValue?: string;
  centerTooltip?: string;
  sliceData: {
    id: number;
    value: number;
    label: string | undefined;
    color: string;
  }[];
}
const StyledNumberText = styled("text")<{
  fill?: string;
  showStroke?: boolean;
  stroke?: string;
}>(({ theme, fill, showStroke, stroke }) => ({
  fill: (fill ?? "") || theme.vars.palette.text.primary,
  stroke: (showStroke ?? false) ? stroke : "none",
  strokeWidth: (showStroke ?? false) ? 1 : 0,
  textAnchor: "middle",
  dominantBaseline: "central",
  lineHeight: 1.3,
  fontWeight: 600,
  fontSize: 32,
}));

const StyledDescriptionText = styled("text")<{ fill?: string }>(({ theme, fill }) => ({
  fill: (fill ?? "") || theme.vars.palette.text.secondary,
  textAnchor: "middle",
  dominantBaseline: "central",
  lineHeight: "20px",
  fontWeight: 400,
  fontSize: 16,
  fontStyle: "normal",
}));
const StyledG = styled("g")(({ theme }) => ({
  fill: theme.vars.palette.background.paper,
}));

/**
 * The centre metric itself, positioned by whoever renders it.
 *
 * @remarks
 * Split out from `PieCenterLabel` so the quorum gauge can show the same label:
 * a gauge's centre is not its drawing area's centre — the arc is struck between
 * -110° and 110°, so it sits low in its box — and it has to position from the
 * gauge's own `cx`/`cy` instead. Everything about how the label *looks* lives
 * here, so the donuts and the gauge cannot drift apart.
 */
export const CenterLabelContent = ({
  data,
  transform,
}: {
  readonly data: PieChartData;
  readonly transform: string;
}) => (
  <StyledG transform={transform}>
    <StyledNumberText
      fill={data.fill}
      showStroke={data.showStroke}
      stroke={data.stroke}
      tabIndex={0}
      data-testid="totalCount"
    >
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

const PieCenterLabel = ({ data }: { readonly data: PieChartData }) => {
  const { width, height, left, top } = useDrawingArea();

  return (
    <CenterLabelContent
      data={data}
      transform={`translate(${left + width / 2}, ${top + height / 2})`}
    />
  );
};

export default PieCenterLabel;
