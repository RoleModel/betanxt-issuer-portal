"use client";

import { Alert, Box, Snackbar } from "@mui/material";
import { DataGridPro, gridClasses, useGridApiRef } from "@mui/x-data-grid-pro";
import { useCallback, useSyncExternalStore } from "react";

import type { EventRow } from "@/utils/eventData";

import { SavedFilterPanel } from "@/components/ui/SavedFilterPanel";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { useEventRisk } from "@/hooks/useEventRisk";

import { createEventsDataGridColumns } from "./eventsDataGridColumns";
import { EventsGridToolbar } from "./EventsGridToolbar";
import { useEventsFilterModel } from "./useEventsFilterModel";
import { useTabulationRelease } from "./useTabulationRelease";
import { tabulationReleaseState } from "@/utils/eventData";

// The grid renders only on the client; this defers it until after hydration
// rather than rendering a server pass the grid would immediately discard.
const subscribeToClientRender = (): (() => void) => () => {
  /* empty */
};
const getClientRenderSnapshot = (): boolean => true;
const getServerRenderSnapshot = (): boolean => false;

interface EventsDataGridProps {
  readonly assignedTickers: ReadonlySet<string> | null;
  readonly assignedTickersKey: string;
  /** Only a CSM may release tabulation, so only a CSM gets the checkboxes. */
  readonly canReleaseTabulation: boolean;
  readonly emptyMessage: string;
  readonly events: EventRow[];
  readonly loading: boolean;
  /** Patches the cached rows for the ids that persisted. */
  readonly onTabulationReleased: (
    meetingIds: readonly string[],
    released: boolean
  ) => void;
}

export const EventsDataGrid = ({
  assignedTickers,
  assignedTickersKey,
  canReleaseTabulation,
  emptyMessage,
  events,
  loading,
  onTabulationReleased,
}: EventsDataGridProps) => {
  const apiRef = useGridApiRef();
  const isGridReady = useSyncExternalStore(
    subscribeToClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot
  );
  const { atRiskMeetingIds } = useEventRisk();
  const { flags } = useFeatureFlags();
  const {
    activeFilterId,
    clearFilters,
    filterModel,
    handleAddFilter,
    handleApplySavedFilter,
    handleDeleteSavedFilter,
    handleFilterModelChange,
    handleRemoveFilterItem,
    handleSaveFilters,
    savedFilters,
  } = useEventsFilterModel(assignedTickers);

  const {
    clearFeedback,
    feedback,
    pendingMeetingIds,
    progress,
    setTabulationReleased,
  } = useTabulationRelease({ onReleased: onTabulationReleased });

  const runRelease = useCallback(
    (meetingIds: readonly string[], released: boolean) => {
      void setTabulationReleased(meetingIds, released).then(() => {
        // Clearing the selection retires the batch button with it: the rows
        // that were checked have been dealt with, and leaving them checked
        // invites releasing them a second time.
        apiRef.current?.setRowSelectionModel({
          type: "include",
          ids: new Set(),
        });
      });
    },
    [apiRef, setTabulationReleased]
  );

  const handleRowTabulationChange = useCallback(
    (event: EventRow, released: boolean) => {
      runRelease([event.meetingId], released);
    },
    [runRelease]
  );

  const handleBulkRelease = useCallback(
    (meetingIds: readonly string[]) => {
      // A selection can include meetings whose window has not opened. Their
      // own chip refuses the change, so the batch has to as well — otherwise
      // multi-select becomes a way around the rule.
      const now = new Date();
      const releasable = meetingIds.filter((meetingId) => {
        const row = events.find((event) => event.meetingId === meetingId);
        return (
          row !== undefined && tabulationReleaseState(row, now) !== "tooEarly"
        );
      });

      if (releasable.length > 0) {
        runRelease(releasable, true);
      }
    },
    [events, runRelease]
  );

  const columns = createEventsDataGridColumns({
    assignedTickers,
    atRiskMeetingIds,
    canReleaseTabulation,
    onTabulationChange: handleRowTabulationChange,
    pendingTabulationIds: pendingMeetingIds,
    showEventStatus: flags.eventStatus,
  });

  // Without an active search the index shows upcoming events only; searching
  // widens it to every event so past ones remain findable.
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

  if (!isGridReady) {
    return <Box aria-busy="true" sx={{ height: "100%" }} />;
  }

  return (
    // No max height here: the grid runs with `autoHeight`, which grows the root
    // to fit the page's rows and sets the virtual scroller to overflow hidden.
    // Capping the wrapper therefore clips the tail of the page instead of
    // scrolling it — at 25 rows the grid wants ~1456px and the rows past the cap
    // become unreachable. The page scrolls instead.
    <Box sx={{ display: "flex", width: "100%" }}>
      <DataGridPro
        apiRef={apiRef}
        autoHeight
        checkboxSelection={canReleaseTabulation}
        columns={columns}
        disableRowSelectionOnClick
        filterDebounceMs={0}
        filterModel={filterModel}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 25 } },
          sorting: { sortModel: [{ field: "recordDate", sort: "asc" }] },
        }}
        // Remounts when the signed-in user's assigned tickers change, which also
        // resets the filter model seeded from them.
        key={`events-grid-${assignedTickersKey}`}
        loading={loading}
        localeText={{ noRowsLabel: emptyMessage }}
        onFilterModelChange={handleFilterModelChange}
        pageSizeOptions={[10, 25, 50]}
        pagination
        rowHeight={56}
        rows={rows}
        showToolbar
        slotProps={{
          filterPanel: {
            onAddFilter: handleAddFilter,
            onClearFilters: clearFilters,
            onSaveFilters: handleSaveFilters,
            sx: {
              // Event date takes a range and nothing else, so its row drops the
              // operator select entirely and gives the space to the two pickers.
              [`& .${gridClasses.filterForm}:has([data-event-date-range])`]: {
                [`& .${gridClasses.filterFormOperatorInput}`]: {
                  display: "none",
                },
                [`& .${gridClasses.filterFormValueInput}`]: { width: "auto" },
              },
            },
          },
          toolbar: {
            activeFilterId,
            canReleaseTabulation,
            onApply: handleApplySavedFilter,
            onClear: clearFilters,
            onDelete: handleDeleteSavedFilter,
            onReleaseTabulation: handleBulkRelease,
            onRemoveFilter: handleRemoveFilterItem,
            savedFilters,
            tabulationProgress: progress,
          },
        }}
        slots={{
          filterPanel: SavedFilterPanel,
          toolbar: EventsGridToolbar,
        }}
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
      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "top" }}
        autoHideDuration={feedback?.severity === "success" ? 4000 : null}
        onClose={clearFeedback}
        open={feedback !== null}
      >
        <Alert onClose={clearFeedback} severity={feedback?.severity}>
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EventsDataGrid;
