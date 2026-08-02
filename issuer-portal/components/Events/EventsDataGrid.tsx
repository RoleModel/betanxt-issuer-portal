"use client";

import { Box } from "@mui/material";
import { DataGridPro } from "@mui/x-data-grid-pro";
import { useSyncExternalStore } from "react";

import type { EventRow } from "@/utils/eventData";

import { SavedFilterPanel } from "@/components/ui/SavedFilterPanel";
import { SavedFilterToolbar } from "@/components/ui/SavedFilterToolbar";
import { useEventRisk } from "@/hooks/useEventRisk";

import { createEventsDataGridColumns } from "./eventsDataGridColumns";
import { useEventsFilterModel } from "./useEventsFilterModel";

// The grid renders only on the client; this defers it until after hydration
// rather than rendering a server pass the grid would immediately discard.
const subscribeToClientRender = (): (() => void) => () => {};
const getClientRenderSnapshot = (): boolean => true;
const getServerRenderSnapshot = (): boolean => false;

interface EventsDataGridProps {
  readonly assignedTickers: ReadonlySet<string> | null;
  readonly assignedTickersKey: string;
  readonly emptyMessage: string;
  readonly events: EventRow[];
  readonly loading: boolean;
}

export const EventsDataGrid = ({
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

  const columns = createEventsDataGridColumns({
    assignedTickers,
    atRiskMeetingIds,
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
    <DataGridPro
      autoHeight
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
        },
        toolbar: {
          activeFilterId,
          onApply: handleApplySavedFilter,
          onClear: clearFilters,
          onDelete: handleDeleteSavedFilter,
          onRemoveFilter: handleRemoveFilterItem,
          savedFilters,
        },
      }}
      slots={{
        filterPanel: SavedFilterPanel,
        toolbar: SavedFilterToolbar,
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
  );
};

export default EventsDataGrid;
