"use client";

import type {
  SchedulerEvent,
  SchedulerEventColor,
  SchedulerResource,
} from "@mui/x-scheduler/models";

import { Box, Card, CardContent, CardHeader, Skeleton } from "@mui/material";
import { EventTimelinePremium } from "@mui/x-scheduler-premium/event-timeline-premium";

import type { Task } from "@/types/api-exports";

import { useMeeting } from "@/contexts/MeetingContext";

const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseTaskDate = (date: string | null | undefined): Date | null => {
  if (date === null || date === undefined || date === "") {
    return null;
  }

  const dateOnlyParts = dateOnlyPattern.exec(date);
  const parsedDate =
    dateOnlyParts === null
      ? new Date(date)
      : new Date(
          Number(dateOnlyParts[1]),
          Number(dateOnlyParts[2]) - 1,
          Number(dateOnlyParts[3])
        );
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getEventColor = (status: Task["status"]): SchedulerEventColor => {
  if (status === "COMPLETE" || status === "AUTHORIZED") {
    return "green";
  }

  if (status === "NEEDS_AUTHORIZATION" || status === "PENDING_AUTHORIZATION") {
    return "amber";
  }

  return "blue";
};

const MeetingTaskTimeline = () => {
  const { currentMeeting, tasks, tasksLoading } = useMeeting();

  const timelineEvents: SchedulerEvent[] = [];
  const timelineResources: SchedulerResource[] = [];

  for (const task of tasks) {
    const start = parseTaskDate(task.dueDate);
    const taskId = task.id ?? task.taskId;

    if (
      start === null ||
      taskId === null ||
      taskId === undefined ||
      taskId === ""
    ) {
      continue;
    }

    const resourceId = `task-${taskId}`;
    const end = new Date(start.getTime() + oneDayInMilliseconds);

    timelineResources.push({
      id: resourceId,
      title: task.title ?? "Untitled task",
      eventColor: getEventColor(task.status),
    });
    timelineEvents.push({
      id: taskId,
      title: task.owner ?? "Task",
      start: start.toISOString(),
      end: end.toISOString(),
      resource: resourceId,
      color: getEventColor(task.status),
      readOnly: true,
    });
  }

  const firstTimelineEvent = Array.from(timelineEvents)
    .sort(
      (firstEvent, secondEvent) =>
        new Date(firstEvent.start).getTime() -
        new Date(secondEvent.start).getTime()
    )
    .at(0);
  const visibleDate =
    firstTimelineEvent === undefined
      ? (parseTaskDate(currentMeeting?.meetingDate) ?? new Date())
      : new Date(firstTimelineEvent.start);

  return (
    <Card>
      <CardHeader
        title="Meeting task timeline"
        subheader="Tasks are shown on their due dates. Completed items are green."
      />
      <CardContent sx={{ pt: 0 }}>
        {tasksLoading === true ? (
          <Skeleton variant="rounded" height={440} />
        ) : (
          <Box sx={{ height: 440, minWidth: 0 }}>
            <EventTimelinePremium
              readOnly
              events={timelineEvents}
              resources={timelineResources}
              defaultPreset="monthAndYear"
              defaultVisibleDate={visibleDate}
              resourceColumnLabel="Task"
              showCurrentTimeIndicator={false}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MeetingTaskTimeline;
