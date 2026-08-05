/**
 * Reference code attached to the requirements.
 *
 * @remarks
 * Stored as strings so the page can show and download them without the build
 * compiling them. They exist because requirements like "the choice sticks" and
 * "shareable links" are quick to write and slow to interpret.
 *
 * The first sample is existing code, included so the spec shows what is already
 * there. The rest are proposed.
 */

import type { CodeLanguage } from "@/components/Specs/highlight";

import {
  GLOSSARY_TEXT_SOURCE,
  GLOSSARY_TOOLTIP_SOURCE,
} from "@/app/specs/ui-enhancements/glossary-markup-source";

export interface CodeSample {
  /** True when this is code that already ships, not a proposal. */
  readonly asBuilt?: boolean;
  readonly code: string;
  readonly filename: string;
  readonly language: CodeLanguage;
  /** Requirement ids this covers. */
  readonly satisfies: readonly string[];
  readonly sectionId: string;
  readonly title: string;
}

const GLOSSARY_AS_BUILT = `// ABRIDGED — the shape of the glossary that ships today.
// Full source: components/InfoDialog.tsx (~380 lines) and components/SpeedDial.tsx

// 1. The floating support menu, fixed to the bottom-right of every page.
//    "Glossary of Terms" is one of its three actions.
<IssuerSpeedDial
  onAssistantClick={openAssistant}
  onContactsClick={openContacts}
  onGlossaryClick={() => { openGlossary(); }}
/>

// 2. One drawer for the whole app, mounted by GlossaryProvider. Any term
//    marker anywhere names a term; this is the single thing that opens.
<Drawer
  anchor="bottom"
  aria-labelledby="glossary-drawer-title"
  open={open}
  onClose={onClose}
  slotProps={{ paper: { sx: { height: "75dvh", overflow: "hidden" } } }}
>
  <Typography component="h2" id="glossary-drawer-title" variant="h6">
    Terms and Definitions
  </Typography>
  <Typography color="text.secondary" variant="body3">
    Browse by category, then select a term to view its definition.
  </Typography>

  {/* Two panes side by side, stacked on narrow screens. */}
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { md: "minmax(260px, 0.32fr) minmax(0, 1fr)", xs: "1fr" },
      gridTemplateRows: { md: "minmax(0, 1fr)", xs: "minmax(180px, 0.35fr) minmax(0, 1fr)" },
    }}
  >
    {/* Left: search box + expandable category tree. */}
    <GlossaryNav
      expandedItems={expandedItems}
      filteredTreeItems={filteredTreeItems}
      onSearchQueryChange={setSearchQuery}
      searchQuery={searchQuery}
      selectedTermId={selectedTermId}
    />

    {/* Right: the selected definition, with copy and prev/next. */}
    <GlossaryDefinitionPanel
      displayedDefinition={displayedDefinition}
      nextTerm={nextTerm}
      onCopy={handleCopyToClipboard}
      previousTerm={previousTerm}
      selectedTerm={selectedTerm}
    />
  </Box>
</Drawer>

// 3. Today's search. This is the piece GLO-02 changes: it compares the query
//    against category and term LABELS only, so a word that appears inside a
//    definition, or a short form like "NOBO", finds nothing.
const matchingTerms = categoryMatches
  ? category.children
  : category.children?.filter((termItem) =>
      termItem.label.toLocaleLowerCase().includes(normalizedQuery)
    );
`;

