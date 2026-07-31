"use client";

import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { useEffect, useMemo, useState } from "react";

import { termsDefinitions } from "@/lib/termsDefinitions";

interface InfoDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly term: string;
  readonly definition: string;
}

interface GlossaryTerm {
  readonly category: string;
  readonly id: string;
  readonly term: string;
}

interface GlossaryTreeItem {
  readonly children?: GlossaryTreeItem[];
  readonly id: string;
  readonly label: string;
}

const categoryItemId = (category: string): string => `category:${category}`;
const termItemId = (termId: string): string => `term:${termId}`;

const glossaryTerms = Object.entries(termsDefinitions)
  .map(([id, item]) => ({
    category: item.category,
    id,
    term: item.term,
  }))
  .sort((firstTerm, secondTerm) =>
    firstTerm.term.localeCompare(secondTerm.term)
  );

const glossaryTreeItems = Array.from(
  new Set(glossaryTerms.map((item) => item.category))
)
  .sort((firstCategory, secondCategory) =>
    firstCategory.localeCompare(secondCategory)
  )
  .map<GlossaryTreeItem>((category) => ({
    children: glossaryTerms.flatMap((item) =>
      item.category === category
        ? [{ id: termItemId(item.id), label: item.term }]
        : []
    ),
    id: categoryItemId(category),
    label: category,
  }));

const getGlossaryDefinition = (termId: string): string | undefined =>
  termsDefinitions[termId as keyof typeof termsDefinitions]?.definition;

const getGlossaryTerm = (termId: string): GlossaryTerm | undefined =>
  glossaryTerms.find((item) => item.id === termId);

const filterGlossaryTreeItems = (searchQuery: string): GlossaryTreeItem[] => {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

  if (normalizedQuery.length === 0) {
    return glossaryTreeItems;
  }

  return glossaryTreeItems.reduce<GlossaryTreeItem[]>(
    (matchingCategories, category) => {
      const categoryMatches = category.label
        .toLocaleLowerCase()
        .includes(normalizedQuery);
      const matchingTerms = categoryMatches
        ? category.children
        : category.children?.filter((termItem) =>
            termItem.label.toLocaleLowerCase().includes(normalizedQuery)
          );

      if (matchingTerms === undefined || matchingTerms.length === 0) {
        return matchingCategories;
      }

      matchingCategories.push({ ...category, children: matchingTerms });
      return matchingCategories;
    },
    []
  );
};

