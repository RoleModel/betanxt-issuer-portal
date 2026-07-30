"use client";

import type {
  SchedulerEvent,
  SchedulerResource,
} from "@mui/x-scheduler/models";
import type { MouseEvent } from "react";

import {
  Add,
  DashboardOutlined,
  EditOutlined,
  SearchOutlined,
  TableRowsOutlined,
  ViewTimelineOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { getContrastRatio } from "@mui/material/styles";
import { EventTimelinePremium } from "@mui/x-scheduler-premium/event-timeline-premium";
import { useSession } from "next-auth/react";
import NextLink from "next/link";
import { useState } from "react";

import type { EventRow } from "@/utils/eventData";

import { NewClientDrawer } from "@/components/Clients/NewClientDrawer";
import { useEvents } from "@/hooks/useEvents";
import { getBrandConfigByTicker } from "@/utils/brandConfig";
import { getMeetingUrl } from "@/utils/eventData";

const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
const minimumTimelineHeight = 320;
const maximumTimelineHeight = 560;
const timelineHeaderHeight = 80;
const timelineRowHeight = 54;
const fallbackBrandColor = "#0078A3";
const advancedMailWarningDays = 10;
const weekLengthInDays = 7;

type EventsView = "table" | "timeline";
type SignalSeverity = "error" | "warning" | "info";
type TableOrder = "asc" | "desc";
type TableOrderBy = "client" | "mailingDate" | "recordDate" | "risk";

interface OperationalSignal {
  label: string;
  severity: SignalSeverity;
  explanation?: string;
}

const parseEventDate = (date: string): Date | null => {
  const [month, day, year] = date.split("/").map(Number);

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(year)
  ) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatEventTitle = (event: EventRow): string =>
  `${event.eventType} · ${event.eventDate}`;

const getTimelineEventClassName = (eventId: string): string =>
  `timeline-event-${eventId.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;

const getEventStartDate = (event: EventRow): Date | null => {
  const workflowDates = [
    event.brokerSearchDate,
    event.recordDate,
    event.mailingDate,
  ]
    .map((date) =>
      date === null || date === undefined ? null : parseEventDate(date)
    )
    .filter((date): date is Date => date !== null);

  const meetingDate = parseEventDate(event.eventDate);
  if (meetingDate === null) {
    return null;
  }

  return workflowDates.reduce(
    (earliestDate, date) =>
      date.getTime() < earliestDate.getTime() ? date : earliestDate,
    meetingDate
  );
};

const getDaysUntil = (date: Date, now: Date): number =>
  Math.ceil((date.getTime() - now.getTime()) / oneDayInMilliseconds);

const isMailingComplete = (event: EventRow): boolean =>
  event.mailingStatus?.toLowerCase().includes("completed") ?? false;

const getOperationalSignals = (
  event: EventRow,
  now: Date
): OperationalSignal[] => {
  const signals: OperationalSignal[] = [];
  const workflowDates = [
    event.brokerSearchDate,
    event.recordDate,
    event.mailingDate,
  ]
    .map((date) =>
      date === null || date === undefined ? null : parseEventDate(date)
    )
    .filter((date): date is Date => date !== null);
  const hasOverdueDeadline = workflowDates.some(
    (date) => getDaysUntil(date, now) < 0
  );
  const hasDeadlineThisWeek = workflowDates.some((date) => {
    const daysUntil = getDaysUntil(date, now);
    return daysUntil >= 0 && daysUntil <= weekLengthInDays;
  });
  const waitingOnClient =
    event.mailingStatus?.toLowerCase().includes("approval") ?? false;
  const mailingDate =
    event.mailingDate === null || event.mailingDate === undefined
      ? null
      : parseEventDate(event.mailingDate);
  const daysUntilMailing =
    mailingDate === null ? null : getDaysUntil(mailingDate, now);
  const advancedMailWarning =
    daysUntilMailing !== null &&
    daysUntilMailing >= 0 &&
    daysUntilMailing <= advancedMailWarningDays &&
    !isMailingComplete(event);
  const recordDate =
    event.recordDate === null || event.recordDate === undefined
      ? null
      : parseEventDate(event.recordDate);
  const daysUntilRecord =
    recordDate === null ? null : getDaysUntil(recordDate, now);
  const isNyseListed = event.exchange?.toUpperCase().includes("NYSE") ?? false;

  if (hasOverdueDeadline) {
    signals.push({ label: "Overdue", severity: "error" });
  } else if (hasDeadlineThisWeek) {
    signals.push({ label: "Due this week", severity: "warning" });
  }

  if (waitingOnClient === true) {
    signals.push({ label: "Waiting on client", severity: "info" });
  }

  if (advancedMailWarning) {
    signals.push({
      label: "Confirm Broadridge notice — fee window approaching",
      severity: "warning",
    });
  }

  if (
    isNyseListed === true &&
    daysUntilRecord !== null &&
    daysUntilRecord >= 0 &&
    daysUntilRecord <= weekLengthInDays
  ) {
    signals.push({
      label: "NYSE record-date notification due",
      severity: "warning",
    });
  }

  if (
    signals.some((signal) => signal.severity === "error") ||
    advancedMailWarning
  ) {
    const riskReasons: string[] = [];
    if (hasOverdueDeadline) {
      riskReasons.push("an overdue workflow date");
    }
    if (advancedMailWarning) {
      riskReasons.push(
        "mailing is incomplete inside the Advanced Mail Date fee window"
      );
    }
    const riskExplanation = `At risk because this meeting has ${riskReasons.join(
      " and "
    )}.`;
    signals.push({
      explanation: riskExplanation,
      label: `At risk — ${riskReasons.join(" and ")}`,
      severity: "error",
    });
  }

  return signals;
};

const getDateSortValue = (date: string | null | undefined): number =>
  date === null || date === undefined
    ? Number.POSITIVE_INFINITY
    : (parseEventDate(date)?.getTime() ?? Number.POSITIVE_INFINITY);

const compareTableEvents = (
  firstEvent: EventRow,
  secondEvent: EventRow,
  options: { now: Date; orderBy: TableOrderBy }
): number => {
  const { now, orderBy } = options;
  if (orderBy === "client") {
    return firstEvent.event.localeCompare(secondEvent.event);
  }
  if (orderBy === "recordDate") {
    return (
      getDateSortValue(firstEvent.recordDate) -
      getDateSortValue(secondEvent.recordDate)
    );
  }
  if (orderBy === "mailingDate") {
    return (
      getDateSortValue(firstEvent.mailingDate) -
      getDateSortValue(secondEvent.mailingDate)
    );
  }

  const firstRisk = getOperationalSignals(firstEvent, now).some((signal) =>
    signal.label.startsWith("At risk")
  );
  const secondRisk = getOperationalSignals(secondEvent, now).some((signal) =>
    signal.label.startsWith("At risk")
  );
  return Number(secondRisk) - Number(firstRisk);
};

interface ClientTimelineGroup {
  brandColor: string;
  clientName: string;
  ticker: string;
  events: EventRow[];
}

type TimelineBrandStyles = Record<string, Record<string, string | number>>;

const buildTimelineModel = (clientGroups: ClientTimelineGroup[]) => {
  const timelineEvents: SchedulerEvent[] = [];
  const resources: SchedulerResource[] = [];
  const brandStyles: TimelineBrandStyles = {};
  const eventsByClassName = new Map<string, EventRow>();

  for (const clientGroup of clientGroups) {
    const clientResourceId = `client-${clientGroup.ticker}`;
    const clientClassName = `client-event-${clientGroup.ticker
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")}`;
    const eventResources: SchedulerResource[] = [];
    const contrastText =
      getContrastRatio(clientGroup.brandColor, "#fff") >= 4.5 ? "#fff" : "#111";

    brandStyles[`& .${clientClassName}`] = {
      "--event-main": clientGroup.brandColor,
      "--event-on-surface-selected": contrastText,
      "--event-on-surface-subtle-primary": contrastText,
      "--event-surface-accent": clientGroup.brandColor,
      "--event-surface-selected": clientGroup.brandColor,
      "--event-surface-selected-hover": clientGroup.brandColor,
      "--event-surface-subtle": clientGroup.brandColor,
      "--event-surface-subtle-hover": clientGroup.brandColor,
    };
    brandStyles[
      `& [id$="-EventTimelinePremiumTitleCell-${clientResourceId}"] .MuiEventTimeline-titleCellLegendColor`
    ] = {
      backgroundColor: clientGroup.brandColor,
    };

    for (const event of clientGroup.events) {
      const start = getEventStartDate(event);
      const meetingDate = parseEventDate(event.eventDate);
      if (start === null || meetingDate === null) {
        continue;
      }

      const eventResourceId = `event-${event.id}`;
      const timelineEventClassName = getTimelineEventClassName(event.id);
      eventsByClassName.set(timelineEventClassName, event);
      eventResources.push({
        id: eventResourceId,
        title: formatEventTitle(event),
        eventColor: "grey",
        areEventsReadOnly: true,
      });
      brandStyles[
        `& [id$="-EventTimelinePremiumTitleCell-${eventResourceId}"] .MuiEventTimeline-titleCellLegendColor`
      ] = {
        backgroundColor: clientGroup.brandColor,
      };
      timelineEvents.push({
        id: event.id,
        title: event.clientTicker,
        start: start.toISOString(),
        end: new Date(
          meetingDate.getTime() + oneDayInMilliseconds
        ).toISOString(),
        resource: eventResourceId,
        className: `${clientClassName} ${timelineEventClassName}`,
        color: "grey",
        readOnly: true,
      });
    }

    if (eventResources.length > 0) {
      resources.push({
        id: clientResourceId,
        title: `${clientGroup.clientName} (${clientGroup.ticker})`,
        children: eventResources,
        eventColor: "grey",
        areEventsReadOnly: true,
      });
    }
  }

  return { brandStyles, eventsByClassName, timelineEvents, resources };
};