const PERSISTED_DISPLAY_MODE = `"use client";

import type { PropsWithChildren } from "react";

import { useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type TabulationDisplayMode = "numbers" | "percentages";

const STORAGE_KEY = "issuer-portal.tabulation-display-mode";
const DEFAULT_MODE: TabulationDisplayMode = "percentages";

interface TabulationDisplayContextValue {
  readonly displayMode: TabulationDisplayMode;
  readonly setDisplayMode: (mode: TabulationDisplayMode) => void;
}

const TabulationDisplayContext = createContext<TabulationDisplayContextValue | null>(null);

const isDisplayMode = (value: unknown): value is TabulationDisplayMode =>
  value === "numbers" || value === "percentages";

/**
 * Reads the saved choice, tolerating browsers that block storage.
 *
 * @returns The saved format, or the default when nothing usable is stored.
 *
 * @remarks
 * Private browsing makes \`localStorage\` throw on access rather than return
 * null, so this is wrapped rather than null-checked. An unrecognised value is
 * treated as missing, which matters when an older build wrote it.
 */
const readStoredMode = (): TabulationDisplayMode => {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return isDisplayMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
};

/**
 * Holds the chosen format for every figure below it.
 *
 * @remarks
 * Three inputs, in increasing priority: the default, the user's saved choice,
 * and a \`?display=\` link. The link is deliberately not saved — it lets someone
 * show a colleague one reading without changing how their portal behaves after.
 *
 * The saved value is read in an effect rather than in the initial state because
 * the server render cannot see \`localStorage\`, and seeding state from it there
 * causes a hydration mismatch on every load.
 */
export const TabulationDisplayProvider = ({ children }: PropsWithChildren) => {
  const searchParameters = useSearchParams();
  const overrideMode = searchParameters.get("display");
  const [storedMode, setStoredMode] = useState<TabulationDisplayMode>(DEFAULT_MODE);

  useEffect(() => {
    setStoredMode(readStoredMode());
  }, []);

  const setDisplayMode = useCallback((mode: TabulationDisplayMode): void => {
    setStoredMode(mode);
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, mode);
    } catch {
      // Someone who blocks storage still gets the toggle for this session.
    }
  }, []);

  const value = useMemo<TabulationDisplayContextValue>(
    () => ({
      displayMode: isDisplayMode(overrideMode) ? overrideMode : storedMode,
      setDisplayMode,
    }),
    [overrideMode, setDisplayMode, storedMode]
  );

  return (
    <TabulationDisplayContext.Provider value={value}>
      {children}
    </TabulationDisplayContext.Provider>
  );
};

/**
 * Reads the chosen format.
 *
 * @returns The format and its setter.
 * @throws When used outside {@link TabulationDisplayProvider}.
 */
export const useTabulationDisplay = (): TabulationDisplayContextValue => {
  const context = useContext(TabulationDisplayContext);

  if (context === null) {
    throw new Error("useTabulationDisplay must be used within a TabulationDisplayProvider");
  }

  return context;
};
`;

const METRIC_FORMATTER = `import type { TabulationDisplayMode } from "@/contexts/TabulationDisplayContext";

/** Every base a percentage is allowed to use. */
export type MetricBase =
  | "brokerVotes"
  | "mailingPositions"
  | "proposalVotedShares"
  | "sharesOutstanding"
  | "totalPositions"
  | "votedShares";

/**
 * What to call each base in a tooltip.
 *
 * @remarks
 * PCT-03 requires the base to be visible wherever a percentage is. Keeping the
 * wording next to the type means a new base cannot be added without someone
 * deciding what to call it in front of an issuer.
 */
export const BASE_LABELS: Record<MetricBase, string> = {
  brokerVotes: "of this broker's votes",
  mailingPositions: "of mailing positions",
  proposalVotedShares: "of shares voted on this proposal",
  sharesOutstanding: "of shares outstanding",
  totalPositions: "of total positions",
  votedShares: "of shares voted",
};

export interface TabulationMetric {
  /** The reading the user did not pick, for the tooltip. */
  readonly alternate: string;
  /** The reading matching the chosen format. */
  readonly display: string;
  /** Ready-made tooltip text, base included. */
  readonly tooltip: string;
}

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/**
 * Formats one figure both ways and builds its tooltip.
 *
 * @param value - The count. Always the true quantity.
 * @param total - The base, chosen from {@link MetricBase}.
 * @param displayMode - Which reading the user picked.
 * @param base - Names the base so the tooltip can state it.
 * @returns Both readings and the tooltip.
 *
 * @remarks
 * A zero total gives \`0.00%\` rather than \`NaN\`. An empty meeting is normal
 * early in a proxy cycle, and a dashboard that breaks before any votes arrive
 * is worse than one reading zero.
 *
 * Callers pass the true value even where a chart enlarges a small slice to keep
 * it visible (PCT-10). Reading a label off the drawn size is how percentages
 * stop adding up to 100.
 */
export const formatTabulationMetric = (
  value: number,
  total: number,
  displayMode: TabulationDisplayMode,
  base: MetricBase = "sharesOutstanding"
): TabulationMetric => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const percentageText = \`\${percentage.toFixed(2)}%\`;
  const countText = numberFormatter.format(value);
  const isNumbers = displayMode === "numbers";

  return {
    alternate: isNumbers ? percentageText : countText,
    display: isNumbers ? countText : percentageText,
    tooltip: \`\${countText} of \${numberFormatter.format(total)} — \${percentageText} \${BASE_LABELS[base]}\`,
  };
};
`;