export const InfoDialog = ({
  open,
  onClose,
  term,
  definition,
}: InfoDialogProps) => {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const matchingTerm = glossaryTerms.find((item) => item.term === term);
  const initialTermId = matchingTerm?.id ?? glossaryTerms[0]?.id ?? null;

  useEffect(() => {
    if (!open || initialTermId === null) {
      return;
    }

    const initialTerm = getGlossaryTerm(initialTermId);
    setSelectedTermId(initialTermId);
    setExpandedItems(
      initialTerm === undefined ? [] : [categoryItemId(initialTerm.category)]
    );
  }, [initialTermId, open]);

  // Memoized because a non-empty query rebuilds the array on every render, and
  // this value is a dependency of the effect below that sets `expandedItems` —
  // an unstable reference there re-triggers the effect endlessly.
  const filteredTreeItems = useMemo(
    () => filterGlossaryTreeItems(searchQuery),
    [searchQuery]
  );

  const selectedTerm = selectedTermId
    ? getGlossaryTerm(selectedTermId)
    : undefined;
  const selectedTermIndex = selectedTermId
    ? glossaryTerms.findIndex((item) => item.id === selectedTermId)
    : -1;
  const currentDefinition = selectedTermId
    ? getGlossaryDefinition(selectedTermId)
    : undefined;
  const displayedDefinition =
    selectedTerm?.term === term && definition.length > 0
      ? definition
      : (currentDefinition ?? definition);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setExpandedItems(filteredTreeItems.map((item) => item.id));
      return;
    }

    if (selectedTerm) {
      setExpandedItems([categoryItemId(selectedTerm.category)]);
    }
  }, [filteredTreeItems, searchQuery, selectedTerm]);

  const selectTerm = (termId: string) => {
    const nextTerm = getGlossaryTerm(termId);
    if (nextTerm === undefined) {
      return;
    }

    setSelectedTermId(termId);
    setExpandedItems((currentItems) => {
      const categoryId = categoryItemId(nextTerm.category);
      return currentItems.includes(categoryId)
        ? currentItems
        : [...currentItems, categoryId];
    });
  };

  const handleSelectedItemsChange = (
    _event: React.SyntheticEvent | null,
    itemId: string | null
  ) => {
    if (!itemId?.startsWith("term:")) {
      return;
    }

    selectTerm(itemId.slice("term:".length));
  };

  const handleCopyToClipboard = async () => {
    if (displayedDefinition.length === 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(displayedDefinition);
    } catch {
      // The browser may deny clipboard access; the definition remains selectable.
    }
  };

  const previousTerm =
    selectedTermIndex > 0 ? glossaryTerms[selectedTermIndex - 1] : undefined;
  const nextTerm =
    selectedTermIndex >= 0 && selectedTermIndex < glossaryTerms.length - 1
      ? glossaryTerms[selectedTermIndex + 1]
      : undefined;

  return (
    <Drawer
      anchor="bottom"
      aria-describedby="glossary-definition"
      aria-labelledby="glossary-drawer-title"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
            height: "75dvh",
            maxHeight: "75dvh",
            overflow: "hidden",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
          <Stack
            alignItems={{ sm: "center" }}
            direction={{ sm: "row" }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              <Typography
                component="h2"
                id="glossary-drawer-title"
                variant="h6"
              >
                Terms and Definitions
              </Typography>
              <Typography color="text.secondary" variant="body3">
                Browse by category, then select a term to view its definition.
              </Typography>
            </Box>
            <Stack alignItems="center" direction="row" spacing={1}>
              <IconButton
                aria-label="Close terms and definitions"
                onClick={onClose}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
        <Divider />

        <Box
          sx={{
            display: "grid",
            flex: 1,
            gridTemplateColumns: {
              md: "minmax(260px, 0.32fr) minmax(0, 1fr)",
              xs: "1fr",
            },
            gridTemplateRows: {
              md: "minmax(0, 1fr)",
              xs: "minmax(180px, 0.35fr) minmax(0, 1fr)",
            },
            minHeight: 0,
          }}
        >
          <GlossaryNav
            expandedItems={expandedItems}
            filteredTreeItems={filteredTreeItems}
            onExpandedItemsChange={setExpandedItems}
            onSearchQueryChange={setSearchQuery}
            onSelectedItemsChange={handleSelectedItemsChange}
            searchQuery={searchQuery}
            selectedTermId={selectedTermId}
          />

          <GlossaryDefinitionPanel
            displayedDefinition={displayedDefinition}
            nextTerm={nextTerm}
            onCopy={handleCopyToClipboard}
            onSelectTerm={selectTerm}
            previousTerm={previousTerm}
            selectedTerm={selectedTerm}
          />
        </Box>

        <Divider />
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1.5 }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

interface GlossaryNavProps {
  readonly expandedItems: string[];
  readonly filteredTreeItems: GlossaryTreeItem[];
  readonly onExpandedItemsChange: (itemIds: string[]) => void;
  readonly onSearchQueryChange: (value: string) => void;
  readonly onSelectedItemsChange: (
    event: React.SyntheticEvent | null,
    itemId: string | null
  ) => void;
  readonly searchQuery: string;
  readonly selectedTermId: string | null;
}

const GlossaryNav = ({
  expandedItems,
  filteredTreeItems,
  onExpandedItemsChange,
  onSearchQueryChange,
  onSelectedItemsChange,
  searchQuery,
  selectedTermId,
}: GlossaryNavProps) => (
  <Box
    aria-label="Glossary categories"
    component="nav"
    sx={{
      borderBottom: { md: 0, xs: 1 },
      borderColor: "divider",
      borderRight: { md: 1, xs: 0 },
      minHeight: 0,
      overflowY: "auto",
      p: 1.5,
    }}
  >
    <TextField
      placeholder="Search terms"
      size="small"
      margin="normal"
      value={searchQuery}
      onChange={(event) => {
        onSearchQueryChange(event.target.value);
      }}
      slotProps={{
        htmlInput: {
          "aria-label": "Search glossary terms",
        },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
      sx={{ minWidth: { sm: 260 }, width: { xs: "100%", sm: 300 } }}
    />
    <RichTreeView<GlossaryTreeItem>
      expandedItems={expandedItems}
      items={filteredTreeItems}
      itemChildrenIndentation={20}
      onExpandedItemsChange={(_event, itemIds) => {
        onExpandedItemsChange(itemIds);
      }}
      onSelectedItemsChange={onSelectedItemsChange}
      selectedItems={
        selectedTermId === null ? null : termItemId(selectedTermId)
      }
      sx={{
        "& .MuiTreeItem-content": {
          borderRadius: 1,
        },
        "& .MuiTreeItem-label": {
          typography: "body3",
        },
      }}
    />
    {filteredTreeItems.length === 0 ? (
      <Typography color="text.secondary" sx={{ px: 1, py: 2 }} variant="body3">
        No glossary terms match your search.
      </Typography>
    ) : null}
  </Box>
);

interface GlossaryDefinitionPanelProps {
  readonly displayedDefinition: string;
  readonly nextTerm: GlossaryTerm | undefined;
  readonly onCopy: () => Promise<void>;
  readonly onSelectTerm: (termId: string) => void;
  readonly previousTerm: GlossaryTerm | undefined;
  readonly selectedTerm: GlossaryTerm | undefined;
}

const GlossaryDefinitionPanel = ({
  displayedDefinition,
  nextTerm,
  onCopy,
  onSelectTerm,
  previousTerm,
  selectedTerm,
}: GlossaryDefinitionPanelProps) => (
  <Box
    id="glossary-definition"
    sx={{
      minHeight: 0,
      overflowY: "auto",
      p: { xs: 2, sm: 3 },
    }}
  >
    <Stack spacing={2} sx={{ height: "100%" }}>
      <Box
        sx={{
          alignItems: "flex-start",
          display: "flex",
          gap: 1,
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography component="h3" variant="h5">
            {selectedTerm?.term ?? "Glossary"}
          </Typography>
          {selectedTerm ? (
            <Typography color="text.secondary" variant="body3">
              {selectedTerm.category}
            </Typography>
          ) : null}
        </Box>
        <Tooltip title="Copy definition">
          <span>
            <IconButton
              aria-label={`Copy definition of ${selectedTerm?.term ?? "glossary term"}`}
              disabled={displayedDefinition.length === 0}
              onClick={() => {
                void onCopy();
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Typography
        sx={{ maxWidth: 920, whiteSpace: "pre-wrap" }}
        variant="body2"
      >
        {displayedDefinition}
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Stack direction="row" justifyContent="space-between" spacing={1}>
        <Button
          disabled={previousTerm === undefined}
          onClick={() => {
            if (previousTerm) {
              onSelectTerm(previousTerm.id);
            }
          }}
          startIcon={<NavigateBeforeIcon />}
          variant="text"
        >
          Previous
        </Button>
        <Button
          disabled={nextTerm === undefined}
          endIcon={<NavigateNextIcon />}
          onClick={() => {
            if (nextTerm) {
              onSelectTerm(nextTerm.id);
            }
          }}
          variant="text"
        >
          Next
        </Button>
      </Stack>
    </Stack>
  </Box>
);
