"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { Gauge } from "@mui/x-charts/Gauge";

import GlossaryText from "@/components/ui/GlossaryText";
import GaugeCenterLabel from "@/components/Reporting/GaugeCenterLabel";
import { CustomTooltip } from "@/components/ui/CustomToolTip";

import { useTabulationDisplay } from "../../contexts/TabulationDisplayContext";
import {
  formatQuorumRequirementPercentLabel,
  type QuorumGaugeViewModel,
} from "../../utils/quorum";
import {
  tabulationCardContentStartStyles,
  tabulationCardHeaderStyles,
  tabulationCardStyles,
} from "../../utils/tabulation-card-layout";
import { formatTabulationMetric } from "../../utils/tabulation-display";

interface QuorumGaugeCardProps {
  readonly title?: string;
  readonly model: QuorumGaugeViewModel | null;
  readonly loading?: boolean;
  readonly className?: string;
}

const QuorumGaugeCard = ({
  title,
  model,
  loading = false,
  className,
}: QuorumGaugeCardProps) => {
  const { displayMode } = useTabulationDisplay();
  const quorumMet = model?.quorumMet === true;
  const statusLabel = quorumMet ? "Quorum Met" : "Below Quorum";
  const statusColor = quorumMet ? "primary" : "default";
  const displayTitle = title ?? "Quorum tracker";
  const representedShares = model?.representedShares ?? 0;
  const totalOutstandingShares = model?.totalOutstandingShares ?? 0;
  const representedMetric: ReturnType<typeof formatTabulationMetric> =
    formatTabulationMetric(
      representedShares,
      totalOutstandingShares,
      displayMode
    );
  const requiredMetric = formatTabulationMetric(
    model?.requiredShares ?? 0,
    totalOutstandingShares,
    displayMode
  );

  return (
    <Card className={className} elevation={3} sx={tabulationCardStyles}>
      <CardHeader
        title={<GlossaryText>{displayTitle}</GlossaryText>}
        subheader={
          <CustomTooltip title={requiredMetric.alternate}>
            <span>
              {displayMode === "numbers"
                ? `Quorum requirement: ${requiredMetric.display} + 1`
                : `Quorum requirement: ${formatQuorumRequirementPercentLabel(model?.quorumRequirementPercent)} + 1`}
            </span>
          </CustomTooltip>
        }
        sx={tabulationCardHeaderStyles}
      />
      <CardContent sx={tabulationCardContentStartStyles}>
        {loading || !model ? (
          <Typography color="text.secondary">Loading quorum data...</Typography>
        ) : (
          <Stack
            spacing={2}
            sx={{
              alignItems: "center",
              height: 160,
              justifyContent: "center",
            }}
          >
            <CustomTooltip title={representedMetric.alternate}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 1,
                  height: 150,
                }}
              >
                <Gauge
                  width={220}
                  height={150}
                  value={
                    displayMode === "numbers"
                      ? representedShares
                      : Math.min(model.percentRepresented, 100)
                  }
                  valueMax={
                    displayMode === "numbers"
                      ? Math.max(totalOutstandingShares, 1)
                      : 100
                  }
                  startAngle={-110}
                  endAngle={110}
                  // Gauge renders its own value text whenever `text` resolves to
                  // anything, and falls back to the raw value when the prop is
                  // omitted — which showed the figure twice. Returning null is
                  // how GaugeValueText is opted out of.
                  text={() => null}
                  sx={{
                    "& .MuiGauge-valueArc": {
                      fill: model.quorumMet
                        ? "var(--mui-palette-primary-main)"
                        : "var(--mui-palette-secondary-main)",
                    },
                    "& .MuiGauge-referenceArc": {
                      fill: "var(--mui-palette-divider)",
                    },
                  }}
                >
                  {/* In place of Gauge's own `text`, so the figure reads as the
                      same kind of number the donuts show. */}
                  <GaugeCenterLabel
                    data={{
                      centerTooltip: representedMetric.alternate,
                      centerValue: representedMetric.display,
                      label: "",
                      sliceData: [],
                      total: representedShares,
                    }}
                  />
                </Gauge>
              </Box>
            </CustomTooltip>

            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Chip color={statusColor} label={statusLabel} size="small" />
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default QuorumGaugeCard;
