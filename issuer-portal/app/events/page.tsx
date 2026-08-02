/* eslint-disable react-doctor/js-tosorted-immutable */
"use client";

import type {
  GridColDef,
  GridFilterItem,
  GridFilterModel,
  GridFilterOperator,
  GridRenderCellParams,
} from "@mui/x-data-grid-pro";

import { Add, DashboardOutlined, EditOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { DataGridPro, getGridStringOperators } from "@mui/x-data-grid-pro";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";

import type { SavedFilter } from "@/hooks/useSavedFilters";
import type { EventRow } from "@/utils/eventData";

import { NewClientDrawer } from "@/components/Clients/NewClientDrawer";
import { CustomTooltip } from "@/components/ui/CustomToolTip";
import { SavedFilterPanel } from "@/components/ui/SavedFilterPanel";
import { SavedFilterToolbar } from "@/components/ui/SavedFilterToolbar";
import { useEventRisk } from "@/hooks/useEventRisk";
import { useEvents } from "@/hooks/useEvents";
import { useSavedFilters } from "@/hooks/useSavedFilters";
import { getMeetingUrl } from "@/utils/eventData";

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

const AT_RISK_LABEL = "At Risk";
const ON_SCHEDULE_LABEL = "On Schedule";

/**
 * An event is at risk when it still has an overdue, unfinished task. Completed
 * events are always on schedule — there is nothing left to fall behind on.
 */
const getEventRiskLabel = (
  event: EventRow,
  atRiskMeetingIds: ReadonlySet<string>
): string =>
  event.meetingStatus === "ACTIVE" && atRiskMeetingIds.has(event.meetingId)
    ? AT_RISK_LABEL
    : ON_SCHEDULE_LABEL;

const subscribeToClientRender = (): (() => void) => () => {};
const getClientRenderSnapshot = (): boolean => true;
const getServerRenderSnapshot = (): boolean => false;

const myClientsOnlyFilterOperator = (
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

interface EventsDataGridProps {
  readonly assignedTickers: ReadonlySet<string> | null;
  readonly assignedTickersKey: string;
  readonly events: EventRow[];
  readonly loading: boolean;
  readonly emptyMessage: string;
}

const EventsDataGrid = ({
  assignedTickers,
  assignedTickersKey,
  emptyMessage,
  events,
  loading,
}: EventsDataGridProps) => {
  const isGridReady = useSyncExternalStore(
    subscribeToClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot
  );
  const { atRiskMeetingIds } = useEventRisk();
  const initialFilterModel: GridFilterModel =
    assignedTickers === null || assignedTickers.size === 0
      ? { items: [] }
      : {
          items: [
            {
              field: "client",
              id: "my-clients-only",
              operator: "myClientsOnly",
            },
          ],
        };

  // The filter model is controlled so a saved-filter chip can apply one.
  // `initialFilterModel` seeds it, and the grid key already remounts when the
  // user's assigned tickers change, so this stays in step with that reset.
  const [filterModel, setFilterModel] =
    useState<GridFilterModel>(initialFilterModel);
  const filterModelRef = useRef<GridFilterModel>(initialFilterModel);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const { savedFilters, saveFilter, removeFilter } =
    useSavedFilters("events-index");
  const hasQuickSearch =
    filterModel.quickFilterValues?.some((value) => value.trim().length > 0) ??
    false;
  const hasColumnSearch = filterModel.items.some((item) => {
    if (typeof item.value === "string") {
      return item.value.trim().length > 0;
    }

    return item.value !== undefined && item.value !== null;
  });
  const rows =
    hasQuickSearch || hasColumnSearch
      ? events
      : events.filter((event) => event.meetingStatus === "ACTIVE");

  const updateFilterModel = (next: GridFilterModel) => {
    filterModelRef.current = next;
    setFilterModel(next);
  };

  const handleFilterModelChange = (next: GridFilterModel) => {
    updateFilterModel(next);
    // Editing filters by hand means the result is no longer the saved group.
    setActiveFilterId(null);
  };

  const handleAddFilter = () => {
    const { current } = filterModelRef;
    updateFilterModel({
      ...current,
      items: [
        ...current.items,
        {
          field: "client",
          id: crypto.randomUUID(),
          operator: "contains",
        },
      ],
    });
  };

  const columns: GridColDef<EventRow>[] = [
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
      renderCell: (parameters: GridRenderCellParams<EventRow, string>) => {
        const event = parameters.row;

        return (
          <Stack direction="column" minWidth={0}>
            <Typography
              noWrap
              variant="body3"
              component={Link}
              color="primary"
              href={`${getMeetingUrl(event)}/dashboard`}
            >
              {event.event}
            </Typography>
            <Typography color="text.secondary" noWrap variant="body3">
              {event.eventType}
            </Typography>
          </Stack>
        );
      },
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
      renderCell: (parameters: GridRenderCellParams<EventRow, string>) => {
        const event = parameters.row;

        return (
          <Typography noWrap variant="body3">
            {event.setKey}
          </Typography>
        );
      },
      valueGetter: (value, row) => {
        void value;
        return row.setKey;
      },
    },
    {
      field: "eventDate",
      headerName: "Event date",
      minWidth: 140,
      type: "date",
      valueFormatter: (value: Date | null) =>
        value === null ? "Not set" : value.toLocaleDateString("en-US"),
      valueGetter: (value, row) => {
        void value;
        return parseEventDate(row.eventDate);
      },
    },

    {
      field: "recordDate",
      headerName: "Record date",
      minWidth: 140,
      type: "date",
      valueFormatter: (value: Date | null) =>
        value === null ? "Not set" : value.toLocaleDateString("en-US"),
      valueGetter: (value, row) => {
        void value;
        return row.recordDate === null || row.recordDate === undefined
          ? null
          : parseEventDate(row.recordDate);
      },
    },
    {
      field: "mailingDate",
      headerName: "Mail date",
      minWidth: 140,
      type: "date",
      valueFormatter: (value: Date | null) =>
        value === null ? "Not set" : value.toLocaleDateString("en-US"),
      valueGetter: (value, row) => {
        void value;
        return row.mailingDate === null || row.mailingDate === undefined
          ? null
          : parseEventDate(row.mailingDate);
      },
    },
    {
      field: "riskStatus",
      headerName: "Status",
      minWidth: 150,
      type: "singleSelect",
      valueOptions: [ON_SCHEDULE_LABEL, AT_RISK_LABEL],
      valueGetter: (value, row) => {
        void value;
        return getEventRiskLabel(row, atRiskMeetingIds);
      },
      renderCell: (parameters: GridRenderCellParams<EventRow, string>) => (
        <Chip
          color={parameters.value === AT_RISK_LABEL ? "error" : "success"}
          label={parameters.value}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      align: "right",
      field: "actions",
      filterable: false,
      headerAlign: "right",
      headerName: "Actions",
      minWidth: 100,
      renderCell: (parameters: GridRenderCellParams<EventRow>) => {
        const event = parameters.row;

        return (
          <Stack direction="row" spacing={0.25}>
            <CustomTooltip title="Open dashboard">
              <IconButton
                aria-label={`Open dashboard for ${event.event} ${event.eventType}`}
                component={Link}
                href={`${getMeetingUrl(event)}/dashboard`}
                size="small"
              >
                <DashboardOutlined fontSize="small" />
              </IconButton>
            </CustomTooltip>
            <CustomTooltip title="Edit event">
              <IconButton
                aria-label={`Edit ${event.event} ${event.eventType}`}
                component={Link}
                href={`/edit/${event.id}`}
                size="small"
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </CustomTooltip>
          </Stack>
        );
      },
      sortable: false,
      width: 120,
    },
  ];

  if (!isGridReady) {
    return <Box aria-busy="true" sx={{ height: "100%" }} />;
  }

  return (
    <DataGridPro
      columns={columns}
      filterDebounceMs={0}
      filterModel={filterModel}
      autoHeight
      onFilterModelChange={handleFilterModelChange}
      slotProps={{
        filterPanel: {
          onAddFilter: handleAddFilter,
          onClearFilters: () => {
            updateFilterModel({ items: [] });
            setActiveFilterId(null);
          },
          onSaveFilters: (name: string) => {
            saveFilter(name, filterModel);
          },
        },
        toolbar: {
          activeFilterId,
          onApply: (filter: SavedFilter) => {
            updateFilterModel(filter.filterModel);
            setActiveFilterId(filter.id);
          },
          onClear: () => {
            updateFilterModel({ items: [] });
            setActiveFilterId(null);
          },
          onDelete: (id: string) => {
            removeFilter(id);
            setActiveFilterId((current) => (current === id ? null : current));
          },
          onRemoveFilter: (filterId: GridFilterItem["id"]) => {
            updateFilterModel({
              ...filterModelRef.current,
              items: filterModelRef.current.items.filter(
                (item) => item.id !== filterId
              ),
            });
            setActiveFilterId(null);
          },
          savedFilters,
        },
      }}
      slots={{
        filterPanel: SavedFilterPanel,
        toolbar: SavedFilterToolbar,
      }}
      initialState={{
        pagination: {
          paginationModel: {
            page: 0,
            pageSize: 25,
          },
        },
        sorting: {
          sortModel: [{ field: "recordDate", sort: "asc" }],
        },
      }}
      key={`events-grid-${assignedTickersKey}`}
      loading={loading}
      localeText={{ noRowsLabel: emptyMessage }}
      pagination
      pageSizeOptions={[10, 25, 50]}
      rows={rows}
      disableRowSelectionOnClick
      rowHeight={56}
      showToolbar
      sx={{
        "& .MuiDataGrid-scrollShadow--vertical": {
          backgroundColor: "transparent",
        },
        "& .MuiDataGrid-cell": {
          alignItems: "center",
          display: "flex",
          py: 0,
        },
        "& .MuiDataGrid-cellContent": {
          alignItems: "center",
          display: "flex",
          height: "100%",
          minWidth: 0,
          width: "100%",
        },
      }}
    />
  );
};

const EventsPage = () => {
  const { data: session } = useSession();
  const { events, loading, error, revalidate } = useEvents();
  const [newClientOpen, setNewClientOpen] = useState(false);

  const userType = session?.user.type ?? "PARENT_CLIENT";
  const isCSM = userType === "CSM";
  const tickers = session?.user.clientTickers;
  const assignedTickersKey =
    !isCSM || tickers === undefined
      ? "all-clients"
      : [...tickers].sort().join("|");
  const assignedTickers =
    !isCSM || tickers === undefined || tickers.length === 0
      ? null
      : new Set(tickers.map((ticker) => ticker.toUpperCase()));
  const activeEvents = events.filter(
    (event) => event.meetingStatus === "ACTIVE"
  );

  const clientCount = new Set(activeEvents.map((event) => event.clientTicker))
    .size;
  const emptyMessage = "No upcoming events found.";

  return (
    <Container
      maxWidth="xl"
      data-testid="events-page"
      sx={{ p: { xs: 2, sm: 3 } }}
    >
      <Card>
        <CardHeader
          title="Events"
          subheader={`${clientCount} clients · ${activeEvents.length} upcoming events`}
          action={
            isCSM ? (
              <IconButton
                aria-label="Add client"
                onClick={() => {
                  setNewClientOpen(true);
                }}
              >
                <Add />
              </IconButton>
            ) : undefined
          }
        />
        <CardContent sx={{ pt: 0 }}>
          {error !== null && <Alert severity="error">{error}</Alert>}
          <Box sx={{ display: "flex", maxHeight: 1280, width: "100%" }}>
            <EventsDataGrid
              assignedTickers={assignedTickers}
              assignedTickersKey={assignedTickersKey}
              emptyMessage={emptyMessage}
              events={events}
              loading={loading}
            />
          </Box>
        </CardContent>
      </Card>

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