interface EventActionsPopoverProps {
  readonly anchor: HTMLElement;
  readonly event: EventRow;
  readonly onClose: () => void;
}

const EventActionsPopover = ({
  anchor,
  event,
  onClose,
}: EventActionsPopoverProps) => (
  <Popover
    open
    anchorEl={anchor}
    onClose={onClose}
    anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
    transformOrigin={{ horizontal: "center", vertical: "top" }}
    slotProps={{
      paper: {
        sx: {
          mt: 0.75,
          p: 1.5,
          width: 280,
        },
      },
    }}
  >
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="subtitle2">{event.event}</Typography>
        <Typography variant="caption" color="text.secondary">
          {formatEventTitle(event)}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button
          component={NextLink}
          href={`/edit/${event.id}`}
          onClick={onClose}
          size="small"
          startIcon={<EditOutlined />}
          variant="outlined"
        >
          Edit event
        </Button>
        <Button
          component={NextLink}
          href={`${getMeetingUrl(event)}/dashboard`}
          onClick={onClose}
          size="small"
          startIcon={<DashboardOutlined />}
          variant="contained"
        >
          Dashboard
        </Button>
      </Stack>
    </Stack>
  </Popover>
);

interface EventsTimelineContentProps {
  readonly brandStyles: TimelineBrandStyles;
  readonly defaultVisibleDate: Date;
  readonly emptyMessage: string;
  readonly error: string | null;
  readonly loading: boolean;
  readonly onTimelineClick: (event: MouseEvent<HTMLDivElement>) => void;
  readonly resources: SchedulerResource[];
  readonly timelineEvents: SchedulerEvent[];
  readonly timelineHeight: number;
}

