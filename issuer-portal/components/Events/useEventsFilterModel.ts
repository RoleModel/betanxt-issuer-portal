"use client";

import { useRef, useState } from "react";

import type { GridFilterItem, GridFilterModel } from "@mui/x-data-grid-pro";

import type { SavedFilter } from "@/hooks/useSavedFilters";

import { useSavedFilters } from "@/hooks/useSavedFilters";

const buildInitialFilterModel = (
  assignedTickers: ReadonlySet<string> | null
): GridFilterModel =>
  assignedTickers === null || assignedTickers.size === 0
    ? { items: [] }
    : {
        items: [
          { field: "client", id: "my-clients-only", operator: "myClientsOnly" },
        ],
      };

/**
 * Owns the grid's controlled filter model and the saved-filter group bound to
 * it, so the grid component itself stays presentational.
 *
 * The model is controlled so a saved-filter chip can apply one. Any hand edit
 * clears `activeFilterId`, because the result is no longer that saved group.
 * `filterModelRef` mirrors the model so the callbacks below can read the
 * current value without being re-created on every change.
 */
export const useEventsFilterModel = (
  assignedTickers: ReadonlySet<string> | null
) => {
  const initialFilterModel = buildInitialFilterModel(assignedTickers);
  const [filterModel, setFilterModel] =
    useState<GridFilterModel>(initialFilterModel);
  const filterModelReference = useRef<GridFilterModel>(initialFilterModel);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const { savedFilters, saveFilter, removeFilter } =
    useSavedFilters("events-index");

  const updateFilterModel = (next: GridFilterModel) => {
    filterModelReference.current = next;
    setFilterModel(next);
  };

  const clearFilters = () => {
    updateFilterModel({ items: [] });
    setActiveFilterId(null);
  };

  return {
    activeFilterId,
    clearFilters,
    filterModel,

    handleAddFilter: () => {
      const { current } = filterModelReference;
      updateFilterModel({
        ...current,
        items: [
          ...current.items,
          { field: "client", id: crypto.randomUUID(), operator: "contains" },
        ],
      });
    },

    handleApplySavedFilter: (filter: SavedFilter) => {
      updateFilterModel(filter.filterModel);
      setActiveFilterId(filter.id);
    },

    handleDeleteSavedFilter: (id: string) => {
      removeFilter(id);
      setActiveFilterId((current) => (current === id ? null : current));
    },

    handleFilterModelChange: (next: GridFilterModel) => {
      updateFilterModel(next);
      setActiveFilterId(null);
    },

    handleRemoveFilterItem: (filterId: GridFilterItem["id"]) => {
      updateFilterModel({
        ...filterModelReference.current,
        items: filterModelReference.current.items.filter(
          (item) => item.id !== filterId
        ),
      });
      setActiveFilterId(null);
    },

    handleSaveFilters: (name: string) => {
      saveFilter(name, filterModel);
    },

    savedFilters,
  };
};
