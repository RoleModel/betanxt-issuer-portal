"use client";

import type {
  GridColDef,
  GridFilterOperator,
  GridRenderCellParams,
} from "@mui/x-data-grid-pro";

import { Typography } from "@mui/material";
import { getGridStringOperators } from "@mui/x-data-grid-pro";

import type { EventRow } from "@/utils/eventData";

import GlossaryText from "@/components/ui/GlossaryText";

import {
  EventActionsCell,
  EventPrimaryCell,
  EventStatusCell,
} from "./EventDataGridCells";
import { eventDateRangeOperator } from "./EventDateRangeFilter";
import {
  AT_RISK_LABEL,
  ON_SCHEDULE_LABEL,
  getEventRiskLabel,
  parseEventDate,
} from "./eventRiskStatus";

/** Restricts the grid to the signed-in CSM's own clients. */
export const myClientsOnlyFilterOperator = (
  assignedTickers: ReadonlySet<string>
): GridFilterOperator<EventRow, string> => ({
  label: "My Clients",
  requiresFilterValue: false,
  value: "myClientsOnly",
  getApplyFilterFn: () => (value, row) => {
    void value;
    return assignedTickers.has(row.clientTicker.toUpperCase());
  },
});

/**
 * Shared config for the three date columns, which differ only in their source.
 *
 * @remarks
 * Filtering is off by default: only Client and Event date are filterable, and
 * the event-date column opts back in with its own range operator.
 */
const dateColumn = (
  field: string,
  headerName: string,
  getDate: (row: EventRow) => string | null | undefined
): GridColDef<EventRow> => ({
  field,
  filterable: false,
  headerName,
  // headerName stays as the plain string the grid needs for its column menu and
  // exports; renderHeader is where the glossary markup goes.
  renderHeader: () => <GlossaryText>{headerName}</GlossaryText>,
  minWidth: 140,
  type: "date",
  valueFormatter: (value: Date | null) =>
    value === null ? "Not set" : value.toLocaleDateString("en-US"),
  valueGetter: (value, row) => {
    void value;
    const raw = getDate(row);
    return raw === null || raw === undefined ? null : parseEventDate(raw);
  },
});

interface EventsDataGridColumnsOptions {
  readonly assignedTickers: ReadonlySet<string> | null;
  readonly atRiskMeetingIds: ReadonlySet<string>;
  /** `event-status` flag — hides the risk-status column while it is off. */
  readonly showEventStatus: boolean;
}

export const createEventsDataGridColumns = ({
  assignedTickers,
  atRiskMeetingIds,
  showEventStatus,
}: EventsDataGridColumnsOptions): GridColDef<EventRow>[] => [
  {
    field: "client",
    filterOperators:
      assignedTickers === null
        ? getGridStringOperators()
        : [
            myClientsOnlyFilterOperator(assignedTickers),
            ...getGridStringOperators(),
          ],
    headerName: "Client",
    minWidth: 320,
    renderCell: (parameters: GridRenderCellParams<EventRow, string>) => (
      <EventPrimaryCell event={parameters.row} />
    ),
    valueGetter: (value, row) => {
      void value;
      return `${row.event} ${row.clientTicker} ${row.eventType}`;
    },
  },
  {
    field: "cusip",
    filterable: false,
    flex: 1,
    headerName: "CUSIP",
    minWidth: 220,
    renderHeader: () => <GlossaryText>CUSIP</GlossaryText>,
    renderCell: (parameters: GridRenderCellParams<EventRow, string>) => (
      <Typography noWrap variant="body3">
        {parameters.row.cusip}
      </Typography>
    ),
    valueGetter: (value, row) => {
      void value;
      return row.cusip;
    },
  },
  {
    ...dateColumn("eventDate", "Event date", (row) => row.eventDate),
    filterOperators: [eventDateRangeOperator],
    filterable: true,
  },
  dateColumn("recordDate", "Record date", (row) => row.recordDate),
  dateColumn("mailingDate", "Mail date", (row) => row.mailingDate),
  ...(showEventStatus
    ? [
        {
          field: "riskStatus",
          filterable: false,
          headerName: "Status",
          minWidth: 150,
          renderCell: (parameters: GridRenderCellParams<EventRow, string>) => (
            <EventStatusCell value={parameters.value} />
          ),
          type: "singleSelect" as const,
          valueGetter: (value: unknown, row: EventRow) => {
            void value;
            return getEventRiskLabel(row, atRiskMeetingIds);
          },
          valueOptions: [ON_SCHEDULE_LABEL, AT_RISK_LABEL],
        } satisfies GridColDef<EventRow>,
      ]
    : []),
  {
    align: "right",
    field: "actions",
    filterable: false,
    headerAlign: "right",
    headerName: "Actions",
    minWidth: 100,
    renderCell: (parameters: GridRenderCellParams<EventRow>) => (
      <EventActionsCell event={parameters.row} />
    ),
    sortable: false,
    width: 120,
  },
];
