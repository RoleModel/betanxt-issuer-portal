/**
 * Reference implementations attached to the requirements.
 *
 * @remarks
 * These are specification artefacts, not live code — they are stored as strings
 * so the page can render and download them without the build compiling them.
 * They exist because the requirements above make claims that are cheap to write
 * and expensive to interpret ("persist the selection", "deep link every term"),
 * and an engineer estimating the work should not have to guess at the shape.
 *
 * Each sample is deliberately complete enough to paste and compile against the
 * portal's existing helpers, and deliberately narrow enough that reviewing one
 * is a five-minute job rather than a design exercise.
 */

import type { CodeLanguage } from "@/components/Specs/highlight";

export interface CodeSample {
  readonly code: string;
  readonly filename: string;
  readonly language: CodeLanguage;
  /** Requirement ids this sample satisfies, for traceability. */
  readonly satisfies: readonly string[];
  /** Which spec section the sample belongs under. */
  readonly sectionId: string;
  readonly title: string;
}

const PERSISTED_DISPLAY_MODE = `"use client";

import type { PropsWithChildren } from "react";

import { useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type TabulationDisplayMode = "numbers" | "percentages";

const STORAGE_KEY = "issuer-portal.tabulation-display-mode";
const DEFAULT_MODE: TabulationDisplayMode = "percentages";

interface TabulationDisplayContextValue {
  readonly displayMode: TabulationDisplayMode;
  readonly setDisplayMode: (mode: TabulationDisplayMode) => void;
}

const TabulationDisplayContext =
  createContext<TabulationDisplayContextValue | null>(null);

const isDisplayMode = (value: unknown): value is TabulationDisplayMode =>
  value === "numbers" || value === "percentages";

/**
 * Reads the stored preference, tolerating every way storage can be unavailable.
 *
 * @returns The saved mode, or the default when nothing usable is stored.
 *
 * @remarks
 * Private browsing and blocked-cookie configurations make \`localStorage\` throw
 * on access rather than return null, so the read is guarded rather than
 * null-checked. A corrupt value is treated as absent instead of trusted, which
 * matters because the value is written by an older build in the upgrade case.
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
 * Owns the display mode for every tabulation figure in the tree.
 *
 * @remarks
 * Three inputs feed one value, in ascending precedence: the default, the user's
 * stored preference, and a \`?display=\` query parameter. The query parameter is
 * deliberately *not* written back to storage — it exists so a link can show a
 * colleague a specific reading without silently changing how their portal
 * behaves afterwards.
 *
 * Hydration is the reason the stored value is read in an effect rather than in
 * the initial state: the server render has no access to \`localStorage\`, and
 * seeding state from it directly produces a hydration mismatch on every load.
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
      // A user who blocks storage still gets the toggle for this session.
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
 * Reads the current display mode.
 *
 * @returns The mode and its setter.
 * @throws When called outside {@link TabulationDisplayProvider}.
 */
export const useTabulationDisplay = (): TabulationDisplayContextValue => {
  const context = useContext(TabulationDisplayContext);

  if (context === null) {
    throw new Error(
      "useTabulationDisplay must be used within a TabulationDisplayProvider"
    );
  }

  return context;
};
`;