const EventsTimelineContent = ({
  brandStyles,
  defaultVisibleDate,
  emptyMessage,
  error,
  loading,
  onTimelineClick,
  resources,
  timelineEvents,
  timelineHeight,
}: EventsTimelineContentProps) => (
  <CardContent sx={{ pt: 0 }}>
    {error !== null && <Alert severity="error">{error}</Alert>}
    {loading ? (
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          height: minimumTimelineHeight,
          justifyContent: "center",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    ) : timelineEvents.length === 0 ? (
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          height: minimumTimelineHeight,
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    ) : (
      <Box sx={{ height: timelineHeight, minWidth: 0 }}>
        <EventTimelinePremium
          readOnly
          events={timelineEvents}
          onClickCapture={onTimelineClick}
          resources={resources}
          defaultPreset="monthAndYear"
          defaultVisibleDate={defaultVisibleDate}
          resourceColumnLabel="Clients and events"
          showCurrentTimeIndicator={false}
          sx={{
            ...brandStyles,

            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            fontSize: "0.75rem",
            "& .MuiEventTimeline-event": {
              height: 24,
              minHeight: 24,
              px: 0.75,
              py: 0.25,
            },
            "& .MuiEventTimeline-headerCellLabel": {
              fontSize: "0.6875rem",
            },
            "& .MuiEventTimeline-titleCell": {
              fontSize: "0.75rem",
            },
            "& .MuiEventTimeline-titleHeaderCell": {
              fontSize: "0.75rem",
            },
          }}
        />
      </Box>
    )}
  </CardContent>
);

