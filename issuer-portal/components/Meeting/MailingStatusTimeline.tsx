"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
  timelineItemClasses,
} from "@mui/lab";
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import {
  WORKFLOW_STEPS,
  hasNonEmptyString,
  type MailingTimelineDates,
  type WorkflowStep,
} from "@/components/Meeting/mailingTimeline";
import { CustomTooltip } from "@/components/ui/CustomToolTip";

interface MailingStatusTimelineProps {
  readonly activeIndex: number;
  readonly isCSM: boolean;
  readonly isUpdatingStatus: boolean;
  readonly meetingId?: string;
  readonly onStepClick: (step: WorkflowStep) => void;
  readonly timelineDates: MailingTimelineDates;
}

const MailingStatusTimeline = ({
  activeIndex,
  isCSM,
  isUpdatingStatus,
  meetingId,
  onStepClick,
  timelineDates,
}: MailingStatusTimelineProps) => {
  const isClickable =
    isCSM && hasNonEmptyString(meetingId) && !isUpdatingStatus;

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title="Mailing Timeline"
        action={
          isCSM && hasNonEmptyString(meetingId) ? (
            <CustomTooltip title="Click a step to update status">
              <EditIcon
                fontSize="small"
                color="action"
                sx={{ mt: 1.5, mr: 0.5 }}
              />
            </CustomTooltip>
          ) : undefined
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Timeline
          sx={{
            p: 0,
            m: 0,
            [`& .${timelineItemClasses.root}:before`]: {
              flex: 0,
              padding: 0,
            },
          }}
        >
          {WORKFLOW_STEPS.map((step, index) => {
            const isCompleted = activeIndex >= 0 && index <= activeIndex;
            const isCurrent = index === activeIndex;
            const isLast = index === WORKFLOW_STEPS.length - 1;
            const formattedDate = timelineDates[step.label];

            return (
              <TimelineItem
                key={step.label}
                onClick={() => {
                  if (isClickable) onStepClick(step);
                }}
                sx={{
                  cursor: "pointer",
                  borderRadius: 1,
                  mx: -1,
                  px: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <TimelineSeparator sx={{ marginBottom: "-0.5rem" }}>
                  <TimelineDot
                    variant={isCompleted ? "filled" : "outlined"}
                    sx={{
                      mt: 1,
                      bgcolor: isCompleted ? step.paletteVar : "transparent",
                      borderColor: step.paletteVar,
                    }}
                  />
                  {!isLast ? (
                    <TimelineConnector
                      sx={{
                        bgcolor: isCompleted
                          ? step.paletteVar
                          : (theme) => theme.vars.palette.divider,
                      }}
                    />
                  ) : null}
                </TimelineSeparator>
                <TimelineContent sx={{ py: 0.8, px: 2 }}>
                  {isCompleted ? (
                    <Typography
                      variant="body3"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.25 }}
                    >
                      {formattedDate}
                    </Typography>
                  ) : undefined}
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {isCurrent ? (
                      <Chip
                        icon={
                          isLast && isCompleted ? (
                            <CheckCircleIcon
                              sx={{
                                "--mui-palette-Chip-defaultIconColor":
                                  "var(--mui-palette-success-contrastText)",
                                fontSize: 16,
                                boxSizing: "content-box",
                              }}
                            />
                          ) : undefined
                        }
                        label={step.label}
                        size="small"
                        sx={{
                          bgcolor:
                            isLast && isCompleted
                              ? "var(--mui-palette-success-main)"
                              : step.paletteVar,
                          color:
                            isLast && isCompleted
                              ? "var(--mui-palette-success-contrastText)"
                              : step.color,
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    ) : (
                      <Typography
                        variant="body3"
                        fontWeight={500}
                        color="text.secondary"
                      >
                        {step.label}
                      </Typography>
                    )}
                  </Stack>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </CardContent>
    </Card>
  );
};

export default MailingStatusTimeline;