const METRIC_FORMATTER = `import type { TabulationDisplayMode } from "@/contexts/TabulationDisplayContext";

/** Every denominator a tabulation percentage is allowed to use. */
export type DenominatorKind =
  | "brokerTotal"
  | "holderTypeTotal"
  | "mailingPositions"
  | "proposalVotedShares"
  | "sharesOutstanding"
  | "totalPositions"
  | "votedShares";

/**
 * Human-readable label for each denominator, shown in percentage tooltips.
 *
 * @remarks
 * PCT-03 requires the base to be visible wherever a percentage is. Keeping the
 * labels beside the type means a new denominator cannot be added without also
 * deciding what to call it in front of an issuer.
 */
export const DENOMINATOR_LABELS: Record<DenominatorKind, string> = {
  brokerTotal: "of this broker's votes",
  holderTypeTotal: "of this holder type's votes",
  mailingPositions: "of mailing positions",
  proposalVotedShares: "of shares voted on this proposal",
  sharesOutstanding: "of shares outstanding",
  totalPositions: "of total positions",
  votedShares: "of shares voted",
};

export interface TabulationMetric {
  /** The reading the user did not choose, for the tooltip. */
  readonly alternate: string;
  /** The reading matching the current display mode. */
  readonly display: string;
  /** Fully-formed tooltip text, denominator included. */
  readonly tooltip: string;
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

/**
 * Formats one figure for both readings and builds its tooltip.
 *
 * @param value - The count. Always the raw quantity, never a pre-scaled one.
 * @param total - The denominator, chosen from {@link DenominatorKind}.
 * @param displayMode - Which reading the user has selected.
 * @param denominator - Names the base, so the tooltip can state it.
 * @returns The display string, the alternate string, and the tooltip.
 *
 * @remarks
 * A zero total yields \`0.00%\` rather than \`NaN\` or a thrown error: an empty
 * meeting is a normal state early in a proxy cycle, not an exceptional one, and
 * a dashboard that errors before any votes arrive is worse than one that reads
 * zero.
 *
 * Callers must pass the true underlying value even when a chart inflates small
 * slices for legibility (PCT-10) — the geometry and the label are different
 * concerns and reading the label off the geometry is how percentages stop
 * summing to 100.
 */
export const formatTabulationMetric = (
  value: number,
  total: number,
  displayMode: TabulationDisplayMode,
  denominator: DenominatorKind = "sharesOutstanding"
): TabulationMetric => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const percentageText = \`\${percentage.toFixed(2)}%\`;
  const countText = numberFormatter.format(value);
  const isNumbers = displayMode === "numbers";

  return {
    alternate: isNumbers ? percentageText : countText,
    display: isNumbers ? countText : percentageText,
    tooltip: \`\${countText} of \${numberFormatter.format(total)} — \${percentageText} \${DENOMINATOR_LABELS[denominator]}\`,
  };
};
`;

const GLOSSARY_ROUTE = `import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { GlossaryBrowser } from "@/components/Glossary/GlossaryBrowser";
import { termsDefinitions } from "@/lib/termsDefinitions";

interface GlossaryPageProps {
  readonly params: Promise<{ readonly termId?: readonly string[] }>;
}

/**
 * Pre-renders one path per term so every deep link is a static route.
 *
 * @returns One params object per glossary entry, plus the index route.
 *
 * @remarks
 * The vocabulary is a compile-time constant of about a hundred entries, so
 * generating them all costs nothing and buys an instant response for the link
 * someone pasted into an email — which is the whole point of TIP-04.
 */
export const generateStaticParams = (): { termId: string[] }[] => [
  { termId: [] },
  ...Object.keys(termsDefinitions).map((id) => ({ termId: [id] })),
];

/**
 * Titles the tab with the term itself, so a bookmark is self-describing.
 */
export const generateMetadata = async ({
  params,
}: GlossaryPageProps): Promise<Metadata> => {
  const { termId } = await params;
  const entry = termId?.[0] === undefined ? undefined : termsDefinitions[termId[0]];

  return {
    description: entry?.definition ?? "Definitions of proxy and shareholder meeting terms.",
    title: entry === undefined ? "Glossary of Terms" : \`\${entry.term} — Glossary\`,
  };
};

const GlossaryPage = async ({ params }: GlossaryPageProps) => {
  const { termId } = await params;
  const selectedId = termId?.[0];

  // An unknown id is a broken bookmark, not a server error — but it must not
  // render the index silently, or the reader thinks the term was removed.
  if (selectedId !== undefined && termsDefinitions[selectedId] === undefined) {
    notFound();
  }

  return <GlossaryBrowser selectedTermId={selectedId} />;
};

export default GlossaryPage;
`;