interface EventsTableContentProps {
  readonly emptyMessage: string;
  readonly error: string | null;
  readonly events: EventRow[];
  readonly loading: boolean;
}

const EventsTableContent = ({
  emptyMessage,
  error,
  events,
  loading,
}: EventsTableContentProps) => {
  const now = new Date();
  const [order, setOrder] = useState<TableOrder>("asc");
  const [orderBy, setOrderBy] = useState<TableOrderBy>("recordDate");
  const sortedEvents = Array.from(events).sort((firstEvent, secondEvent) => {
    const comparison = compareTableEvents(firstEvent, secondEvent, {
      now,
      orderBy,
    });
    return order === "asc" ? comparison : -comparison;
  });
  const handleSort = (nextOrderBy: TableOrderBy) => {
    if (nextOrderBy === orderBy) {
      setOrder((currentOrder) => (currentOrder === "asc" ? "desc" : "asc"));
      return;
    }
    setOrderBy(nextOrderBy);
    setOrder("asc");
  };
  const renderSortLabel = (label: string, column: TableOrderBy) => (
    <TableSortLabel
      active={orderBy === column}
      direction={orderBy === column ? order : "asc"}
      onClick={() => {
        handleSort(column);
      }}
    >
      {label}
    </TableSortLabel>
  );

  return (
    <CardContent sx={{ pt: 0 }}>
      {error !== null && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            minHeight: minimumTimelineHeight,
            justifyContent: "center",
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : events.length === 0 ? (
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            minHeight: minimumTimelineHeight,
            justifyContent: "center",
          }}
        >
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      ) : (
        <TableContainer
          sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}
        >
          <Table aria-label="Portfolio event deadlines" size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  {renderSortLabel("Client and event", "client")}
                </TableCell>
                <TableCell>
                  {renderSortLabel("Record date", "recordDate")}
                </TableCell>
                <TableCell>
                  {renderSortLabel("Mail date", "mailingDate")}
                </TableCell>
                <TableCell>
                  {renderSortLabel("Portfolio attention", "risk")}
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEvents.map((event) => {
                const signals = getOperationalSignals(event, now);

                return (
                  <TableRow hover key={event.id}>
                    <TableCell>
                      <Typography
                        color="primary"
                        component={NextLink}
                        href={`${getMeetingUrl(event)}/dashboard`}
                        sx={{
                          fontWeight: 600,
                          textDecoration: "none",
                          "&:hover": { textDecoration: "underline" },
                        }}
                        variant="body2"
                      >
                        {event.event} ({event.clientTicker})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatEventTitle(event)}
                      </Typography>
                    </TableCell>
                    <TableCell>{event.recordDate ?? "Not set"}</TableCell>
                    <TableCell>{event.mailingDate ?? "Not set"}</TableCell>
                    <TableCell>
                      {signals.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          On track
                        </Typography>
                      ) : (
                        <Stack
                          direction="row"
                          flexWrap="wrap"
                          gap={0.75}
                          useFlexGap
                        >
                          {signals.map((signal) => (
                            <Tooltip
                              arrow
                              key={signal.label}
                              title={signal.explanation ?? signal.label}
                            >
                              <Chip
                                color={signal.severity}
                                label={signal.label}
                                size="small"
                                variant={
                                  signal.label.startsWith("At risk")
                                    ? "filled"
                                    : "outlined"
                                }
                              />
                            </Tooltip>
                          ))}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit event">
                        <IconButton
                          aria-label={`Edit ${event.event} ${event.eventType}`}
                          component={NextLink}
                          href={`/edit/${event.id}`}
                        >
                          <EditOutlined />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CardContent>
  );
};

const EventsPage = () => {
  const { data: session } = useSession();
  const { events, loading, error, revalidate } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllClients, setShowAllClients] = useState(false);
  const [eventsView, setEventsView] = useState<EventsView>("table");
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [eventPopoverAnchor, setEventPopoverAnchor] =
    useState<HTMLElement | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const userType = session?.user.type ?? "PARENT_CLIENT";
  const isCSM = userType === "CSM";
  const tickers = session?.user.clientTickers;
  const assignedTickers =
    isCSM && tickers !== undefined && tickers.length > 0
      ? new Set(tickers.map((ticker) => ticker.toUpperCase()))
      : null;

  const isSearching = searchQuery.trim().length > 0;
  const isFiltered =
    isCSM && assignedTickers !== null && !showAllClients && !isSearching;

  let filteredEvents = events.filter(
    (event) => event.meetingStatus === "ACTIVE"
  );

  if (assignedTickers !== null && !showAllClients && !isSearching) {
    filteredEvents = filteredEvents.filter((event) =>
      assignedTickers.has(event.clientTicker.toUpperCase())
    );
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (normalizedQuery !== "") {
    filteredEvents = filteredEvents.filter((event) => {
      const searchableValues: string[] = [
        event.event,
        event.clientTicker,
        event.eventType,
        event.cusip,
        event.eventDate,
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      );
    });
  }

  const groupedEvents = new Map<string, ClientTimelineGroup>();

  for (const event of filteredEvents) {
    const ticker = event.clientTicker.toUpperCase();
    const existingGroup = groupedEvents.get(ticker);

    if (existingGroup === undefined) {
      groupedEvents.set(ticker, {
        brandColor:
          getBrandConfigByTicker(ticker)?.primaryColor ?? fallbackBrandColor,
        clientName: event.event,
        ticker,
        events: [event],
      });
      continue;
    }

    existingGroup.events.push(event);
  }

  const clientGroups = [...groupedEvents.values()]
    .map((group) => ({
      ...group,
      events: group.events.sort(
        (firstEvent, secondEvent) =>
          (parseEventDate(firstEvent.eventDate)?.getTime() ?? 0) -
          (parseEventDate(secondEvent.eventDate)?.getTime() ?? 0)
      ),
    }))
    .sort((firstGroup, secondGroup) =>
      firstGroup.clientName.localeCompare(secondGroup.clientName)
    );

  const { brandStyles, eventsByClassName, timelineEvents, resources } =
    buildTimelineModel(clientGroups);
  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const firstEvent = timelineEvents.at(0);
  const defaultVisibleDate =
    firstEvent === undefined ? new Date() : new Date(firstEvent.start);
  const totalRows = clientGroups.length + timelineEvents.length;
  const timelineHeight = Math.min(
    maximumTimelineHeight,
    Math.max(
      minimumTimelineHeight,
      timelineHeaderHeight + totalRows * timelineRowHeight
    )
  );

  const handleTimelineClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const eventElement = event.target.closest<HTMLElement>(
      ".MuiEventTimeline-event"
    );
    if (eventElement === null) {
      return;
    }

    const eventClassName = [...eventElement.classList].find((className) =>
      className.startsWith("timeline-event-")
    );
    if (eventClassName === undefined) {
      return;
    }

    const timelineEvent = eventsByClassName.get(eventClassName);
    if (timelineEvent === undefined) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setSelectedEventId(timelineEvent.id);
    setEventPopoverAnchor(eventElement);
  };

  const handleEventPopoverClose = () => {
    setEventPopoverAnchor(null);
    setSelectedEventId(null);
  };

  const emptyMessage =
    searchQuery.trim() !== ""
      ? "No events match your search."
      : isFiltered
        ? "No upcoming events for your assigned clients."
        : "No upcoming events found.";

  return (
    <Container
      maxWidth="xl"
      data-testid="events-page"
      sx={{ p: { xs: 2, sm: 3 } }}
    >
      <Card>
        <CardHeader
          title={
            eventsView === "timeline" ? "Events timeline" : "Event deadlines"
          }
          subheader={`${clientGroups.length} clients · ${timelineEvents.length} upcoming events`}
          action={
            <Stack direction="row" alignItems="center" spacing={1}>
              <ToggleButtonGroup
                aria-label="Events view"
                exclusive
                onChange={(changeEvent, nextView: EventsView | null) => {
                  changeEvent.preventDefault();
                  if (nextView !== null) {
                    setEventsView(nextView);
                  }
                }}
                size="small"
                value={eventsView}
              >
                <ToggleButton aria-label="Table view" value="table">
                  <TableRowsOutlined fontSize="small" />
                </ToggleButton>
                <ToggleButton aria-label="Timeline view" value="timeline">
                  <ViewTimelineOutlined fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
              {isCSM && assignedTickers !== null ? (
                <Tooltip
                  title={
                    isFiltered
                      ? `Showing your ${assignedTickers.size} assigned client${assignedTickers.size === 1 ? "" : "s"}. Search or click to see all.`
                      : isSearching
                        ? "Searching all clients"
                        : "Showing all clients"
                  }
                >
                  <Chip
                    label={
                      isFiltered
                        ? `My clients (${assignedTickers.size})`
                        : "All clients"
                    }
                    size="small"
                    color={isFiltered ? "primary" : "default"}
                    variant={isFiltered ? "filled" : "outlined"}
                    onClick={() => {
                      setShowAllClients((value) => !value);
                    }}
                    onDelete={
                      isFiltered
                        ? () => {
                            setShowAllClients(true);
                          }
                        : undefined
                    }
                    sx={{ cursor: "pointer" }}
                  />
                </Tooltip>
              ) : null}
              <TextField
                size="small"
                placeholder={
                  isCSM && assignedTickers !== null
                    ? "Search all clients…"
                    : "Search"
                }
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ minWidth: 220 }}
              />
              {isCSM ? (
                <IconButton
                  aria-label="Add client"
                  onClick={() => {
                    setNewClientOpen(true);
                  }}
                >
                  <Add />
                </IconButton>
              ) : null}
            </Stack>
          }
        />
        {eventsView === "timeline" ? (
          <EventsTimelineContent
            brandStyles={brandStyles}
            defaultVisibleDate={defaultVisibleDate}
            emptyMessage={emptyMessage}
            error={error}
            loading={loading}
            onTimelineClick={handleTimelineClick}
            resources={resources}
            timelineEvents={timelineEvents}
            timelineHeight={timelineHeight}
          />
        ) : (
          <EventsTableContent
            emptyMessage={emptyMessage}
            error={error}
            events={filteredEvents}
            loading={loading}
          />
        )}
      </Card>

      {eventPopoverAnchor !== null && selectedEvent !== undefined ? (
        <EventActionsPopover
          anchor={eventPopoverAnchor}
          event={selectedEvent}
          onClose={handleEventPopoverClose}
        />
      ) : null}

      <NewClientDrawer
        open={newClientOpen}
        onClose={() => {
          setNewClientOpen(false);
        }}
        onCreated={() => {
          void revalidate();
          setNewClientOpen(false);
        }}
      />
    </Container>
  );
};

export default EventsPage;
