"use client";

import { useCallback, useEffect, useState } from "react";
import type { GridFilterModel } from "@mui/x-data-grid";

/** A named group of filters a user chose to keep. */
export interface SavedFilter {
  id: string;
  name: string;
  filterModel: GridFilterModel;
  createdAt: string;
}

interface UseSavedFiltersResult {
  savedFilters: SavedFilter[];
  saveFilter: (name: string, filterModel: GridFilterModel) => void;
  removeFilter: (id: string) => void;
  renameFilter: (id: string, name: string) => void;
}

const STORAGE_PREFIX = "betanxt-saved-filters";

const storageKey = (gridId: string): string => `${STORAGE_PREFIX}:${gridId}`;

const isFilterModel = (value: unknown): value is GridFilterModel =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as { items?: unknown }).items);

const parseSaved = (raw: string | null): SavedFilter[] => {
  if (raw === null) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((entry): SavedFilter[] => {
      if (typeof entry !== "object" || entry === null) {
        return [];
      }
      const candidate = entry as Record<string, unknown>;
      const { id, name, filterModel, createdAt } = candidate;
      if (
        typeof id !== "string" ||
        typeof name !== "string" ||
        !isFilterModel(filterModel)
      ) {
        return [];
      }
      return [
        {
          createdAt: typeof createdAt === "string" ? createdAt : "",
          filterModel,
          id,
          name,
        },
      ];
    });
  } catch {
    // A corrupt entry should cost the user their saved filters, not the page.
    return [];
  }
};

/**
 * Named filter groups for a data grid, persisted per grid in localStorage.
 *
 * There is no API for saved filters, so these live in the browser: they are
 * per-device and do not follow a user between machines. Swapping the storage
 * calls for a fetch is the only change needed if that becomes a requirement.
 *
 * Reading happens in an effect rather than during render so server and client
 * markup match — localStorage does not exist during SSR.
 *
 * @param gridId - Stable identifier scoping the entries to one grid
 * @returns The saved filters and operations to modify them
 */
export const useSavedFilters = (gridId: string): UseSavedFiltersResult => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  useEffect(() => {
    setSavedFilters(
      parseSaved(window.localStorage.getItem(storageKey(gridId)))
    );
  }, [gridId]);

  const saveFilter = useCallback(
    (name: string, filterModel: GridFilterModel) => {
      const trimmed = name.trim();
      if (trimmed.length === 0) {
        return;
      }
      setSavedFilters((current) => {
        // Saving under an existing name replaces it rather than duplicating.
        const withoutMatch = current.filter(
          (entry) => entry.name.toLowerCase() !== trimmed.toLowerCase()
        );
        const next = [
          ...withoutMatch,
          {
            createdAt: new Date().toISOString(),
            filterModel,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: trimmed,
          },
        ];
        window.localStorage.setItem(storageKey(gridId), JSON.stringify(next));
        return next;
      });
    },
    [gridId]
  );

  const removeFilter = useCallback(
    (id: string) => {
      setSavedFilters((current) => {
        const next = current.filter((entry) => entry.id !== id);
        window.localStorage.setItem(storageKey(gridId), JSON.stringify(next));
        return next;
      });
    },
    [gridId]
  );

  const renameFilter = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (trimmed.length === 0) {
        return;
      }
      setSavedFilters((current) => {
        const next = current.map((entry) =>
          entry.id === id ? { ...entry, name: trimmed } : entry
        );
        window.localStorage.setItem(storageKey(gridId), JSON.stringify(next));
        return next;
      });
    },
    [gridId]
  );

  return { removeFilter, renameFilter, saveFilter, savedFilters };
};
