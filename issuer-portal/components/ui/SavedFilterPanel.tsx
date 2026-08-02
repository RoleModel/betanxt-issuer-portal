"use client";

import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import {
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { GridFilterPanel, useGridApiContext } from "@mui/x-data-grid-pro";
import { useState } from "react";

export interface SavedFilterPanelProps {
  readonly onAddFilter: () => void;
  readonly onClearFilters: () => void;
  readonly onSaveFilters: (name: string) => void;
}

declare module "@mui/x-data-grid-pro" {
  interface FilterPanelPropsOverrides extends SavedFilterPanelProps {}
}

/**
 * The stock filter panel — including its Add filter / Remove all controls —
 * with a save affordance appended.
 *
 * GridFilterPanel destructures `children` but never renders them, so the save
 * section is a sibling rather than a child.
 *
 * Saving lives here rather than on the toolbar so a group is captured at the
 * moment it is built: add the columns you want, name it, keep it. The section
 * only appears once at least one filter exists, since an empty group would be
 * indistinguishable from no filter at all.
 */
export const SavedFilterPanel = ({
  onAddFilter,
  onClearFilters,
  onSaveFilters,
}: SavedFilterPanelProps) => {
  const apiRef = useGridApiContext();
  const [draftName, setDraftName] = useState("");

  const itemCount = apiRef.current.state.filter.filterModel.items.filter(
    (item) => item.value !== undefined || item.operator === "isEmpty"
  ).length;
  const hasFilters = apiRef.current.state.filter.filterModel.items.length > 0;

  const commit = () => {
    if (draftName.trim().length === 0) {
      return;
    }
    onSaveFilters(draftName);
    setDraftName("");
  };

  return (
    <Box>
      <GridFilterPanel disableAddFilterButton disableRemoveAllButton />
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        sx={{ px: 2, pb: itemCount > 0 ? 0 : 1.5 }}
      >
        <Button
          onClick={onAddFilter}
          startIcon={<AddOutlinedIcon fontSize="small" />}
          variant="text"
        >
          Add filter
        </Button>
        {hasFilters ? (
          <Button
            onClick={onClearFilters}
            startIcon={<DeleteSweepOutlinedIcon fontSize="small" />}
            variant="text"
          >
            Remove all
          </Button>
        ) : null}
      </Stack>
      {itemCount > 0 ? (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Divider sx={{ mb: 1.5 }} />
          <Typography
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
            variant="body3"
          >
            Save these {itemCount === 1 ? "filter" : `${itemCount} filters`} as
            a reusable group
          </Typography>
          <Stack direction="row" gap={1}>
            <TextField
              label="Group name"
              onChange={(event) => {
                setDraftName(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commit();
                }
              }}
              size="small"
              sx={{ flex: 1 }}
              value={draftName}
            />
            <Button
              disabled={draftName.trim().length === 0}
              onClick={commit}
              startIcon={<BookmarkAddOutlinedIcon fontSize="small" />}
              variant="contained"
            >
              Save filters
            </Button>
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};
