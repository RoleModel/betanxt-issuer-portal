"use client";

import { CalendarTodayOutlined as CalendarIcon } from "@mui/icons-material";
import { Box, Fade, Grid, Paper, useTheme } from "@mui/material";
import { BNTypographyPair } from "@rolemodel/betanxt-design-system/components/BNTypographyPair";

import { useTabulationDisplay } from "@/contexts/TabulationDisplayContext";
import { useTabulationRelease } from "@/contexts/TabulationReleaseContext";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { calculateDaysUntil } from "@/utils/dateUtils";
import { formatTabulationMetric } from "@/utils/tabulation-display";

import type { TabulationTrackerProps } from "./tabulation-tracker/useTabulationTrackerData";

import { HistoricalShareCard } from "./tabulation-tracker/HistoricalShareCard";
import {
  isSpecialMeeting,
  useTabulationTrackerData,
} from "./tabulation-tracker/useTabulationTrackerData";
import { VoteProgressBar } from "./tabulation-tracker/VoteProgressBar";

const TabulationTracker = (props: TabulationTrackerProps) => {
  const {
    currentMeeting,
    currentMeetingId,
    data,
    historicalData,
    voteCutoffDate,
  } = useTabulationTrackerData(props);
  const { enableTabulationTrackerColors } = useFeatureFlags().flags;
  // Dashboard figures follow the same Percentage/Count toggle as the tabulation
  // views, so switching the toggle reformats the tracker too.
  const { displayMode } = useTabulationDisplay();
  // This year's vote figures are withheld until a CSM releases tabulation. The
  // previous-year figures alongside them are published history and stay.
  const { isReleased } = useTabulationRelease();

  const shouldUseUpdatedColors = enableTabulationTrackerColors;
  const currentData = data?.meeting_id === currentMeetingId ? data : null;
  const currentVotePercentage = currentData
    ? Number.parseFloat(currentData.vote_percentage)
    : 0;
  const votedPercentage = Math.min(
    Math.max(Math.round(currentVotePercentage), 0),
    100
  );

  const progress = currentData
    ? {
        voted: votedPercentage,
        unvoted: 100 - votedPercentage,
      }
    : { voted: 0, unvoted: 0 };
  const meetingStatus = currentData?.status ?? currentMeeting?.status ?? "";
  const isCompleted =
    meetingStatus === "COMPLETE" || meetingStatus === "completed";
  const meetingDateValue =
    currentData?.meeting_date ?? currentMeeting?.meetingDate ?? "";
  const meetingDate =
    meetingDateValue.length > 0 ? new Date(meetingDateValue) : null;
  // Show previous-year cards for all annual/EGM meetings regardless of phase
  const shouldShowPreviousYearInfo = !isSpecialMeeting(
    currentMeeting?.meetingType
  );
  const currentMeetingSeriesIndex = historicalData.findIndex(
    (point) => point.isCurrentMeeting
  );
  const previousComparablePoint =
    currentMeetingSeriesIndex > 0
      ? historicalData[currentMeetingSeriesIndex - 1]
      : null;
  // Shares are a two-part split, so each side is a percentage of the pair.
  const totalShares = currentData
    ? Number(currentData.shares_voted) + Number(currentData.shares_unvoted)
    : 0;
  const summaryMetrics = [
    {
      label: isCompleted ? "Meeting Date" : "Days to Meeting",
      value:
        isCompleted && meetingDate
          ? meetingDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            })
          : meetingDate
            ? calculateDaysUntil(meetingDate.toISOString())
            : "--",
      secondarySx: undefined as Record<string, unknown> | undefined,
    },
    ...(isCompleted
      ? [
          {
            label: "Total Positions",
            value: currentData
              ? currentData.total_positions.toLocaleString()
              : "--",
            secondarySx: undefined as Record<string, unknown> | undefined,
          },
          {
            label: "Positions Voted",
            value: currentData
              ? formatTabulationMetric(
                  currentData.positions_voted,
                  currentData.total_positions,
                  displayMode
                ).display
              : "--",
            secondarySx: { whiteSpace: "nowrap" } as Record<string, unknown>,
          },
        ]
      : [
          {
            label: "Vote Cutoff",
            value: voteCutoffDate
              ? `${voteCutoffDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })} 11:59 PM ET`
              : "0",
            secondarySx: { whiteSpace: "nowrap" } as Record<string, unknown>,
          },
        ]),
  ];
  const desktopMetricColumns = summaryMetrics.length;
  const summaryGridTemplateColumns = {
    xs: "repeat(2, minmax(0, 1fr))",
    sm: "repeat(3, minmax(0, 1fr))",
    md: `48px repeat(${desktopMetricColumns}, minmax(0, auto))`,
  };

  const theme = useTheme();

  const sparklineCardSx = {
    backgroundColor: shouldUseUpdatedColors
      ? theme.vars.palette.primary.main
      : theme.vars.palette.keydate.main,
    color: shouldUseUpdatedColors
      ? theme.vars.palette.primary.contrastText
      : theme.vars.palette.keydate.contrastText,
    borderRadius: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "space-between",
    minHeight: shouldShowPreviousYearInfo ? 110 : 105,
    "& > div ": {
      pt: 1,
      pb: shouldShowPreviousYearInfo ? 0 : 1,
      px: 1,
    },
  };

  // Percentages for the previous year use that year's own share total —
  // voted + unvoted — rather than this year's, which would misstate it.
  const previousYearTotalShares = previousComparablePoint
    ? previousComparablePoint.votedShares +
      previousComparablePoint.unvotedShares
    : 0;

  /** Stands in for a figure that exists but is not being disclosed yet. */
  const withheldPlaceholder = "---";
  /** Stands in for a figure this meeting simply has no data for. */
  const missingPlaceholder = "--";

  const formatCurrentShareMetric = (
    shares: number | null
  ): ReturnType<typeof formatTabulationMetric> => {
    if (!isReleased) {
      return { alternate: withheldPlaceholder, display: withheldPlaceholder };
    }

    if (shares === null) {
      return { alternate: missingPlaceholder, display: missingPlaceholder };
    }

    return formatTabulationMetric(shares, totalShares, displayMode);
  };

  const votedMetric = formatCurrentShareMetric(
    currentData ? Number(currentData.shares_voted) : null
  );
  const unvotedMetric = formatCurrentShareMetric(
    currentData ? Number(currentData.shares_unvoted) : null
  );
  const previousVotedMetric = previousComparablePoint
    ? formatTabulationMetric(
        previousComparablePoint.votedShares,
        previousYearTotalShares,
        displayMode
      )
    : null;
  const previousUnvotedMetric = previousComparablePoint
    ? formatTabulationMetric(
        previousComparablePoint.unvotedShares,
        previousYearTotalShares,
        displayMode
      )
    : null;

  return (
    <Grid container spacing={2} sx={{ mt: 1, alignItems: "stretch" }}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Paper
          sx={{
            backgroundColor: (muiTheme) =>
              shouldUseUpdatedColors
                ? muiTheme.vars.palette.primary.main
                : muiTheme.vars.palette.keydate.main,
            color: (muiTheme) =>
              shouldUseUpdatedColors
                ? muiTheme.vars.palette.primary.contrastText
                : muiTheme.vars.palette.keydate.contrastText,
            contain: "paint",
            borderRadius: 1,
            p: 1,
            pb: 0,
            position: "relative",
            px: 2,
            height: "100%",
            minHeight: {
              xs: "105.6px",
              lg: "110.6px",
            },
          }}
        >
          <Fade in timeout={1000} appear>
            <Box
              display="grid"
              gridTemplateColumns={{
                ...summaryGridTemplateColumns,
              }}
              sx={{
                alignItems: "start",
                gap: 1,
                paddingBottom: { xs: 4, sm: 4, md: 3 },
                transition: "grid-template-columns 0.3s ease",
              }}
            >
              <CalendarIcon
                sx={{
                  fontSize: 40,
                  color: "inherit",
                  display: { xs: "none", md: "block" },
                  alignSelf: "center",
                }}
              />
              {summaryMetrics.map((metric) => (
                <Box key={metric.label} sx={{ minWidth: 0 }}>
                  <BNTypographyPair
                    alignItems={{ sx: "start", md: "start" }}
                    fullWidth
                    primary={{
                      variant: "body2",
                      fontWeight: 500,
                      text: metric.label,
                      sx: { whiteSpace: "nowrap" },
                    }}
                    secondary={{
                      variant: "h2",
                      fontWeight: 600,
                      text: metric.value,
                      sx: metric.secondarySx,
                    }}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      alignItems: "flex-start",
                      justifyContent: "center",
                      textAlign: "left",
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Fade>

          {/* Dropped rather than emptied while withheld — a bar at zero reads
              as "nobody has voted" instead of "we are not saying yet". */}
          {isReleased ? (
            <VoteProgressBar
              enableUpdatedColors={shouldUseUpdatedColors}
              voted={progress.voted}
              unvoted={progress.unvoted}
            />
          ) : null}
        </Paper>
      </Grid>
      <HistoricalShareCard
        currentValue={votedMetric.display}
        alternateValue={votedMetric.alternate}
        label="Shares Voted"
        previousValue={previousVotedMetric?.display ?? null}
        previousAlternateValue={previousVotedMetric?.alternate ?? null}
        showPreviousYear={shouldShowPreviousYearInfo}
        sx={sparklineCardSx}
      />
      <HistoricalShareCard
        currentValue={unvotedMetric.display}
        alternateValue={unvotedMetric.alternate}
        label="Shares Not Voted"
        previousValue={previousUnvotedMetric?.display ?? null}
        previousAlternateValue={previousUnvotedMetric?.alternate ?? null}
        showPreviousYear={shouldShowPreviousYearInfo}
        sx={sparklineCardSx}
      />
    </Grid>
  );
};

export default TabulationTracker;
