"use client";

import { CalendarTodayOutlined as CalendarIcon } from "@mui/icons-material";
import { Box, Fade, Grid, Paper, useTheme } from "@mui/material";
import { BNTypographyPair } from "@rolemodel/betanxt-design-system/components/BNTypographyPair";

import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { calculateDaysUntil } from "@/utils/dateUtils";

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

  const shouldUseUpdatedColors = enableTabulationTrackerColors;
  const currentData = data?.meeting_id === currentMeetingId ? data : null;
  const currentVotePercentage = currentData
    ? Number.parseFloat(currentData.vote_percentage)
    : 0;

  const progress = currentData
    ? {
        voted: Math.round(currentVotePercentage),
        unvoted: Math.max(100 - currentVotePercentage, 0),
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
              ? currentData.positions_voted.toLocaleString()
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

          <VoteProgressBar
            enableUpdatedColors={shouldUseUpdatedColors}
            voted={progress.voted}
            unvoted={progress.unvoted}
          />
        </Paper>
      </Grid>
      <HistoricalShareCard
        currentValue={
          currentData ? Number(currentData.shares_voted).toLocaleString() : "--"
        }
        label="Shares Voted"
        previousValue={previousComparablePoint?.votedShares ?? null}
        showPreviousYear={shouldShowPreviousYearInfo}
        sx={sparklineCardSx}
      />
      <HistoricalShareCard
        currentValue={
          currentData
            ? Number(currentData.shares_unvoted).toLocaleString()
            : "--"
        }
        label="Shares Not Voted"
        previousValue={previousComparablePoint?.unvotedShares ?? null}
        showPreviousYear={shouldShowPreviousYearInfo}
        sx={sparklineCardSx}
      />
    </Grid>
  );
};

export default TabulationTracker;