const GLOSSARY_SEARCH = `import { useDeferredValue, useMemo } from "react";

import type { GlossaryTermId } from "@/contexts/GlossaryContext";

import { termsDefinitions } from "@/lib/termsDefinitions";

export interface GlossaryMatch {
  readonly category: string;
  readonly definition: string;
  readonly id: GlossaryTermId;
  /** Where the query matched, so the UI can highlight it. */
  readonly matchedIn: "alias" | "definition" | "term";
  readonly term: string;
}

/**
 * Every spelling a reader might type for one entry.
 *
 * @param term - The entry's display term, parentheticals included.
 * @returns Lower-cased searchable spellings.
 *
 * @remarks
 * Mirrors the alias derivation in \`GlossaryText\` on purpose: a term the
 * tooltip engine can find in prose must also be findable in search, or the two
 * surfaces disagree about what the glossary contains.
 */
const searchableSpellings = (term: string): readonly string[] => {
  const spellings = new Set<string>([term.toLowerCase()]);
  const withoutParentheticals = term.replaceAll(/\\s*\\([^)]*\\)/gu, "").trim();

  if (withoutParentheticals.length > 0) {
    spellings.add(withoutParentheticals.toLowerCase());
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

/** Built once — the vocabulary is a module constant, not state. */
const searchIndex = Object.entries(termsDefinitions).map(([id, entry]) => ({
  category: entry.category,
  definition: entry.definition,
  definitionText: entry.definition.toLowerCase(),
  id: id as GlossaryTermId,
  spellings: searchableSpellings(entry.term),
  term: entry.term,
}));

/**
 * Filters the glossary by free text and category.
 *
 * @param query - Raw text from the search field. Empty returns everything.
 * @param categories - Selected category filters. Empty means no restriction.
 * @returns Matches ordered term-first, then alias, then definition-body.
 *
 * @remarks
 * \`useDeferredValue\` keeps typing responsive without a debounce timer: React
 * renders the stale list while the new one computes, so there is no interval
 * during which the field feels frozen and no timeout to tune. At roughly a
 * hundred entries the filter itself is trivial; it is re-rendering the cards
 * that costs, which is exactly what deferring addresses (GLO-10).
 *
 * Ordering encodes intent — someone typing "proxy" wants the Proxy entry, not
 * the twenty definitions that mention proxies.
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
            ? "alias"
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

    const rank = { alias: 1, definition: 2, term: 0 };

    return matches.sort(
      (first, second) =>
        rank[first.matchedIn] - rank[second.matchedIn] ||
        first.term.localeCompare(second.term)
    );
  }, [categories, deferredQuery]);
};
`;

const ACCEPTANCE_FEATURE = `Feature: Percentage and Count display mode
  As an issuer reviewing tabulation results
  I want to switch every figure between percentages and counts
  So that I can read the summary at a glance and reconcile the detail on demand

  Background:
    Given I am signed in as an issuer contact
    And meeting "WEN Annual Meeting 2025" has 2,664,000 shares outstanding
    And 1,204,336 shares have been voted

  Scenario: Percentage is the default for a new user
    Given I have never used the display control
    When I open the meeting dashboard
    Then the display control shows "Percentage" as selected
    And "Shares Voted" reads "45.21%"

  Scenario: Every convertible figure follows the control
    Given I am on the meeting dashboard
    When I select "Count"
    Then "Shares Voted" reads "1,204,336"
    And "Total Positions" reads a count
    And "Positions Voted" reads a count
    And the vote progress bar labels read counts

  Scenario: The selection survives a reload
    Given I have selected "Count"
    When I reload the page
    Then the display control shows "Count" as selected

  Scenario: The selection carries across meetings
    Given I have selected "Count" on meeting "WEN Annual Meeting 2025"
    When I open meeting "WEN Special Meeting 2026"
    Then the display control shows "Count" as selected

  Scenario: A shared link overrides without overwriting
    Given my stored preference is "Count"
    When I open a link ending in "?display=percentages"
    Then figures read as percentages
    And my stored preference is still "Count"

  Scenario: Non-convertible figures are unaffected
    Given I am on the meeting dashboard
    When I switch between "Percentage" and "Count"
    Then "Record Date" is unchanged
    And "Days to Meeting" is unchanged
    And the quorum status chip is unchanged

  Scenario: Both readings are always reachable
    Given the display control shows "Percentage"
    When I hover "Shares Voted"
    Then a tooltip reads "1,204,336 of 2,664,000 — 45.21% of shares outstanding"

  Scenario Outline: Percentages sum correctly despite minimum-arc floors
    Given proposal 1 has a slice smaller than the minimum arc
    When I select "Percentage"
    Then the "<chart>" slice labels sum to 100.00% within 0.02%

    Examples:
      | chart                    |
      | Shares Voted             |
      | Vote Distribution        |
      | Beneficial vs Registered |

  Scenario: Exports ignore the display mode
    Given the display control shows "Percentage"
    When I export positions to Excel
    Then the "Shares Voted" column contains raw counts
`;

