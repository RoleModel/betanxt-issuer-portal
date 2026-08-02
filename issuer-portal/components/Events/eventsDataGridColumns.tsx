"use client";

import type {
  GridColDef,
  GridFilterOperator,
  GridRenderCellParams,
} from "@mui/x-data-grid-pro";

import { Typography } from "@mui/material";
import { getGridStringOperators } from "@mui/x-data-grid-pro";

import type { EventRow } from "@/utils/eventData";

import {
  EventActionsCell,
  EventPrimaryCell,
  EventStatusCell,
} from "./EventDataGridCells";
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

/** Shared config for the three date columns, which differ only in their source. */
const dateColumn = (
  field: string,
  headerName: string,
  getDate: (row: EventRow) => string | null | undefined
): GridColDef<EventRow> => ({
  field,
  headerName,
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
}

export const createEventsDataGridColumns = ({
  assignedTickers,
  atRiskMeetingIds,
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
    field: "setKey",
    flex: 1,
    headerName: "Set Key",
    minWidth: 220,
    renderCell: (parameters: GridRenderCellParams<EventRow, string>) => (
      <Typography noWrap variant="body3">
        {parameters.row.setKey}
      </Typography>
    ),
    valueGetter: (value, row) => {
      void value;
      return row.setKey;
    },
  },
  dateColumn("eventDate", "Event date", (row) => row.eventDate),
  dateColumn("recordDate", "Record date", (row) => row.recordDate),
  dateColumn("mailingDate", "Mail date", (row) => row.mailingDate),
  {
    field: "riskStatus",
    headerName: "Status",
    minWidth: 150,
    renderCell: (parameters: GridRenderCellParams<EventRow, string>) => (
      <EventStatusCell value={parameters.value} />
    ),
    type: "singleSelect",
    valueGetter: (value, row) => {
      void value;
      return getEventRiskLabel(row, atRiskMeetingIds);
    },
    valueOptions: [ON_SCHEDULE_LABEL, AT_RISK_LABEL],
  },
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