const GLOSSARY_DEEP_LINK = `"use client";

import type { PropsWithChildren } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";

import { InfoDialog } from "@/components/InfoDialog";
import { termsDefinitions } from "@/lib/termsDefinitions";

export type GlossaryTermId = keyof typeof termsDefinitions;

/** Query key that opens the drawer, e.g. /WEN/meeting/123?glossary=quorum */
const GLOSSARY_PARAM = "glossary";

interface GlossaryContextValue {
  readonly closeGlossary: () => void;
  readonly isOpen: boolean;
  /** Absolute link that reopens the drawer on this term. */
  readonly linkToTerm: (termId: GlossaryTermId) => string;
  readonly openGlossary: (termId?: GlossaryTermId) => void;
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null);

/**
 * Owns the one glossary drawer and the term it is showing.
 *
 * @remarks
 * The open term lives in the URL rather than in component state, which is what
 * makes a definition shareable (TIP-04) without adding a glossary page. The
 * drawer still opens over whatever page the reader was on, so they keep their
 * place (TIP-05) — the address simply describes what is on screen.
 *
 * \`replace\` rather than \`push\` when closing, so dismissing the drawer does not
 * leave an extra entry the Back button has to walk through.
 */
export const GlossaryProvider = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParameters = useSearchParams();

  const requestedTerm = searchParameters.get(GLOSSARY_PARAM);
  // An unknown term is a stale link, not a crash: open at the top instead.
  const openTermId =
    requestedTerm !== null && requestedTerm in termsDefinitions
      ? (requestedTerm as GlossaryTermId)
      : null;
  const isOpen = requestedTerm !== null;

  const buildHref = useCallback(
    (termId?: GlossaryTermId): string => {
      const next = new URLSearchParams(searchParameters.toString());

      if (termId === undefined) {
        next.set(GLOSSARY_PARAM, "");
      } else {
        next.set(GLOSSARY_PARAM, termId);
      }

      return \`\${pathname}?\${next.toString()}\`;
    },
    [pathname, searchParameters]
  );

  const value = useMemo<GlossaryContextValue>(() => {
    const closeGlossary = (): void => {
      const next = new URLSearchParams(searchParameters.toString());
      next.delete(GLOSSARY_PARAM);
      const query = next.toString();
      router.replace(query.length > 0 ? \`\${pathname}?\${query}\` : pathname, {
        scroll: false,
      });
    };

    return {
      closeGlossary,
      isOpen,
      linkToTerm: (termId) => new URL(buildHref(termId), globalThis.location.origin).toString(),
      openGlossary: (termId) => {
        router.push(buildHref(termId), { scroll: false });
      },
    };
  }, [buildHref, isOpen, pathname, router, searchParameters]);

  const entry = openTermId === null ? undefined : termsDefinitions[openTermId];

  return (
    <GlossaryContext.Provider value={value}>
      {children}
      <InfoDialog
        definition={entry?.definition ?? ""}
        onClose={value.closeGlossary}
        open={isOpen}
        term={entry?.term ?? ""}
      />
    </GlossaryContext.Provider>
  );
};

/**
 * Reads the glossary controls.
 *
 * @returns Open, close, and link helpers.
 * @throws When used outside {@link GlossaryProvider}.
 */
export const useGlossary = (): GlossaryContextValue => {
  const context = useContext(GlossaryContext);

  if (context === null) {
    throw new Error("useGlossary must be used within a GlossaryProvider");
  }

  return context;
};
`;

