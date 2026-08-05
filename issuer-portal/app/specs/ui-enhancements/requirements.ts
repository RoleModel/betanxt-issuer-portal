/**
 * Business and functional requirements for the three requested UI enhancements.
 *
 * @remarks
 * Content lives in a typed module rather than MDX or a CMS because it is the
 * deliverable itself: the page renders it, the download button serialises it,
 * and both have to say exactly the same thing. Keeping it as data means the two
 * representations cannot drift, and a reviewer can diff a requirement change in
 * a pull request the same way they would diff code.
 *
 * Every "as built" claim below was read out of the codebase at the paths named
 * in `evidence`, so estimates can be checked against source rather than memory.
 */

/** How settled a requirement is — drives the badge colour on the page. */
export type RequirementStatus = "confirmed" | "decision-needed" | "proposed";

export interface Requirement {
  /** Stable id used in tickets, e.g. `PCT-04`. Never renumber these. */
  readonly id: string;
  /** Given/When/Then lines an engineer can turn into a Playwright spec. */
  readonly acceptance: readonly string[];
  /** Files that establish the current behaviour this requirement changes. */
  readonly evidence?: readonly string[];
  /** Why the requirement exists, in business terms. Skip when self-evident. */
  readonly rationale?: string;
  /** The requirement itself, written as a single testable sentence. */
  readonly statement: string;
  readonly status: RequirementStatus;
  /** Short label for the requirement, used as the list heading. */
  readonly title: string;
}

export interface SpecTable {
  readonly caption?: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly title: string;
}

export interface OpenQuestion {
  /** Who has to answer it — product, BetaNXT ops, or engineering. */
  readonly owner: string;
  readonly question: string;
  /** The answer to assume if nobody responds before the estimate is due. */
  readonly recommendation: string;
}

export interface SpecSection {
  readonly id: string;
  /** Ordered narrative paragraphs introducing the epic. */
  readonly background: readonly string[];
  readonly openQuestions?: readonly OpenQuestion[];
  readonly requirements: readonly Requirement[];
  /** One-line summary shown in the section rail. */
  readonly summary: string;
  readonly tables?: readonly SpecTable[];
  readonly title: string;
}

/* -------------------------------------------------------------------------- */
/* 1. Percentage vs. Count toggle                                             */
/* -------------------------------------------------------------------------- */

