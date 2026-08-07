"use client";

import type { ReactElement, SyntheticEvent } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { useState } from "react";

import ChartsSpecPage from "@/app/specs/charts/page";
import { SPEC_META as CHARTS_META } from "@/app/specs/charts/requirements";
import MailingThumbnailsSpecPage from "@/app/specs/mailing-thumbnails/page";
import { SPEC_META as MAILING_THUMBNAILS_META } from "@/app/specs/mailing-thumbnails/requirements";
import TabulationReleaseSpecPage from "@/app/specs/tabulation-release/page";
import { SPEC_META as TABULATION_RELEASE_META } from "@/app/specs/tabulation-release/requirements";
import UiEnhancementsSpecPage from "@/app/specs/ui-enhancements/page";
import { SPEC_META as UI_ENHANCEMENTS_META } from "@/app/specs/ui-enhancements/requirements";

interface SpecTreeItem {
  readonly id: string;
  readonly label: string;
}

interface SpecEntry extends SpecTreeItem {
  readonly Page: () => ReactElement;
}

/**
 * Every spec available from this index, keyed by the id its tree item and
 * right-hand panel share.
 *
 * @remarks
 * Each entry's `Page` is the same component the spec's own route renders —
 * these pages are already self-contained (their own layout, download
 * buttons, and requirement sections) — so the index mounts whichever one is
 * selected instead of re-deriving its content.
 */
const SPECS: readonly SpecEntry[] = [
  {
    id: "mailing-thumbnails",
    label: MAILING_THUMBNAILS_META.title,
    Page: MailingThumbnailsSpecPage,
  },
  {
    id: "tabulation-release",
    label: TABULATION_RELEASE_META.title,
    Page: TabulationReleaseSpecPage,
  },
  {
    id: "charts",
    label: CHARTS_META.title,
    Page: ChartsSpecPage,
  },
  {
    id: "ui-enhancements",
    label: UI_ENHANCEMENTS_META.title,
    Page: UiEnhancementsSpecPage,
  },
];

const SPEC_TREE_ITEMS: readonly SpecTreeItem[] = SPECS.map((spec) => ({
  id: spec.id,
  label: spec.label,
}));

const DEFAULT_SPEC_ID = SPECS[0].id;

/**
 * Landing page for the internal specs: a tree of every spec on the left,
 * the selected one rendered on the right.
 */
const SpecsIndexPage = () => {
  const [selectedSpecId, setSelectedSpecId] = useState<string>(DEFAULT_SPEC_ID);

  const handleSelectedItemsChange = (
    _event: SyntheticEvent | null,
    itemId: string | null
  ): void => {
    if (itemId !== null) {
      setSelectedSpecId(itemId);
    }
  };

  const selectedSpec =
    SPECS.find((spec) => spec.id === selectedSpecId) ?? SPECS[0];
  const SelectedSpecPage = selectedSpec.Page;

  return (
    <Box sx={{ display: "flex", minHeight: "100%" }}>
      <Box
        aria-label="Specifications"
        component="nav"
        sx={{
          borderRight: "1px solid var(--mui-palette-divider)",
          flexShrink: 0,
          overflowY: "auto",
          px: 1,
          py: 2,
          width: 300,
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ display: "block", mb: 1, px: 1 }}
        >
          Specifications
        </Typography>
        <RichTreeView<SpecTreeItem>
          items={SPEC_TREE_ITEMS}
          onSelectedItemsChange={handleSelectedItemsChange}
          selectedItems={selectedSpecId}
          sx={{
            "& .MuiTreeItem-content": {
              borderRadius: 1,
            },
            "& .MuiTreeItem-label": {
              typography: "body2",
            },
          }}
        />
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0, overflowY: "auto" }}>
        <SelectedSpecPage />
      </Box>
    </Box>
  );
};

export default SpecsIndexPage;
