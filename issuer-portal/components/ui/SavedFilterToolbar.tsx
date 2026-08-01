"use client";
import CancelIcon from "@mui/icons-material/Cancel";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import { Box, Chip, IconButton, Tooltip } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import {
  ColumnsPanelTrigger,
  ExportCsv,
  ExportPrint,
  FilterPanelTrigger,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  QuickFilterTrigger,
  Toolbar,
  ToolbarButton,
} from "@mui/x-data-grid";
import * as React from "react";

import type { SavedFilter } from "@/hooks/useSavedFilters";

type OwnerState = {
  expanded: boolean;
};

export interface SavedFilterToolbarProps {
  readonly savedFilters: readonly SavedFilter[];
  readonly activeFilterId: string | null;
  readonly onApply: (filter: SavedFilter) => void;
  readonly onClear: () => void;
  readonly onDelete: (id: string) => void;
}

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides extends SavedFilterToolbarProps {}
}

const StyledTextField = styled(TextField)<{
  ownerState: OwnerState;
}>(({ theme, ownerState }) => ({
  gridArea: "1 / 1",
  overflowX: "clip",
  width: ownerState.expanded ? 260 : "var(--trigger-width)",
  opacity: ownerState.expanded ? 1 : 0,
  transition: theme.transitions.create(["width", "opacity"]),
}));

/**
 * The standard grid toolbar controls, plus saved filter groups as chips.
 *
 * Follows the MUI custom-toolbar recipe, including the search that slides open
 * from its trigger rather than occupying the bar permanently. Groups are
 * created in the filter panel, where the filters are actually built; this only
 * applies and removes them.
 *
 * Clicking a chip applies that group, and clicking the active chip clears it,
 * so a saved filter reads as a toggle rather than a one-way trip.
 */
export function SavedFilterToolbar({
  savedFilters,
  activeFilterId,
  onApply,
  onClear,
  onDelete,
}: SavedFilterToolbarProps) {
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const exportMenuTriggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Toolbar>
      <Tooltip title="Filters">
        <FilterPanelTrigger render={<ToolbarButton />}>
          <FilterListIcon fontSize="small" />
        </FilterPanelTrigger>
      </Tooltip>

      {savedFilters.length > 0 ? (
        <Box
          aria-label="Saved filters"
          component="ul"
          sx={{
            display: "flex",
            gap: 0.75,
            listStyle: "none",
            m: 0,
            minWidth: 0,
            overflowX: "auto",
            p: 0,
            pl: 1,
          }}
        >
          {savedFilters.map((filter) => {
            const isActive = filter.id === activeFilterId;
            return (
              <li key={filter.id}>
                <Chip
                  aria-pressed={isActive}
                  color={isActive ? "primary" : "default"}
                  label={filter.name}
                  onClick={() => {
                    if (isActive) {
                      onClear();
                    } else {
                      onApply(filter);
                    }
                  }}
                  onDelete={() => {
                    onDelete(filter.id);
                  }}
                  size="small"
                  variant={isActive ? "filled" : "outlined"}
                />
              </li>
            );
          })}
        </Box>
      ) : null}

      <Tooltip title="Columns">
        <ColumnsPanelTrigger render={<ToolbarButton />}>
          <ViewColumnIcon fontSize="small" />
        </ColumnsPanelTrigger>
      </Tooltip>
      <Tooltip title="Export">
        <ToolbarButton
          ref={exportMenuTriggerRef}
          id="export-menu-trigger"
          aria-controls="export-menu"
          aria-haspopup="true"
          aria-expanded={exportMenuOpen ? "true" : undefined}
          onClick={() => setExportMenuOpen(true)}
        >
          <FileDownloadIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>
      <Menu
        id="export-menu"
        anchorEl={exportMenuTriggerRef.current}
        open={exportMenuOpen}
        onClose={() => setExportMenuOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          list: {
            "aria-labelledby": "export-menu-trigger",
          },
        }}
      >
        <ExportPrint render={<MenuItem />} onClick={() => setExportMenuOpen(false)}>
          Print
        </ExportPrint>
        <ExportCsv render={<MenuItem />} onClick={() => setExportMenuOpen(false)}>
          Download as CSV
        </ExportCsv>
      </Menu>

      <QuickFilter
        render={(quickFilterProps, state) => (
          <div
            {...quickFilterProps}
            style={{ display: "flex", marginLeft: "auto", overflow: "clip" }}
          >
            <Tooltip title="Search">
              <QuickFilterTrigger render={<ToolbarButton />}>
                <SearchIcon fontSize="small" />
              </QuickFilterTrigger>
            </Tooltip>
            <Box
              sx={{
                display: "flex",
                overflow: "clip",
                transition: "width 250ms ease-in-out",
                width: state.expanded ? 220 : 0,
              }}
            >
              <QuickFilterControl
                aria-label="Search events"
                placeholder="Search"
                render={({ ref, ...controlProps }, state) => (
                  // A plain input, as in the MUI recipe: TextField's prop surface
                  // does not accept what the control passes down.
                  <StyledTextField
                    {...controlProps}
                    ownerState={{ expanded: state.expanded }}
                    inputRef={ref}
                    aria-label="Search"
                    placeholder="Search…"
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: state.value ? (
                          <InputAdornment position="end">
                            <QuickFilterClear
                              edge="end"
                              size="small"
                              aria-label="Clear search"
                              material={{ sx: { marginRight: -0.75 } }}
                            >
                              <CancelIcon fontSize="small" />
                            </QuickFilterClear>
                          </InputAdornment>
                        ) : null,
                        ...controlProps.slotProps?.input,
                      },
                      ...controlProps.slotProps,
                    }}
                  />
                )}
              />
              {state.expanded && state.value !== "" ? (
                <QuickFilterClear
                  render={
                    <IconButton aria-label="Clear search" size="small">
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  }
                />
              ) : null}
            </Box>
          </div>
        )}
      />
    </Toolbar>
  );
}
