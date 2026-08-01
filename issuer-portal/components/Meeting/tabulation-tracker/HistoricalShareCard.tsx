import type { SxProps, Theme } from "@mui/material/styles";

import { Box, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { BNTypographyPair } from "@rolemodel/betanxt-design-system/components/BNTypographyPair";

import { CustomTooltip } from "@/components/ui/CustomToolTip";

interface HistoricalShareCardProps {
  readonly currentValue: string;
  /**
   * The same figure in the other representation — a percentage when
   * {@link currentValue} is a share count, and vice versa. Shown on hover so
   * both readings are available without toggling the whole page.
   */
  readonly alternateValue: string;
  readonly label: string;
  /**
   * Previous year's figure, already formatted in the same representation as
   * {@link currentValue} — a raw count here next to a percentage above looked
   * mismatched. Percentages are relative to that year's own share total.
   */
  readonly previousValue: string | null;
  /** Previous year's figure in the other representation, for its tooltip. */
  readonly previousAlternateValue: string | null;
  readonly showPreviousYear: boolean;
  readonly sx: SxProps<Theme>;
}

export const HistoricalShareCard = ({
  currentValue,
  alternateValue,
  label,
  previousValue,
  previousAlternateValue,
  showPreviousYear,
  sx,
}: HistoricalShareCardProps) => (
  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
    <Paper sx={sx}>
      <BNTypographyPair
        alignItems={{ sx: "start", md: "end" }}
        fullWidth
        primary={{
          variant: "body2",
          fontWeight: 500,
          text: label,
          sx: { whiteSpace: "nowrap" },
        }}
        secondary={{
          variant: "h2",
          fontWeight: 600,
          // Anchored to the figure itself rather than the surrounding block, so
          // the tooltip points at the number instead of the middle of the card.
          text: (
            <CustomTooltip placement="bottom-end" title={alternateValue}>
              <Box component="span" sx={{ display: "inline-block" }}>
                {currentValue}
              </Box>
            </CustomTooltip>
          ),
        }}
        sx={{ flex: 1 }}
      />
      {showPreviousYear ? (
        <Stack direction="row" alignItems="center" justifyContent="end" gap={1}>
          <Typography variant="body3" sx={{ lineHeight: 2.5 }}>
            Previous year:
          </Typography>
          {previousValue === null ? (
            <Skeleton variant="text" width={48} />
          ) : (
            <CustomTooltip
              placement="bottom-end"
              title={previousAlternateValue ?? ""}
            >
              <Typography variant="body3" fontWeight={600} color="inherit">
                {previousValue}
              </Typography>
            </CustomTooltip>
          )}
        </Stack>
      ) : null}
    </Paper>
  </Grid>
);