const percentageToggle: SpecSection = {
  id: "percentage-count-toggle",
  title: "1. Percentage vs. Count toggle",
  summary:
    "Extend the existing display-mode toggle to every tabulation figure, fix five inherited denominator defects, and decide the export contract.",
  background: [
    'The toggle is not a greenfield build. A global control already ships: `TabulationDisplayContext` holds a `displayMode` of `"numbers" | "percentages"`, `formatTabulationMetric(value, total, displayMode)` renders both readings, and the meeting navigation bar exposes a `Display as: Percentage | Count` button group. Eleven widgets already honour it.',
    "What is missing is coverage and consistency. The provider is mounted only on the `meeting` and `past-meeting` layouts, so nothing on `/[clientTicker]/reporting` can participate — `useTabulationDisplay()` throws outside the provider, and `PositionsVotedChart` carries a code comment saying so. Several widgets inside the covered routes still hard-code one representation, and four widgets compute a percentage against a denominator that is either wrong or equal to the numerator.",
    "The business risk is not the missing feature, it is the mixed one. A card that shows `Total Positions` as a raw count next to `Positions Voted` as a percentage reads as a data error to an issuer, and three different denominators are currently in use for the same share figures — total outstanding, total voted, and per-proposal total voted. Naming one denominator per metric is the substantive work in this epic; wiring the control is comparatively cheap.",
  ],
  requirements: [
    {
      id: "PCT-01",
      title: "Single source of display mode",
      status: "confirmed",
      statement:
        "All percentage/count switching must read from the existing `TabulationDisplayContext`; no widget may introduce its own local percent/count state.",
      rationale:
        "Two toggles that disagree is worse than one toggle with gaps. A reader comparing a chart to the table beside it must never see two different modes on one screen.",
      evidence: [
        "contexts/TabulationDisplayContext.tsx",
        "utils/tabulation-display.ts",
      ],
      acceptance: [
        "Given a user switches the control to Count, when they scroll the page, then every convertible figure on that page reads as a count with no per-widget exception.",
        "Given a developer adds a new tabulation widget, when it renders a convertible metric without calling `formatTabulationMetric`, then the lint rule added under PCT-14 fails the build.",
      ],
    },
    {
      id: "PCT-02",
      title: "Provider coverage for reporting routes",
      status: "confirmed",
      statement:
        "`TabulationDisplayProvider` must wrap `/[clientTicker]/reporting` and `/[clientTicker]/past-meetings`, and each of those pages must render its own display control in the page header.",
      rationale:
        "Reporting is where issuers compare across meetings, which is precisely where a percentage view earns its keep. It is currently the only major surface that cannot show one.",
      evidence: [
        "app/[clientTicker]/reporting/layout.tsx",
        "app/[clientTicker]/meeting/layout.tsx",
        "components/Reporting/PositionsVotedChart.tsx",
      ],
      acceptance: [
        "Given a user opens the Reporting page, when the page renders, then a `Display as: Percentage | Count` control appears in the page header.",
        "Given a user changes the mode on Reporting, when they navigate to a meeting Tabulation page, then the mode they chose is still in effect.",
        "Given any widget on Reporting calls `useTabulationDisplay()`, when the page mounts, then no provider error is thrown.",
      ],
    },
    {
      id: "PCT-03",
      title: "Declared denominator per metric",
      status: "decision-needed",
      statement:
        "Every convertible metric must declare exactly one denominator from the approved denominator catalogue, and the chosen denominator must be named in the metric's tooltip when the mode is Percentage.",
      rationale:
        "`45.2%` is meaningless without its base. Three bases are already in use for the same share figures, and an issuer reading a percentage without knowing the base cannot reconcile it against a tabulation certificate.",
      evidence: [
        "utils/quorum.ts",
        "hooks/useTabulationInsights.ts",
        "utils/exportTabulationPdf.tsx",
      ],
      acceptance: [
        "Given the mode is Percentage, when a user hovers any percentage figure, then the tooltip states the count and the denominator label, e.g. `1,204,336 of 2,664,000 shares outstanding`.",
        "Given the denominator table in this spec, when engineering implements a widget, then the denominator used matches the table row for that metric.",
      ],
    },
    {
      id: "PCT-04",
      title: "Default state is Percentage",
      status: "confirmed",
      statement:
        'The default display mode for a user with no saved preference is Percentage, matching the current `useState<TabulationDisplayMode>("percentages")` default.',
      rationale:
        "Percentage is the reading that answers the question an issuer opens the portal with — are we at quorum. The count is the audit trail, reached on demand.",
      evidence: ["contexts/TabulationDisplayContext.tsx"],
      acceptance: [
        "Given a user who has never used the control, when they open any tabulation surface, then Percentage is selected.",
      ],
    },
    {
      id: "PCT-05",
      title: "Selection persists across navigation and sessions",
      status: "confirmed",
      statement:
        "The chosen mode must survive client-side navigation, a full page reload, and a new session on the same browser, scoped per user rather than per meeting.",
      rationale:
        "Today the mode resets to Percentage on every reload. A tabulation analyst who works in counts re-clicks the control dozens of times a day.",
      evidence: ["contexts/TabulationDisplayContext.tsx"],
      acceptance: [
        "Given a user selects Count, when they reload the browser, then Count is still selected.",
        "Given a user selects Count on meeting A, when they open meeting B, then Count is still selected.",
        "Given a user opens a shared URL containing `?display=numbers`, when the page loads, then Count is applied for that view without overwriting their stored preference.",
        "Given storage is unavailable (private mode, blocked cookies), when the page loads, then the default applies and no error surfaces.",
      ],
    },
    {
      id: "PCT-06",
      title: "Non-convertible metrics are exempt and never blank",
      status: "confirmed",
      statement:
        "Dates, durations, statuses, categories, identifiers, ratios, and document counts must render identically in both modes.",
      evidence: [
        "components/Meeting/KeyDatesCard.tsx",
        "components/Tabulation/PositionsTable.tsx",
      ],
      acceptance: [
        "Given the mode is Percentage, when a user views Key Dates, Vote Status, Management Recommendation, CUSIP, Days to Meeting, or the quorum status chip, then each renders exactly as it does in Count mode.",
        "Given the mode is Percentage, when a user views a numeric form input in an upload dialog, then the field still accepts and displays a raw count.",
      ],
    },
    {
      id: "PCT-07",
      title: "Both readings always available",
      status: "confirmed",
      statement:
        "Every converted figure must expose the alternate reading on hover and to assistive technology, using the `alternate` value `formatTabulationMetric` already returns.",
      rationale:
        "Removes the need to switch modes to answer a one-off question, and is the pattern `HistoricalShareCard` already demonstrates.",
      evidence: [
        "components/Meeting/tabulation-tracker/HistoricalShareCard.tsx",
        "components/Meeting/VotingTabulationTable.tsx",
      ],
      acceptance: [
        "Given any converted figure, when a user hovers or focuses it, then the alternate reading appears in a tooltip.",
        "Given a screen reader user, when focus lands on a converted figure, then the accessible name includes both readings.",
      ],
    },
    {
      id: "PCT-08",
      title: "Fix self-denominator defects",
      status: "confirmed",
      statement:
        "Metrics currently calling `formatTabulationMetric(total, total, displayMode)` must be given a real denominator so Percentage mode stops rendering a constant `100.00%`.",
      evidence: [
        "components/Tabulation/VotingActivityCard.tsx",
        "components/Meeting/SharesVotedChart.tsx",
      ],
      acceptance: [
        "Given the mode is Percentage, when a user views the Shares Voted donut centre, then the value is shares voted as a percentage of shares outstanding, not `100.00%`.",
        "Given the mode is Percentage, when a user views the Voting Activity donut centre, then the value is votes received as a percentage of eligible positions, not `100.00%`.",
      ],
    },
    {
      id: "PCT-09",
      title: "Fix hard-coded representations",
      status: "confirmed",
      statement:
        "Figures that hard-code a single representation must be converted: `Total Positions` in the tabulation tracker, `Total Shares Voted` and `BNV` in the tabulation table, the vote progress bar labels, and the holder-outcome centre tooltip.",
      evidence: [
        "components/Meeting/TabulationTracker.tsx",
        "components/Meeting/VotingTabulationTable.tsx",
        "components/Meeting/tabulation-tracker/VoteProgressBar.tsx",
        "components/Tabulation/HolderOutcomeChartCard.tsx",
      ],
      acceptance: [
        "Given the mode is Percentage, when a user views the tabulation tracker, then `Total Positions` and `Positions Voted` are both percentages.",
        "Given the mode is Count, when a user views the vote progress bar, then its labels read share counts rather than a rounded whole percent.",
        "Given the mode is Count, when a user views `Total Shares Voted` and `BNV`, then both render counts; given Percentage, both render a percentage of shares outstanding.",
      ],
    },
    {
      id: "PCT-10",
      title: "Chart geometry is independent of display mode",
      status: "confirmed",
      statement:
        "Minimum-arc and minimum-bar floors must continue to distort only the rendered geometry; every label, tooltip, and export must read from the true underlying value.",
      rationale:
        "Several charts inflate small slices for legibility. If a percentage were derived from the inflated value, the labels would not sum to 100.",
      evidence: [
        "components/Tabulation/HolderOutcomeChartCard.tsx",
        "components/Reporting/VoteDistributionChart.tsx",
        "components/Meeting/SharesVotedChart.tsx",
      ],
      acceptance: [
        "Given a chart with a minimum-arc floor, when the mode is Percentage, then the displayed percentages sum to 100.00% within rounding tolerance.",
      ],
    },
    {
      id: "PCT-11",
      title: "Rounding and precision",
      status: "confirmed",
      statement:
        'Percentages render to two decimal places; counts render with `Intl.NumberFormat("en-US")` grouping and no decimals for share and position quantities.',
      rationale:
        "Two decimals is what the tabulation certificate uses and what `formatTabulationMetric` already produces. Whole-percent rounding in the progress bar is the one place that disagrees and must be brought into line.",
      evidence: ["utils/tabulation-display.ts"],
      acceptance: [
        "Given a value of 45.2358%, when it renders, then it reads `45.24%`.",
        "Given a set of sibling percentages that round to 100.01%, when they render, then no reconciliation warning is shown and the underlying counts remain exact.",
      ],
    },
    {
      id: "PCT-12",
      title:
        "Exports remain counts, with both columns where the template allows",
      status: "decision-needed",
      statement:
        "CSV, XLSX, and PDF exports must always emit raw counts regardless of the on-screen mode, and templates that already carry percentage columns must keep them.",
      rationale:
        "Exports feed reconciliation and are archived as evidence. A file whose contents depend on a UI toggle set minutes earlier cannot be audited. The tabulation PDF already prints `Vote Submitted`, `% of Outstanding`, `% of Total Voted`, and `% of Proposal Votes` together, which is the pattern to standardise on.",
      evidence: [
        "utils/exportTabulationPdf.tsx",
        "utils/exportPositionsXlsx.ts",
        "components/Reporting/DownloadReportsTable.tsx",
      ],
      acceptance: [
        "Given the mode is Percentage, when a user exports positions to Excel, then the file contains raw share counts.",
        "Given any export, when it is opened, then a footer or header records the denominator used for any percentage column it contains.",
      ],
    },
    {
      id: "PCT-13",
      title: "Control placement and labelling",
      status: "confirmed",
      statement:
        'The control keeps the label `Display as:` with options `Percentage` and `Count`, is rendered once per page, and is reachable by keyboard with `aria-label="Tabulation display format"`.',
      evidence: ["components/Navigation/EventTabs/MeetingNavigationBar.tsx"],
      acceptance: [
        "Given a keyboard user tabs through the page header, when they reach the control, then arrow keys move between options and the selected option is announced.",
        "Given a viewport under 600px, when the header renders, then the control collapses to an icon-labelled group without truncating either option.",
      ],
    },
    {
      id: "PCT-14",
      title: "Guardrail against regression",
      status: "proposed",
      statement:
        "Add a lint rule or unit test that fails when a component under `components/Tabulation`, `components/Reporting`, or `components/Meeting` formats a share or position quantity without `formatTabulationMetric`.",
      rationale:
        "The current gaps arose because the toggle was adopted widget by widget with nothing enforcing it. Without a guardrail the same drift returns within two sprints.",
      acceptance: [
        "Given a new component formats `position.shares` with `toLocaleString()`, when CI runs, then the check fails with a message naming the correct helper.",
      ],
    },
  ],
  tables: [
    {
      title: "Approved denominator catalogue",
      caption:
        "One row per denominator. A metric may use only a denominator listed here, and PCT-03 requires the choice to be surfaced in the tooltip.",
      headers: ["Denominator", "Source expression", "Use for"],
      rows: [
        [
          "Shares outstanding",
          "tabulationReport.positionsVoted.totalShares ?? meeting.totalSharesOutstanding",
          "Quorum gauge, Total Shares Voted, BNV, Shares Voted donut centre",
        ],
        [
          "Total shares voted (meeting)",
          "votingSummary.totalSharesVoted",
          "Vote distribution by account type, holder outcome rings",
        ],
        [
          "Total shares voted (proposal)",
          "for + against + abstain for the proposal",
          "For / Against / Abstain columns and slices",
        ],
        [
          "Total positions",
          "positionsVoted.voted + positionsVoted.unvoted",
          "Positions Voted, Positions Voted donuts, voting activity",
        ],
        [
          "Total mailing positions",
          "Mailing.totalPositions",
          "Mail positions, suppressed positions, additional mailing jobs",
        ],
        [
          "Per-broker total",
          "brokerVotingData.total",
          "Broker voting by proposal",
        ],
        [
          "Per-holder-type total",
          "sum of outcomes for that holder type",
          "Beneficial vs. Registered inner ring",
        ],
      ],
    },
    {
      title: "Widget coverage — Meeting Dashboard",
      headers: ["Widget", "Metrics in scope", "Today", "Work"],
      rows: [
        [
          "TabulationTracker",
          "Positions Voted, Shares Voted, Shares Not Voted, Total Positions, prior-year comparatives",
          "Partly wired; Total Positions hard-coded to count",
          "Convert Total Positions; align denominator to shares outstanding",
        ],
        [
          "VoteProgressBar",
          "Voted / Not Voted bar labels",
          "Whole-percent only, receives a rounded integer",
          "Pass counts down; format via the shared helper",
        ],
        [
          "QuorumGaugeCard",
          "Represented shares, quorum requirement, arc",
          "Fully wired",
          "None beyond tooltip denominator label",
        ],
        [
          "VotingTabulationTable",
          "For / Against / Abstain, Total Shares Voted, BNV",
          "5 of 7 columns wired",
          "Convert the two hard-coded columns",
        ],
        [
          "SharesVotedChart",
          "For / Against / Abstain slices and centre",
          "Wired; centre shows a constant 100.00%",
          "Give the centre a real denominator",
        ],
        [
          "MailingDataCard",
          "11 mailing counts under Totals, Mail Positions, Suppressed Positions",
          "Counts only",
          "Convert against Mailing.totalPositions",
        ],
        [
          "AdditionalMailingSummaryCard",
          "Positions, Full Set, Electronic",
          "Counts only",
          "Convert; leave upload-dialog inputs as counts",
        ],
        [
          "PastMeetingsTable",
          "Participation",
          "Percentage only; the count side is hard-coded to 0",
          "Source real voting shares, then convert",
        ],
        [
          "Key Dates, DSM card, Roles card, Shares Multiplier",
          "Dates, booleans, ratios",
          "n/a",
          "Exempt under PCT-06",
        ],
      ],
    },
    {
      title: "Widget coverage — Tabulation and Reporting",
      headers: ["Widget", "Metrics in scope", "Today", "Work"],
      rows: [
        [
          "PositionsTable",
          "Shares, Shares Voted (13 other columns exempt)",
          "2 of 15 columns wired",
          "Confirm Shares Voted denominator; exports stay counts",
        ],
        [
          "VotingSourceChartCard",
          "Web, Print, IVR, Solicitor",
          "Fully wired",
          "Bar-label fit re-test when strings change length",
        ],
        [
          "HolderOutcomeChartCard",
          "Registered / Beneficial rings and outcomes",
          "Wired; centre tooltip hard-coded to a count",
          "Convert the centre tooltip",
        ],
        [
          "VoteDistributionChart",
          "DTC/CDS and Non-DTC voted / not voted",
          "Fully wired",
          "None",
        ],
        [
          "DetailedTabulationTable",
          "Vote Submitted, % of Outstanding, % of Proposal Votes",
          "Shows both side by side, not currently rendered",
          "Decide: keep as the both-columns reference or fold into the toggle",
        ],
        [
          "QuorumTimelineChart",
          "Cumulative shares voted",
          "Percentage-primary; counts present in the data",
          "Add a numeric axis branch",
        ],
        [
          "YearOverYearChart",
          "Registered / Beneficial bars, Participation line",
          "Mixed units on two axes",
          "Convert bars against item.totalShares; the line stays a percentage",
        ],
        [
          "BrokerVotingChart",
          "For / Against / Abstain per broker",
          "Counts only",
          "Convert against per-broker total; proposal-level total must be added",
        ],
        [
          "VotingPerformanceChart",
          "Positions, Shares, Percent Voted",
          "Mixed units on two axes",
          "Two new denominators must be computed",
        ],
        [
          "GeoHeatmapCard",
          "Shareholders, Shares Held",
          "Counts only; already owns a metric toggle",
          "Add grand total; resolve control collision with the existing toggle",
        ],
        [
          "PositionsVotedChart",
          "Voted / Unvoted per holder type",
          "Counts; explicitly outside the provider",
          "Covered by PCT-02; denominator already present",
        ],
        [
          "ProposalPerformanceTable",
          "Total Presented, Average / Min / Max Support, Percent Passed",
          "Hook returns pre-formatted strings",
          "Change hook return type to numbers before any toggle work",
        ],
        [
          "ParticipationChart",
          "Participation by year",
          "Percentage only",
          "Thread shares voted and outstanding through, or exempt",
        ],
        [
          "EventSummaryTable, DownloadReportsTable, distribution drawer",
          "Dates, names, statuses",
          "n/a",
          "Exempt under PCT-06",
        ],
      ],
    },
  ],
  openQuestions: [
    {
      question:
        "Should the display mode be shared with the chatbot and PDF cover pages, or is it strictly a screen-level preference?",
      owner: "Product",
      recommendation:
        "Screen-level only. Generated documents state both readings, so they need no preference.",
    },
    {
      question:
        "`ProposalPerformanceTable` returns formatted strings from `useReporting`. Refactor to numbers now, or exempt the table from this epic?",
      owner: "Engineering",
      recommendation:
        "Refactor now. It is a contained change and the string typing already breaks sorting on decimals.",
    },
    {
      question:
        "Phase2Layout–Phase8Layout are unimported today; the dashboard route renders only Phase1. Are they in scope?",
      owner: "Product",
      recommendation:
        "Out of scope for this epic. Estimate them separately once the phase router is reconnected.",
    },
    {
      question:
        "`GeoHeatmapCard` already has a `Shareholders | Shares Held` toggle in the position the display control would occupy.",
      owner: "Design",
      recommendation:
        "Keep the metric toggle in the card and take the display mode from the page-level control.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 2. Tooltips and glossary navigation                                        */
/* -------------------------------------------------------------------------- */

const tooltipsAndNavigation: SpecSection = {
  id: "tooltips-glossary-navigation",
  title: "2. Tooltip and glossary navigation",
  summary:
    "Keep the auto-linking tooltip engine, replace the single-term dialog with a real glossary route, and make every term deep-linkable.",
  background: [
    "The portal already has a stronger tooltip system than the request assumes. `GlossaryText` scans any plain string, matches it against a single alternation built from `termsDefinitions`, and wraps only the matched span — so adding a term to the definitions file links it everywhere `GlossaryText` is already used, with no call-site edits. Aliases are derived from parentheticals, and shorthand the interface actually uses is listed explicitly.",
    "There are two markers by design: `GlossaryTooltip` renders a real button with a dashed underline and opens the definition on click; `GlossaryHint` renders a dotted underline and explains on hover only, for terms sitting inside a control that already owns the click. That distinction is deliberate and must survive this work.",
    "What is missing is the destination. Clicking a term opens `InfoDialog`, which shows one definition with no way to browse siblings, no URL, and nothing to bookmark or send to a colleague. The 107 definitions are already categorised into 12 groups, which is most of the information architecture a glossary page needs — it simply has nowhere to render.",
  ],
  requirements: [
    {
      id: "TIP-01",
      title: "Definitions have one source of truth",
      status: "confirmed",
      statement:
        "`lib/termsDefinitions.ts` remains the only source of glossary content; tooltips, the glossary page, search, and any export must read from it.",
      rationale:
        "Consistent terminology across the application is a stated goal, and it is achieved by construction here rather than by review.",
      evidence: ["lib/termsDefinitions.ts", "components/ui/GLOSSARY.md"],
      acceptance: [
        "Given a definition is edited, when the app rebuilds, then the tooltip, the glossary page, and search results all show the edited text with no other file changed.",
      ],
    },
    {
      id: "TIP-02",
      title: "Coverage — which terms get tooltips",
      status: "confirmed",
      statement:
        "Every term in `termsDefinitions` is eligible, and the first occurrence in any string rendered through `GlossaryText` is marked. Rollout must extend `GlossaryText` to all remaining prose, card titles, chart legends, table headers, and empty-state copy on the meeting, tabulation, mailing, and reporting surfaces.",
      evidence: ["components/ui/GlossaryText.tsx"],
      acceptance: [
        "Given a page in scope, when it renders, then every glossary term in its copy carries a marker on first occurrence and no marker on repeats.",
        "Given a navigation tab, menu item, or sort button label, when it renders, then it carries no marker at all.",
      ],
    },
    {
      id: "TIP-03",
      title: "Hover and click are both supported, with distinct meanings",
      status: "confirmed",
      statement:
        "Hover and keyboard focus reveal the definition; click navigates to the glossary entry. Terms inside an interactive control keep hover only.",
      rationale:
        "This is the existing `GlossaryTooltip` / `GlossaryHint` split. Making click do something more useful than opening a dialog is the change; the interaction contract is not.",
      evidence: ["components/ui/GlossaryToolTip.tsx"],
      acceptance: [
        "Given a dashed-underlined term, when a user hovers it, then the definition appears within 200ms and dismisses on blur or Escape.",
        "Given a dashed-underlined term, when a user clicks or presses Enter, then the glossary opens focused on that term.",
        "Given a dotted-underlined term, when a user clicks it, then only the surrounding control acts and the glossary does not open.",
      ],
    },
    {
      id: "TIP-04",
      title: "Deep linking",
      status: "confirmed",
      statement:
        "Each entry has a stable, shareable URL of the form `/glossary/{termId}`, using the existing `GlossaryTermId` keys; the id is permanent once published.",
      rationale:
        "Support and relationship managers paste links into email. A link that only opens the glossary at the top is not usable for that.",
      evidence: ["contexts/GlossaryContext.tsx"],
      acceptance: [
        "Given a user opens `/glossary/quorum` directly, when the page loads, then the Quorum entry is visible, scrolled into view, and briefly highlighted.",
        "Given a user clicks a term marker, when the glossary opens, then the address bar shows that term's URL and browser Back returns to the originating page with scroll position restored.",
        "Given a user bookmarks an entry, when they open the bookmark in a new session, then the same entry is shown.",
        "Given a term id that no longer exists, when the URL is opened, then the glossary renders with a clear not-found message rather than an error page.",
      ],
    },
    {
      id: "TIP-05",
      title: "Navigation preserves context",
      status: "decision-needed",
      statement:
        "On viewports at or above the `md` breakpoint, clicking a term opens a side panel over the current page and updates the URL; below `md`, it navigates to the full glossary page. A direct URL visit always renders the full page.",
      rationale:
        "An issuer checking a term mid-review should not lose the dashboard they were reading. On a phone there is no room for a panel that leaves useful context visible.",
      acceptance: [
        "Given a desktop user on the tabulation page, when they click a term, then a panel opens beside the page and the underlying content stays rendered.",
        "Given the panel is open, when the user presses Escape, then it closes, the URL returns to the underlying page, and focus returns to the term that opened it.",
        "Given a mobile user, when they click a term, then a full-page glossary view opens and Back returns them to their place.",
      ],
    },
    {
      id: "TIP-06",
      title: "Accessibility",
      status: "confirmed",
      statement:
        'Markers are real buttons, reachable by keyboard, with a visible focus ring, an accessible name of the form `{Term} — open glossary definition`, and `aria-haspopup="dialog"` where a panel is used. Definitions must not be conveyed by hover alone.',
      evidence: [
        "components/ui/GlossaryToolTip.tsx",
        "components/ui/CustomToolTip.tsx",
      ],
      acceptance: [
        "Given a keyboard user, when they Tab to a marker, then the definition is shown and the focus ring is visible against both light and dark themes.",
        "Given a screen reader user, when focus reaches a marker, then the term and its purpose are announced.",
        "Given a user with `prefers-reduced-motion`, when a panel opens, then it appears without a slide transition.",
        "Given an automated axe run on the glossary page and on a page with markers, when it completes, then there are no serious or critical violations.",
      ],
    },
    {
      id: "TIP-07",
      title: "Touch and mobile behaviour",
      status: "confirmed",
      statement:
        "On touch devices a single tap on a marker reveals the definition inline with a `View full entry` affordance; no definition may require a hover to reach.",
      rationale:
        "Hover does not exist on touch. Today a tap goes straight to the dialog, so the quick answer and the full entry cost the same interaction.",
      acceptance: [
        "Given a touch user taps a marker, when the definition appears, then a second tap elsewhere dismisses it without navigating.",
        "Given a touch target, when measured, then it is at least 44×44 CSS pixels including padding.",
      ],
    },
    {
      id: "TIP-08",
      title: "Permissions",
      status: "confirmed",
      statement:
        "The glossary is available to every authenticated role with no per-role filtering; unauthenticated visits redirect to login and return to the requested entry afterwards.",
      rationale:
        "Definitions are reference material, not client data. Role-gating them would create support friction with no confidentiality benefit.",
      evidence: ["auth.config.ts"],
      acceptance: [
        "Given any authenticated role, when they open any glossary entry, then it renders.",
        "Given an unauthenticated user opens `/glossary/quorum`, when they complete login, then they land on that entry.",
      ],
    },
    {
      id: "TIP-09",
      title: "Terminology consistency",
      status: "proposed",
      statement:
        "A build-time check must flag UI copy that uses a spelling of a glossary term not present in the term's aliases, so the interface and the glossary cannot drift apart.",
      rationale:
        "`shorthandAliases` already encodes ten cases where the interface says something shorter than the glossary title. That list is maintained by hand and silently goes stale.",
      evidence: ["components/ui/GlossaryText.tsx"],
      acceptance: [
        "Given a component renders `Beneficial Holders` with no matching alias, when the check runs, then it reports the string and the term it likely belongs to.",
      ],
    },
    {
      id: "TIP-10",
      title: "Usage measurement",
      status: "proposed",
      statement:
        "Term marker clicks and glossary searches are recorded with the term id and originating route.",
      rationale:
        "The most-opened terms are the ones whose on-screen labels are unclear. That is the cheapest signal available for prioritising copy fixes.",
      acceptance: [
        "Given a user opens a definition, when the event is recorded, then it carries the term id, the route, and whether it came from a marker or from search.",
      ],
    },
  ],
  tables: [
    {
      title: "Glossary vocabulary as built",
      caption:
        "107 entries across 12 categories in `lib/termsDefinitions.ts`. Category names are the grouping the glossary page should adopt unmodified.",
      headers: ["Category", "Entries", "Representative terms"],
      rows: [
        [
          "Proxy & Voting",
          "23",
          "Ballot, Broker Non-vote, Tabulation, Over-Voting",
        ],
        [
          "Communications & Delivery",
          "12",
          "Notice and Access (NAA), Householding, e-Consent",
        ],
        ["Market Infrastructure", "12", "Cede and Company, DTC, EDGAR, FINRA"],
        [
          "Securities & Investment Vehicles",
          "11",
          "ADR, Common Stock, ETF, REIT, SPAC",
        ],
        [
          "Governance & Corporate Documents",
          "10",
          "Annual Report, By-laws, Board of Directors",
        ],
        [
          "Roles & Intermediaries",
          "9",
          "Broker, Custodian, Transfer Agent, Solicitor",
        ],
        [
          "Shareholders & Ownership",
          "9",
          "Beneficial Owner, NOBO, OBO, Holder of Record",
        ],
        [
          "Meetings & Events",
          "7",
          "Annual Meeting, Quorum, Agenda, Meeting Date",
        ],
        [
          "Key Dates & Identifiers",
          "5",
          "CUSIP, Record Date, Mailing Date, Fiscal Year",
        ],
        [
          "Corporate Actions",
          "4",
          "Corporate Action, Dividend, Mandatory, Voluntary",
        ],
        ["Legal & Compliance", "4", "Class Action, NIGO, Rule 30e-3"],
        ["Payment & Settlement", "1", "Continuous Net Payment"],
      ],
    },
    {
      title: "Marker behaviour matrix",
      headers: ["Context", "Component", "Hover", "Click", "Underline"],
      rows: [
        [
          "Body copy, card text, empty states",
          "GlossaryTooltip",
          "Definition",
          "Opens glossary entry",
          "Dashed",
        ],
        [
          "Chart legends, table headers, sort buttons",
          "GlossaryHint",
          "Definition",
          "Control's own action",
          "Dotted",
        ],
        ["Navigation tabs, menu items", "None", "—", "Navigates", "None"],
        [
          "Form field labels",
          "GlossaryHint",
          "Definition",
          "Focuses the field",
          "Dotted",
        ],
      ],
    },
  ],
  openQuestions: [
    {
      question:
        "Should the glossary live at `/glossary` or under `/education`, which already hosts FAQs, industry trends, and video tutorials?",
      owner: "Product",
      recommendation:
        "`/glossary` at the top level, cross-linked from Education. Short URLs matter for a resource people paste into email.",
    },
    {
      question:
        "Do any client-specific definitions need to override the shared ones?",
      owner: "BetaNXT operations",
      recommendation:
        "Not in this phase. If it becomes real, add an optional per-client override map keyed by the same term ids.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 3. Glossary of Terms formatting                                            */
/* -------------------------------------------------------------------------- */

const glossaryFormatting: SpecSection = {
  id: "glossary-formatting",
  title: "3. Glossary of Terms formatting",
  summary:
    "Turn a one-definition dialog into a browsable, searchable, filterable reference page that works on a phone.",
  background: [
    "There is no glossary page today. `GlossaryProvider` mounts a single `InfoDialog` and every term marker opens it with one definition — the reader can see the term they clicked and nothing else. The support speed dial opens the same dialog at the first entry, which is effectively a random starting point.",
    "The content is in better shape than the presentation. All 107 entries carry a category, and the categories are already meaningful groupings rather than alphabetical buckets. The formatting work is therefore mostly layout, navigation, and search over content that needs no restructuring.",
    "Two constraints shape the design. Definitions are long — several run to a full paragraph of regulatory prose — so a dense table is the wrong container. And the audience reaches the glossary mid-task from a term marker, so landing on a specific entry has to feel like arriving somewhere, not like being dropped at the top of a list.",
  ],
  requirements: [
    {
      id: "GLO-01",
      title: "Layout",
      status: "confirmed",
      statement:
        "The glossary renders as a two-column layout at `md` and above: a sticky category rail on the left, and entries grouped under category headings on the right. Each entry is a card with the term, an optional acronym line, and the definition.",
      acceptance: [
        "Given a desktop viewport, when the glossary opens, then the category rail is visible without scrolling and the entry list scrolls independently.",
        "Given a user scrolls the entry list, when a new category comes into view, then the corresponding rail item becomes the active item.",
      ],
    },
    {
      id: "GLO-02",
      title: "Grouping and ordering",
      status: "confirmed",
      statement:
        "Entries group by their existing `category` value and sort alphabetically within each group. A user may switch to a flat A–Z view with a jump bar.",
      rationale:
        "Category grouping serves someone learning the domain; A–Z serves someone who knows the term and wants the definition. Both audiences use this page.",
      evidence: ["lib/termsDefinitions.ts"],
      acceptance: [
        "Given the default view, when the glossary renders, then entries appear under the 12 category headings in the order defined in the spec table.",
        "Given a user switches to A–Z, when they click a letter in the jump bar, then the list scrolls to that letter and letters with no entries are disabled rather than hidden.",
      ],
    },
    {
      id: "GLO-03",
      title: "Search",
      status: "confirmed",
      statement:
        "A single search field filters as the user types, matching against the term, its derived aliases and acronyms, and the definition body, with matched substrings highlighted in the results.",
      rationale:
        "Readers arrive with the shorthand the interface used — `NOBO`, `BNV`, `Cede & Co.` — not the formal title. Alias matching is already derivable from the same logic `GlossaryText` uses.",
      evidence: ["components/ui/GlossaryText.tsx"],
      acceptance: [
        "Given a user types `nobo`, when results render, then Non-Objecting Beneficial Owner appears with the acronym highlighted.",
        "Given a user types `cede & co.`, when results render, then Cede and Company appears.",
        "Given a query with no matches, when results render, then an empty state offers to clear the query and shows the category list.",
        "Given a search is active, when the user clears it, then the previous scroll position and category selection are restored.",
      ],
    },
    {
      id: "GLO-04",
      title: "Filtering",
      status: "confirmed",
      statement:
        "Category filters are multi-select chips that compose with search; the active filter set is reflected in the URL query string.",
      acceptance: [
        "Given a user selects Proxy & Voting and Shareholders & Ownership, when results render, then only entries from those categories appear and a result count is shown.",
        "Given filters are active, when the user copies the URL and opens it elsewhere, then the same filters are applied.",
      ],
    },
    {
      id: "GLO-05",
      title: "Readability",
      status: "confirmed",
      statement:
        "Definition text is capped at roughly 70 characters per line, set at body-size type with generous line height, and terms are visually distinct from their definitions through weight rather than colour alone.",
      rationale:
        "The current dialog renders long regulatory prose at full dialog width, which is the single biggest complaint the redesign has to answer.",
      evidence: ["components/InfoDialog.tsx"],
      acceptance: [
        "Given the longest definition in the set, when it renders, then no line exceeds the measure cap at any viewport width.",
        "Given any text in the glossary, when contrast is measured, then it meets WCAG AA against its background in both light and dark themes.",
      ],
    },
    {
      id: "GLO-06",
      title: "Cross-references",
      status: "proposed",
      statement:
        "Glossary terms appearing inside another entry's definition are themselves linked, using the same matcher `GlossaryText` already provides.",
      rationale:
        "Definitions in this domain refer to each other constantly — a reader looking up Broker Non-vote immediately needs Routine Proposal. The engine to do this already exists and is being used everywhere except inside the glossary itself.",
      acceptance: [
        "Given the Broker Non-vote entry, when it renders, then Routine Proposal within its text is a link to that entry.",
        "Given a term's own name appears in its definition, when it renders, then it is not linked to itself.",
      ],
    },
    {
      id: "GLO-07",
      title: "Entry actions",
      status: "confirmed",
      statement:
        "Each entry offers a copy-link action; the page offers a print-friendly stylesheet and a download of the full glossary.",
      rationale:
        "Relationship managers hand the glossary to new issuer contacts, which today means retyping definitions into email.",
      acceptance: [
        "Given a user activates copy-link on an entry, when they paste, then they get the absolute deep link for that entry.",
        "Given a user prints the page, when the output renders, then the rail, search field, and filters are omitted and entries are not split mid-definition.",
      ],
    },
    {
      id: "GLO-08",
      title: "Mobile responsiveness",
      status: "confirmed",
      statement:
        "Below `md` the rail collapses into a horizontally scrollable category chip row, search pins to the top of the viewport, and entries render as a single column.",
      acceptance: [
        "Given a 375px viewport, when the glossary renders, then no horizontal scrolling is required and the search field remains reachable while scrolling.",
        "Given a mobile user arrives from a deep link, when the page loads, then the target entry is scrolled into view below the pinned search field, not hidden behind it.",
      ],
    },
    {
      id: "GLO-09",
      title: "Retire the single-term dialog",
      status: "decision-needed",
      statement:
        "`InfoDialog` is replaced as the glossary destination once the page ships; `openGlossary(termId)` routes to the panel or page instead of opening a dialog.",
      rationale:
        "Leaving both paths in place guarantees they diverge. `InfoDialog` may remain for non-glossary informational content if other call sites need it.",
      evidence: ["contexts/GlossaryContext.tsx", "components/InfoDialog.tsx"],
      acceptance: [
        "Given any term marker in the app, when it is activated, then the new glossary surface opens and `InfoDialog` is not mounted for glossary content.",
      ],
    },
    {
      id: "GLO-10",
      title: "Performance",
      status: "confirmed",
      statement:
        "The glossary renders its first meaningful content within 1 second on a mid-tier laptop, and search results update within 100ms of a keystroke.",
      rationale:
        "107 entries is small enough that this needs no virtualisation — but it is large enough that a naive re-render of every card per keystroke will be felt.",
      acceptance: [
        "Given a user types quickly in search, when results update, then no dropped frames are recorded in a Performance trace.",
      ],
    },
  ],
  tables: [
    {
      title: "Entry anatomy",
      headers: ["Element", "Source", "Treatment"],
      rows: [
        [
          "Term",
          "entry.term with parentheticals stripped",
          "Body-large, semibold, anchor target",
        ],
        [
          "Acronym / aliases",
          "Parentheticals plus shorthandAliases",
          "Caption weight, secondary colour",
        ],
        [
          "Category",
          "entry.category",
          "Small outlined chip, links to that filter",
        ],
        [
          "Definition",
          "entry.definition",
          "Body, measure-capped, cross-references linked",
        ],
        [
          "Copy link",
          "Derived from term id",
          "Icon button revealed on hover and always on touch",
        ],
      ],
    },
    {
      title: "Responsive behaviour",
      headers: ["Breakpoint", "Rail", "Search", "Entries"],
      rows: [
        [
          "xs–sm (<900px)",
          "Horizontal chip row",
          "Pinned to top",
          "Single column",
        ],
        [
          "md (900–1200px)",
          "Sticky left rail",
          "In page header",
          "Single column",
        ],
        [
          "lg and up",
          "Sticky left rail",
          "In page header",
          "Single column, measure-capped, centred",
        ],
      ],
    },
  ],
  openQuestions: [
    {
      question:
        "Should the download offer PDF as well as Markdown, given the portal already generates PDFs?",
      owner: "Product",
      recommendation:
        "Ship Markdown first; add PDF if relationship managers ask for a branded handout.",
    },
    {
      question:
        "Does the glossary need a `last reviewed` date per entry for compliance?",
      owner: "Legal / Compliance",
      recommendation:
        "Add an optional `reviewedOn` field now so the schema does not have to change later, and leave it unset until someone owns the review cycle.",
    },
  ],
};

export const SPEC_SECTIONS: readonly SpecSection[] = [
  percentageToggle,
  tooltipsAndNavigation,
  glossaryFormatting,
];

export interface SpecMeta {
  readonly audience: string;
  readonly author: string;
  readonly repository: string;
  readonly status: string;
  readonly title: string;
  readonly version: string;
}

export const SPEC_META: SpecMeta = {
  audience: "Product, engineering estimation, BetaNXT stakeholders",
  author: "Issuer Portal UX",
  repository: "betanxt-issuer-portal / issuer-portal",
  status: "Draft for estimation",
  title: "Issuer Portal — UI Enhancement Requirements",
  version: "1.0",
};