const GLOSSARY_SEARCH = `import { useDeferredValue, useMemo } from "react";

import type { GlossaryTermId } from "@/contexts/GlossaryContext";

import { termsDefinitions } from "@/lib/termsDefinitions";

export interface GlossaryMatch {
  readonly category: string;
  readonly definition: string;
  readonly id: GlossaryTermId;
  /** Where it matched, so results can be ordered and highlighted. */
  readonly matchedIn: "definition" | "shortForm" | "term";
  readonly term: string;
}

/**
 * Every spelling someone might type for one entry.
 *
 * @param term - The entry's title, brackets included.
 * @returns Lower-cased spellings.
 *
 * @remarks
 * Mirrors how \`GlossaryText\` finds terms in page copy on purpose. A word the
 * tooltips can find in a sentence should also be findable in search, or the two
 * disagree about what the glossary contains.
 */
const spellingsFor = (term: string): readonly string[] => {
  const spellings = new Set<string>([term.toLowerCase()]);
  const withoutBrackets = term.replaceAll(/\\s*\\([^)]*\\)/gu, "").trim();

  if (withoutBrackets.length > 0) {
    spellings.add(withoutBrackets.toLowerCase());
  }

  for (const [, inside] of term.matchAll(/\\(([^)]+)\\)/gu)) {
    for (const part of inside.split(/\\s+or\\s+|\\s+aka\\s+|,/u)) {
      const candidate = part.trim().replace(/\\.$/u, "").toLowerCase();

      if (candidate.length >= 2 && !candidate.startsWith("aka")) {
        spellings.add(candidate);
      }
    }
  }

  return [...spellings];
};

/** Built once — the vocabulary is a constant, not state. */
const searchIndex = Object.entries(termsDefinitions).map(([id, entry]) => ({
  category: entry.category,
  definition: entry.definition,
  definitionText: entry.definition.toLowerCase(),
  id: id as GlossaryTermId,
  spellings: spellingsFor(entry.term),
  term: entry.term,
}));

/**
 * Filters the glossary by text and category.
 *
 * @param query - What the user typed. Empty returns everything.
 * @param categories - Selected groups. Empty means no restriction.
 * @returns Matches, closest first.
 *
 * @remarks
 * \`useDeferredValue\` keeps typing smooth without a debounce timer: React shows
 * the previous list while the next one is built, so there is no delay to tune
 * and no moment where the box feels stuck. Filtering a hundred entries is free;
 * redrawing the results is what costs, which is what deferring covers (GLO-09).
 *
 * Order matters: someone typing "proxy" wants the Proxy entry, not the twenty
 * definitions that happen to mention proxies.
 */
export const useGlossarySearch = (
  query: string,
  categories: readonly string[]
): readonly GlossaryMatch[] => {
  const deferredQuery = useDeferredValue(query);

  return useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const inCategory = (category: string): boolean =>
      categories.length === 0 || categories.includes(category);
    const matches: GlossaryMatch[] = [];

    for (const entry of searchIndex) {
      if (!inCategory(entry.category)) {
        continue;
      }

      const matchedIn =
        needle.length === 0 || entry.spellings.some((s) => s.startsWith(needle))
          ? "term"
          : entry.spellings.some((s) => s.includes(needle))
            ? "shortForm"
            : entry.definitionText.includes(needle)
              ? "definition"
              : null;

      if (matchedIn !== null) {
        matches.push({
          category: entry.category,
          definition: entry.definition,
          id: entry.id,
          matchedIn,
          term: entry.term,
        });
      }
    }

    const rank = { definition: 2, shortForm: 1, term: 0 };

    return matches.sort(
      (first, second) =>
        rank[first.matchedIn] - rank[second.matchedIn] ||
        first.term.localeCompare(second.term)
    );
  }, [categories, deferredQuery]);
};
`;