const GLOSSARY_ACCEPTANCE = `Feature: Glossary navigation and deep linking
  As someone reading the portal mid-task
  I want to look up a term without losing my place
  So that I can keep working and share the definition with a colleague

  Scenario: Hover explains, click navigates
    Given I am on the tabulation page
    When I hover the term "Quorum"
    Then its definition appears in a tooltip
    When I click the term "Quorum"
    Then the glossary opens focused on "Quorum"
    And the address bar reads "/glossary/quorum"

  Scenario: Context is preserved on desktop
    Given I am on a viewport of 1440 pixels
    When I click a glossary term
    Then a side panel opens beside the page
    And the page behind it is still rendered
    When I press Escape
    Then the panel closes
    And focus returns to the term I clicked

  Scenario: A deep link lands on the entry
    When I open "/glossary/brokernonvote" directly
    Then the "Broker Non-vote" entry is scrolled into view
    And it is briefly highlighted

  Scenario: A retired term fails clearly
    When I open "/glossary/not-a-real-term"
    Then I see a not-found message with a link to the glossary index
    And I do not see a server error

  Scenario: Search finds the shorthand the interface uses
    Given I am on the glossary page
    When I search for "nobo"
    Then "Non-Objecting Beneficial Owner (NOBO)" is the first result
    When I search for "cede & co."
    Then "Cede and Company" appears in the results

  Scenario: Filters compose with search and survive sharing
    Given I am on the glossary page
    When I select the "Proxy & Voting" category
    And I search for "vote"
    Then only "Proxy & Voting" entries containing "vote" are listed
    And a result count is shown
    When I copy the URL and open it in a new tab
    Then the same filter and query are applied

  Scenario: Terms inside a control keep hover only
    Given a chart legend labelled "Beneficial"
    When I click the legend item
    Then the legend series toggles
    And the glossary does not open

  Scenario: Keyboard and screen reader access
    Given I am navigating with a keyboard
    When I Tab to a glossary term marker
    Then the definition is shown
    And the focus ring is visible
    And the marker is announced as "Quorum — open glossary definition"

  Scenario: Mobile deep link is not hidden behind the search field
    Given I am on a viewport of 375 pixels
    When I open "/glossary/recorddate" directly
    Then the "Record Date" entry is visible below the pinned search field
`;

export const CODE_SAMPLES: readonly CodeSample[] = [
  {
    code: PERSISTED_DISPLAY_MODE,
    filename: "contexts/TabulationDisplayContext.tsx",
    language: "tsx",
    satisfies: ["PCT-01", "PCT-04", "PCT-05"],
    sectionId: "percentage-count-toggle",
    title: "Persisted display mode with query-parameter override",
  },
  {
    code: METRIC_FORMATTER,
    filename: "utils/tabulation-display.ts",
    language: "typescript",
    satisfies: ["PCT-03", "PCT-07", "PCT-08", "PCT-11"],
    sectionId: "percentage-count-toggle",
    title: "Metric formatter with a declared denominator",
  },
  {
    code: ACCEPTANCE_FEATURE,
    filename: "tests/display-mode.feature",
    language: "gherkin",
    satisfies: ["PCT-04", "PCT-05", "PCT-06", "PCT-10", "PCT-12"],
    sectionId: "percentage-count-toggle",
    title: "Acceptance criteria as executable scenarios",
  },
  {
    code: GLOSSARY_ROUTE,
    filename: "app/glossary/[[...termId]]/page.tsx",
    language: "tsx",
    satisfies: ["TIP-04", "TIP-05", "TIP-08"],
    sectionId: "tooltips-glossary-navigation",
    title: "Deep-linkable glossary route",
  },
  {
    code: GLOSSARY_ACCEPTANCE,
    filename: "tests/glossary-navigation.feature",
    language: "gherkin",
    satisfies: ["TIP-03", "TIP-04", "TIP-05", "TIP-06", "TIP-07"],
    sectionId: "tooltips-glossary-navigation",
    title: "Acceptance criteria as executable scenarios",
  },
  {
    code: GLOSSARY_SEARCH,
    filename: "hooks/useGlossarySearch.ts",
    language: "typescript",
    satisfies: ["GLO-03", "GLO-04", "GLO-10"],
    sectionId: "glossary-formatting",
    title: "Alias-aware glossary search",
  },
];
