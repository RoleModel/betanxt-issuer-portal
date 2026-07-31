import type { SxProps, Theme } from "@mui/material/styles";

import { Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { BNTypographyPair } from "@rolemodel/betanxt-design-system/components/BNTypographyPair";

interface HistoricalShareCardProps {
  readonly currentValue: string;
  readonly label: string;
  readonly previousValue: number | null;
  readonly showPreviousYear: boolean;
  readonly sx: SxProps<Theme>;
}

export const HistoricalShareCard = ({
  currentValue,
  label,
  previousValue,
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
        secondary={{ variant: "h2", fontWeight: 600, text: currentValue }}
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
            <Typography variant="body3" fontWeight={600} color="inherit">
              {previousValue.toLocaleString()}
            </Typography>
          )}
        </Stack>
      ) : null}
    </Paper>
  </Grid>
);