const DISPLAY_MODE_SPEC = `import { expect, test } from "@playwright/test";

const TABULATION = "/WEN/meeting/wen-special-meeting-2026/tabulation";

const displayControl = (page: import("@playwright/test").Page) =>
  page.getByRole("group", { name: "Tabulation display format" });

test("percentage is the default for a new user", async ({ page }) => {
  await page.goto(TABULATION);

  await expect(
    displayControl(page).getByRole("button", { name: "Percentage" })
  ).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });
});

test("switching to count changes every figure on the page", async ({ page }) => {
  await page.goto(TABULATION);
  await expect(page.getByTestId("vote-matrix-total-web")).toBeVisible({
    timeout: 30_000,
  });

  await displayControl(page).getByRole("button", { name: "Count" }).click();

  // A percentage-formatted total would still contain "%".
  await expect(page.getByTestId("vote-matrix-total-web")).not.toContainText("%");
  await expect(page.getByTestId("tracker-total-positions")).not.toContainText("%");
});

test("the choice survives a reload", async ({ page }) => {
  await page.goto(TABULATION);
  await displayControl(page).getByRole("button", { name: "Count" }).click();

  await page.reload();

  await expect(
    displayControl(page).getByRole("button", { name: "Count" })
  ).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });
});

test("the choice carries to another meeting", async ({ page }) => {
  await page.goto(TABULATION);
  await displayControl(page).getByRole("button", { name: "Count" }).click();

  await page.goto("/WEN/meeting/wen-annual-meeting-2025/tabulation");

  await expect(
    displayControl(page).getByRole("button", { name: "Count" })
  ).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });
});

test("a shared link overrides without changing the saved choice", async ({ page }) => {
  await page.goto(TABULATION);
  await displayControl(page).getByRole("button", { name: "Count" }).click();

  await page.goto(\`\${TABULATION}?display=percentages\`);
  await expect(
    displayControl(page).getByRole("button", { name: "Percentage" })
  ).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });

  // The link is a view, not a preference change.
  await page.goto(TABULATION);
  await expect(
    displayControl(page).getByRole("button", { name: "Count" })
  ).toHaveAttribute("aria-pressed", "true");
});

test("dates and statuses are unaffected by the format", async ({ page }) => {
  await page.goto("/WEN/meeting/wen-special-meeting-2026/dashboard");
  const recordDate = page.getByTestId("key-date-recorddate");
  await expect(recordDate).toBeVisible({ timeout: 30_000 });

  const before = await recordDate.textContent();
  await displayControl(page).getByRole("button", { name: "Count" }).click();

  await expect(recordDate).toHaveText(before ?? "");
});

test("percentage mode never shows a figure divided by itself", async ({ page }) => {
  await page.goto(TABULATION);
  const centre = page.getByTestId("shares-voted-centre");
  await expect(centre).toBeVisible({ timeout: 30_000 });

  await expect(centre).not.toHaveText("100.00%");
});
`;

const GLOSSARY_SPEC = `import { expect, test } from "@playwright/test";

const MEETING = "/WEN/meeting/wen-special-meeting-2026/tabulation";

const drawer = (page: import("@playwright/test").Page) =>
  page.getByRole("dialog", { name: "Terms and Definitions" });

test("the support menu opens the glossary drawer", async ({ page }) => {
  await page.goto(MEETING);

  await page.getByRole("button", { name: "Issuer Support Tools" }).click();
  await page.getByRole("menuitem", { name: "Glossary of Terms" }).click();

  await expect(drawer(page)).toBeVisible({ timeout: 30_000 });
});

test("clicking a term opens the drawer on that term", async ({ page }) => {
  await page.goto(MEETING);

  await page.getByRole("button", { name: /^Quorum/ }).first().click();

  await expect(drawer(page)).toBeVisible({ timeout: 30_000 });
  await expect(drawer(page).getByRole("heading", { name: "Quorum" })).toBeVisible();
  await expect(page).toHaveURL(/glossary=quorum/);
});

test("the drawer keeps the page behind it", async ({ page }) => {
  await page.goto(MEETING);
  await page.getByRole("button", { name: /^Quorum/ }).first().click();
  await expect(drawer(page)).toBeVisible({ timeout: 30_000 });

  await expect(page.getByRole("heading", { name: "Voting Activity" })).toBeVisible();
});

test("escape closes the drawer and returns focus to the term", async ({ page }) => {
  await page.goto(MEETING);
  const term = page.getByRole("button", { name: /^Quorum/ }).first();
  await term.click();
  await expect(drawer(page)).toBeVisible({ timeout: 30_000 });

  await page.keyboard.press("Escape");

  await expect(drawer(page)).toBeHidden();
  await expect(term).toBeFocused();
  await expect(page).not.toHaveURL(/glossary=/);
});

test("a shared link opens straight to the term", async ({ page }) => {
  await page.goto(\`\${MEETING}?glossary=brokernonvote\`);

  await expect(
    drawer(page).getByRole("heading", { name: "Broker Non-vote" })
  ).toBeVisible({ timeout: 30_000 });
});

test("a stale link opens the glossary rather than erroring", async ({ page }) => {
  await page.goto(\`\${MEETING}?glossary=not-a-real-term\`);

  await expect(drawer(page)).toBeVisible({ timeout: 30_000 });
  await expect(drawer(page)).toContainText(/not found|choose a term/i);
});

test("search matches short forms and definition text", async ({ page }) => {
  await page.goto(\`\${MEETING}?glossary=quorum\`);
  const search = drawer(page).getByRole("searchbox");

  await search.fill("nobo");
  await expect(
    drawer(page).getByRole("treeitem", { name: /Non-Objecting Beneficial Owner/ })
  ).toBeVisible();

  await search.fill("cede & co.");
  await expect(
    drawer(page).getByRole("treeitem", { name: /Cede and Company/ })
  ).toBeVisible();
});

test("terms inside a definition link to their own entry", async ({ page }) => {
  await page.goto(\`\${MEETING}?glossary=brokernonvote\`);

  await drawer(page).getByRole("button", { name: /^Routine Proposal/ }).click();

  await expect(
    drawer(page).getByRole("heading", { name: "Routine Proposal" })
  ).toBeVisible();
});

test("a term inside a chart legend does not open the glossary", async ({ page }) => {
  await page.goto(MEETING);
  await page.getByTestId("outcome-holder-legend-beneficial").click();

  await expect(drawer(page)).toBeHidden();
});
`;

