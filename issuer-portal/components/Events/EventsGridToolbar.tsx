"use client";

// material-ui
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import { Box, Button, CircularProgress } from "@mui/material";
import {
  gridRowSelectionCountSelector,
  gridRowSelectionIdsSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid-pro";

// project imports
import type { SavedFilterToolbarProps } from "@/components/ui/SavedFilterToolbar";

import { SavedFilterToolbar } from "@/components/ui/SavedFilterToolbar";

import type { TabulationReleaseProgress } from "./useTabulationRelease";

export interface EventsGridToolbarProps extends SavedFilterToolbarProps {
  readonly canReleaseTabulation?: boolean;
  readonly onReleaseTabulation?: (meetingIds: readonly string[]) => void;
  readonly tabulationProgress?: TabulationReleaseProgress | null;
}

declare module "@mui/x-data-grid-pro" {
  // Optional so the other grids that share `SavedFilterToolbar` are unaffected.
  interface ToolbarPropsOverrides {
    readonly canReleaseTabulation?: boolean;
    readonly onReleaseTabulation?: (meetingIds: readonly string[]) => void;
    readonly tabulationProgress?: TabulationReleaseProgress | null;
  }
}

// ==============================|| EVENTS GRID TOOLBAR ||============================== //

/**
 * The events grid's toolbar: the shared saved-filter bar, plus the bulk
 * tabulation release a CSM needs.
 *
 * @remarks
 * Releasing is the primary action on this screen, so it is a contained button
 * at the default size. It is positioned out of the toolbar's flow and over the
 * grid's own header band, where the pagination row leaves its left half empty:
 * laid out inline it added a whole row above the grid and pushed the data down,
 * to hold a control that is only actionable once rows are checked. Nothing
 * renders until there is a selection, so the band is untouched until the CSM
 * has actually chosen something.
 *
 * Selection is read through `gridRowSelectionIdsSelector` rather than
 * `apiRef.current.getSelectedRows()`, which is deprecated; the selector is also
 * what re-renders this toolbar when the checkboxes change.
 */
export const EventsGridToolbar = ({
  canReleaseTabulation = false,
  onReleaseTabulation,
  tabulationProgress = null,
  ...savedFilterProps
}: EventsGridToolbarProps) => {
  const apiRef = useGridApiContext();
  const selectedCount = useGridSelector(apiRef, gridRowSelectionCountSelector);
  const selectedIds = useGridSelector(apiRef, gridRowSelectionIdsSelector);
  const isReleasing = tabulationProgress !== null;
  const isVisible = canReleaseTabulation && selectedCount > 0;

  const handleRelease = () => {
    if (onReleaseTabulation === undefined) {
      return;
    }

    onReleaseTabulation([...selectedIds.keys()].map((rowId) => String(rowId)));
  };

  return (
    <>
      {isVisible ? (
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            position: "absolute",
            transform: "translateX(-50%)",
            top: 10,
            left: "50%",
            pt: 1,
            zIndex: 1,
          }}
        >
          <Button
            disabled={isReleasing || onReleaseTabulation === undefined}
            onClick={handleRelease}
            startIcon={
              isReleasing ? (
                <CircularProgress color="inherit" size={16} />
              ) : (
                <PublishedWithChangesIcon />
              )
            }
            variant="contained"
          >
            {isReleasing
              ? `Releasing ${String(tabulationProgress.completed)} of ${String(tabulationProgress.total)}`
              : `Release tabulation (${String(selectedCount)})`}
          </Button>
        </Box>
      ) : null}
      <SavedFilterToolbar {...savedFilterProps} />
    </>
  );
};

export default EventsGridToolbar;
