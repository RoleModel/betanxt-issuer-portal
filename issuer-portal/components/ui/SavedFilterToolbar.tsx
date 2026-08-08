"use client";
import type { GridFilterItem, ToolbarButtonProps } from "@mui/x-data-grid-pro";

import CancelIcon from "@mui/icons-material/Cancel";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import { Box, Chip, Stack, Tooltip } from "@mui/material";
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
  gridColumnLookupSelector,
  gridFilterActiveItemsSelector,
  gridPageCountSelector,
  gridPaginationModelSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid-pro";
import * as React from "react";

import type { SavedFilter } from "@/hooks/useSavedFilters";

import GridTopPagination from "@/components/ui/GridTopPagination";

interface OwnerState {
  expanded: boolean;
}

export interface SavedFilterToolbarProps {
  readonly savedFilters: readonly SavedFilter[];
  readonly activeFilterId: string | null;
  readonly onApply: (filter: SavedFilter) => void;
  readonly onClear: () => void;
  readonly onDelete: (id: string) => void;
  readonly onRemoveFilter: (filterId: GridFilterItem["id"]) => void;
}

declare module "@mui/x-data-grid-pro" {
  // Module augmentation requires an interface that mirrors the toolbar props.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
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

const StyledToolbarButton = styled(
  // ToolbarButton's public type is wider than what `styled()` accepts here.

  ToolbarButton as React.ComponentType<ToolbarButtonProps>
)<{
  ownerState: OwnerState;
}>(({ theme, ownerState }) => ({
  gridArea: "1 / 1",
  width: "min-content",
  height: "min-content",
  zIndex: 1,
  opacity: ownerState.expanded ? 0 : 1,
  pointerEvents: ownerState.expanded ? "none" : "auto",
  transition: theme.transitions.create(["opacity"]),
}));

const formatFilterValue = (
  filter: GridFilterItem,
  columnType: string | undefined
): string => {
  if (filter.value === undefined || filter.value === null) {
    return "";
  }

  if (columnType !== "date") {
    return String(filter.value);
  }

  const date = new Date(String(filter.value));
  return Number.isNaN(date.getTime())
    ? String(filter.value)
    : date.toLocaleDateString("en-US");
};

interface ActiveFilterChipsProps {
  readonly onRemoveFilter: (filterId: GridFilterItem["id"]) => void;
}

const ActiveFilterChips = ({ onRemoveFilter }: ActiveFilterChipsProps) => {
  const apiRef = useGridApiContext();
  const activeFilters = useGridSelector(apiRef, gridFilterActiveItemsSelector);
  const columns = useGridSelector(apiRef, gridColumnLookupSelector);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <Stack
      aria-label="Active filters"
      component="ul"
      direction="row"
      gap={0.75}
      sx={{ listStyle: "none", m: 0, minWidth: 0, overflowX: "auto", p: 0 }}
    >
      {activeFilters.map((filter) => {
        const column = columns[filter.field];
        const field = column.headerName ?? filter.field;
        const operator =
          column.filterOperators?.find(
            (candidate) => candidate.value === filter.operator
          )?.label ?? filter.operator;
        const value = formatFilterValue(filter, column.type);
        const label = [field, operator, value].filter(Boolean).join(" ");
        const key =
          filter.id ??
          `${filter.field}-${filter.operator}-${String(filter.value)}`;

        return (
          <li key={key}>
            <Chip
              label={label}
              onDelete={() => {
                onRemoveFilter(filter.id);
              }}
              size="small"
              color="primary"
              variant="filled"
            />
          </li>
        );
      })}
    </Stack>
  );
};

/**
 * The standard grid toolbar controls, active filter chips, and saved filter
 * groups.
 *
 * Follows the MUI custom-toolbar recipe, including the search that slides open
 * from its trigger rather than occupying the bar permanently. Groups are
 * created in the filter panel, where the filters are actually built; this only
 * applies and removes them.
 *
 * Clicking a chip applies that group, and clicking the active chip clears it,
 * so a saved filter reads as a toggle rather than a one-way trip.
 */
export const SavedFilterToolbar = ({
  savedFilters,
  activeFilterId,
  onApply,
  onClear,
  onDelete,
  onRemoveFilter,
}: SavedFilterToolbarProps) => {
  const [exportAnchorEl, setExportAnchorEl] =
    React.useState<HTMLElement | null>(null);
  const exportMenuOpen = exportAnchorEl !== null;
  const apiRef = useGridApiContext();
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);

  return (
    <>
      <GridTopPagination
        count={pageCount}
        onChange={(page) => {
          apiRef.current.setPage(page - 1);
        }}
        page={paginationModel.page + 1}
      />
      <Toolbar>
        <Tooltip title="Filters">
          <FilterPanelTrigger render={<ToolbarButton />}>
            <FilterListIcon fontSize="small" />
          </FilterPanelTrigger>
        </Tooltip>

        <ActiveFilterChips onRemoveFilter={onRemoveFilter} />

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

        <QuickFilter
          render={(quickFilterProps, state) => (
            <div
              {...quickFilterProps}
              style={{ display: "flex", marginLeft: "auto", overflow: "clip" }}
            >
              <QuickFilterTrigger
                render={(triggerProps, triggerState) => (
                  <Tooltip title="Search" enterDelay={0}>
                    <StyledToolbarButton
                      aria-controls={triggerProps["aria-controls"]}
                      aria-disabled={triggerState.expanded}
                      aria-expanded={triggerProps["aria-expanded"]}
                      className={triggerProps.className}
                      color="default"
                      disabled={triggerProps.disabled}
                      id={triggerProps.id}
                      // eslint-disable-next-line -- forwards the trigger's own click handler
                      onClick={triggerProps.onClick}
                      ownerState={{ expanded: triggerState.expanded }}
                      ref={triggerProps.ref}
                      tabIndex={triggerProps.tabIndex}
                      title={triggerProps.title}
                    >
                      <SearchIcon fontSize="small" />
                    </StyledToolbarButton>
                  </Tooltip>
                )}
              />
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
                  render={({ ref, ...controlProps }, controlState) => (
                    // A plain input, as in the MUI recipe: TextField's prop surface
                    // does not accept what the control passes down.
                    <StyledTextField
                      {...controlProps}
                      ownerState={{ expanded: controlState.expanded }}
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
                          endAdornment: controlState.value ? (
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
              </Box>
            </div>
          )}
        />

        <Tooltip title="Columns">
          <ColumnsPanelTrigger render={<ToolbarButton />}>
            <ViewColumnIcon fontSize="small" />
          </ColumnsPanelTrigger>
        </Tooltip>
        <Tooltip title="Export">
          <ToolbarButton
            id="export-menu-trigger"
            aria-controls="export-menu"
            aria-haspopup="true"
            aria-expanded={exportMenuOpen ? "true" : undefined}
            onClick={(event) => {
              setExportAnchorEl(event.currentTarget);
            }}
          >
            <FileDownloadIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>
        <Menu
          id="export-menu"
          anchorEl={exportAnchorEl}
          open={exportMenuOpen}
          onClose={() => {
            setExportAnchorEl(null);
          }}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            list: {
              "aria-labelledby": "export-menu-trigger",
            },
          }}
        >
          <ExportPrint
            render={<MenuItem />}
            onClick={() => {
              setExportAnchorEl(null);
            }}
          >
            Print
          </ExportPrint>
          <ExportCsv
            render={<MenuItem />}
            onClick={() => {
              setExportAnchorEl(null);
            }}
          >
            Download as CSV
          </ExportCsv>
        </Menu>
      </Toolbar>
    </>
  );
};