export const CODE_SAMPLES: readonly CodeSample[] = [
  {
    asBuilt: true,
    code: GLOSSARY_AS_BUILT,
    filename: "components/InfoDialog.tsx",
    language: "tsx",
    satisfies: ["GLO-01", "TIP-05"],
    sectionId: "glossary-formatting",
    title: "The glossary that ships today (abridged)",
  },
  {
    asBuilt: true,
    code: GLOSSARY_TOOLTIP_SOURCE,
    filename: "components/ui/GlossaryToolTip.tsx",
    language: "tsx",
    satisfies: ["TIP-01", "TIP-03", "TIP-06", "TIP-07"],
    sectionId: "tooltips-glossary-navigation",
    title: "The marker itself — hover for the definition, click for the drawer",
  },
  {
    asBuilt: true,
    code: GLOSSARY_TEXT_SOURCE,
    filename: "components/ui/GlossaryText.tsx",
    language: "tsx",
    satisfies: ["TIP-01", "TIP-02", "TIP-08"],
    sectionId: "tooltips-glossary-navigation",
    title: "Finding the terms inside ordinary copy",
  },
  {
    code: PERSISTED_DISPLAY_MODE,
    filename: "contexts/TabulationDisplayContext.tsx",
    language: "tsx",
    satisfies: ["PCT-01", "PCT-04", "PCT-05"],
    sectionId: "percentage-count-toggle",
    title: "Remembering the chosen format",
  },
  {
    code: METRIC_FORMATTER,
    filename: "utils/tabulation-display.ts",
    language: "typescript",
    satisfies: ["PCT-03", "PCT-07", "PCT-08", "PCT-11"],
    sectionId: "percentage-count-toggle",
    title: "Formatting a figure with a named base",
  },
  {
    code: DISPLAY_MODE_SPEC,
    filename: "tests/e2e/display-mode.spec.ts",
    language: "typescript",
    satisfies: ["PCT-04", "PCT-05", "PCT-06", "PCT-08"],
    sectionId: "percentage-count-toggle",
    title: "Playwright coverage",
  },
  {
    code: GLOSSARY_DEEP_LINK,
    filename: "contexts/GlossaryContext.tsx",
    language: "tsx",
    satisfies: ["TIP-04", "TIP-05", "GLO-06"],
    sectionId: "tooltips-glossary-navigation",
    title: "Shareable links, still the same drawer",
  },
  {
    code: GLOSSARY_SPEC,
    filename: "tests/e2e/glossary.spec.ts",
    language: "typescript",
    satisfies: ["TIP-03", "TIP-04", "TIP-05", "GLO-02", "GLO-04"],
    sectionId: "tooltips-glossary-navigation",
    title: "Playwright coverage",
  },
  {
    code: GLOSSARY_SEARCH,
    filename: "hooks/useGlossarySearch.ts",
    language: "typescript",
    satisfies: ["GLO-02", "GLO-03", "GLO-09"],
    sectionId: "glossary-formatting",
    title: "Search that also looks inside definitions",
  },
];
