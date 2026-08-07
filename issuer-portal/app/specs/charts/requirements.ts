/**
 * The charts directory, the display control, and the exports that exist today.
 *
 * @remarks
 * Every claim here was checked against the code. Where a file is named, it is
 * named so a developer can open it. Content lives in a typed module because the
 * page renders it and the download serialises it, so the two cannot drift. The
 * shared shapes are reused from the UI-enhancements spec so every spec package
 * renders through the same page component.
 */

import type {
  SpecMeta,
  SpecSection,
} from "@/app/specs/ui-enhancements/requirements";

/** Routes use the WEN demo client, which is seeded. */
const TABULATION = "/WEN/meeting/wen-special-meeting-2026/tabulation";
const CHART_LAB = "/WEN/meeting/wen-special-meeting-2026/tabulation/chart-lab";
const REPORTING = "/WEN/reporting";
const REPORTS = "/WEN/meeting/wen-special-meeting-2026/reports";
const NOBO = "/WEN/meeting/wen-special-meeting-2026/nobo";

/* -------------------------------------------------------------------------- */
/* 1. The Charts Directory                                                    */
/* -------------------------------------------------------------------------- */

const chartsDirectory: SpecSection = {
  id: "charts-directory",
  title: "1. The Charts Directory",
  summary:
    "The chart components under `components/Charts/`, where each one renders, and what feeds it.",
  background: [
    "Eighteen folders under `components/Charts/` hold nineteen chart components; `DirectorPerformance/` holds two. `config/` and `series/` hold the pieces charts share.",
    "`components/Charts/index.ts` re-exports the chart components, but no file imports it. Every consumer imports the chart's own path — `app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx` imports `@/components/Charts/QuorumGauge/QuorumGaugeCard` directly.",
    "Three chart components are on no route. `DirectorPerformanceChart` and `IndividualDirectorChart` have no callers at all. `SharesVotedChart` is rendered by `components/Tabulation/SharesVotedCard.tsx`, `components/Meeting/Phase6Layout.tsx`, and `components/Meeting/Phase7Layout.tsx`, and none of those three is imported anywhere — `app/[clientTicker]/meeting/[meetingId]/dashboard/[phase]/page.tsx` loads `Phase1Layout` and nothing else.",
    "Charts get their data four ways: props from a parent, a shared hook, a fetch the chart issues itself, or constants in its own file. `ResponseRateTimeline` is the constants case, and it renders a warning `Alert` saying so because every seeded `position_vote` carries the same `createdAt`.",
    "The Tabulation tab is the one page where charts share a source. `hooks/useTabulationInsights.ts` issues `GET /positions`, `GET /meetings/{meetingId}/proposals`, `GET /meetings/{meetingId}`, and `GET /meetings/{meetingId}/tabulation-report` in one `Promise.all`, plus a raw `fetch` of `/position_votes?meetingId=…&limit=10000`, and hands each card a projection of that result.",
  ],
  requirements: [
    {
      id: "CHT2-01",
      screens: [{ href: TABULATION, label: "Tabulation" }],
      title: "One folder per chart",
      statement:
        "Each chart lives in its own folder under `components/Charts/` with the helpers only it uses, and is re-exported from `components/Charts/index.ts`.",
      evidence: [
        "components/Charts/index.ts",
        "components/Charts/VoteMatrix/VoteMatrixChartCard.tsx",
      ],
      acceptance: [
        "Given a new chart, when it is added, then it is a folder under components/Charts/ and a line in index.ts.",
        "Given a helper used by one chart only, when it is placed, then it sits in that chart's folder.",
      ],
    },
    {
      id: "CHT2-02",
      screens: [
        { href: TABULATION, label: "Tabulation" },
        { href: CHART_LAB, label: "Chart lab" },
      ],
      title: "Shared pieces come from config/ and series/",
      statement:
        "Donut geometry, centre labels, gauge labels, legends, legend toggles, line markers, and the loading skeleton come from `components/Charts/config/`; the vote-matrix outcome, source, and holder definitions come from `components/Charts/series/vote-breakdown-chart-data.ts`.",
      rationale:
        "Adoption is partial today: seven charts use `SkeletonChart`, and eight build a loading state from MUI's `Skeleton` directly.",
      evidence: [
        "components/Charts/config/ConfiguredPieChart.tsx",
        "components/Charts/config/SkeletonChart.tsx",
        "components/Charts/series/vote-breakdown-chart-data.ts",
      ],
      acceptance: [
        "Given a donut chart, when it renders, then its ring geometry and centre label come from ConfiguredPieChart and PieChartCenterLabel.",
        "Given a chart in a loading state, when it renders, then it shows SkeletonChart rather than a local Skeleton composition.",
      ],
    },
    {
      id: "CHT2-03",
      screens: [{ href: TABULATION, label: "Tabulation" }],
      title: "The Tabulation tab's charts come from one hook",
      statement:
        "`useTabulationInsights` is the only data source behind the Tabulation tab's charts: it returns `quorumGauge` for `QuorumGaugeCard` and `voteMatrixProposals` for `VoteMatrixChartCard`, and neither card fetches for itself.",
      evidence: [
        "hooks/useTabulationInsights.ts",
        "app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx",
      ],
      acceptance: [
        "Given the Tabulation tab, when it loads, then the four typed calls and the /position_votes fetch are issued once each.",
        "Given a chart on the Tabulation tab, when its source is read, then it takes its data through props and shows the hook's loading state.",
      ],
    },
    {
      id: "CHT2-04",
      screens: [
        { href: REPORTING, label: "Reporting" },
        { href: REPORTS, label: "Reports" },
        { href: CHART_LAB, label: "Chart lab" },
      ],
      title: "Every chart's data route is one of four",
      statement:
        "A chart resolves its data through props, a shared hook, a fetch it issues itself, or constants in its own file, and matches the inventory table.",
      evidence: [
        "hooks/useReporting.ts",
        "hooks/useGeoDistribution.ts",
        "components/Charts/ConsolidatedVote/useVoteBreakdown.ts",
        "components/Charts/VotingPerformance/VotingPerformanceChart.tsx",
      ],
      acceptance: [
        "Given any chart, when its source is read, then its data arrives by exactly one of the four routes.",
        "Given a chart that fetches for itself, when it is reviewed, then it is one of BeneficialVsRegisteredCard or VotingPerformanceChart.",
      ],
    },
    {
      id: "CHT2-05",
      screens: [{ href: CHART_LAB, label: "Chart lab — Response Rate" }],
      title: "Unrendered and synthetic charts are declared",
      statement:
        "A chart drawn from constants carries a visible notice, and a chart component no route reaches is listed as such in the inventory table.",
      evidence: [
        "components/Charts/ResponseRateTimeline/ResponseRateTimeline.tsx",
        "components/Charts/DirectorPerformance/DirectorPerformanceChart.tsx",
        "components/Charts/SharesVoted/SharesVotedChart.tsx",
      ],
      acceptance: [
        "Given ResponseRateTimeline, when it renders, then a warning Alert says the curve is illustrative.",
        "Given a chart component, when the inventory is checked, then it names either the route that renders it or the fact that none does.",
      ],
    },
  ],
  tables: [
    {
      title: "Every chart, what feeds it, and where it renders",
      caption:
        "Every chart component under `components/Charts/`. No chart has an export control (CHT2-11).",
      headers: ["Chart", "Fed by", "Rendered on"],
      rows: [
        [
          "QuorumGaugeCard",
          "Props (model), from useTabulationInsights",
          "Tabulation; Phase 1 dashboard",
        ],
        [
          "VoteMatrixChartCard",
          "Props (proposals), from useTabulationInsights; owns the shared filter state",
          "Tabulation",
        ],
        [
          "VotingSourceChartCard",
          "Props (rows, totalShares, hiddenSourceIds), from VoteMatrixChartCard",
          "Tabulation",
        ],
        [
          "HolderOutcomeChartCard",
          "Props (rows, proposals, totalShares), from VoteMatrixChartCard",
          "Tabulation",
        ],
        [
          "BeneficialVsRegisteredCard",
          "Own useEffect → GET /positions?meetingId; chartOverride prop bypasses it",
          "Chart lab",
        ],
        [
          "VotingPerformanceChart",
          "Own useEffect → GET /positions?meetingId; buckets share ranges locally",
          "Reporting",
        ],
        [
          "GeoHeatmapCard",
          "useGeoDistribution (SWR) → GET /positions?meetingId&limit=5000",
          "Reporting; NOBO",
        ],
        [
          "ConsolidatedVoteChart",
          "Props from useVoteBreakdown (SWR) → GET /positions, /meetings/{id}/proposals, /position_votes",
          "Chart lab",
        ],
        [
          "VotingActivityCard",
          "useVotingTabulation (SWR) → GET /meetings/{id}/proposals, /positions, raw /position_votes",
          "Chart lab",
        ],
        [
          "VoteDistributionChart",
          "Props (data) from buildVoteDistributionData(positions); positions from MeetingContext",
          "Reports",
        ],
        [
          "PositionsVotedChart",
          "Props (data, setKeys) derived in the page from useReporting → GET /meetings, /positions",
          "Reporting",
        ],
        [
          "ParticipationChart",
          "Props (data) derived in the page from useReporting",
          "Reporting",
        ],
        ["YearOverYearChart", "Props (data) from useReporting", "Reporting"],
        [
          "BrokerVotingChart",
          "Props (proposals, brokerData) from useReports → GET /meetings/{id}/tabulation-report",
          "Reporting",
        ],
        [
          "QuorumTimelineChart",
          "Props from useQuorumTimeline, a useMemo over caller-supplied votes; no fetch",
          "Reporting",
        ],
        ["ResponseRateTimeline", "In-file constants (synthetic)", "Chart lab"],
        [
          "SharesVotedChart",
          "useVotingTabulation; proposalsOverride prop bypasses it",
          "No route — its callers SharesVotedCard, Phase6Layout, and Phase7Layout are themselves unimported",
        ],
        ["DirectorPerformanceChart", "Props (data)", "No route"],
        ["IndividualDirectorChart", "Props (directorName, data)", "No route"],
      ],
    },
    {
      title: "Shared pieces",
      caption: "`components/Charts/config/` and `components/Charts/series/`.",
      headers: ["File", "Role", "Used by"],
      rows: [
        [
          "config/ConfiguredPieChart.tsx",
          "Donut geometry, margins, centre label, legend suppression",
          "HolderOutcomeChartCard, SharesVotedChart, VoteDistributionChart",
        ],
        [
          "config/PieChartCenterLabel.tsx",
          "The donut's centre label and its number formatting",
          "ConfiguredPieChart, GaugeCenterLabel, ConsolidatedVoteChart, PositionsVotedChart, VotingActivityCard",
        ],
        [
          "config/GaugeCenterLabel.tsx",
          "The centre label positioned on a Gauge's cx/cy",
          "QuorumGaugeCard",
        ],
        [
          "config/CustomLegend.tsx",
          "Legend with line, bar, and area markers",
          "YearOverYearChart, VotingPerformanceChart, IndividualDirectorChart",
        ],
        [
          "config/LegendToggle.tsx",
          "One clickable legend entry with pressed and hidden states",
          "VotingSourceLegend, HolderOutcomeChartCard, VoteDistributionLegend",
        ],
        [
          "config/LineMarker.tsx",
          "Custom SVG mark element for line charts",
          "CustomLegend",
        ],
        [
          "config/SkeletonChart.tsx",
          "Loading skeleton, with optional card chrome",
          "Seven charts; eight others use MUI Skeleton directly",
        ],
        [
          "config/ChartDataContext.tsx",
          "Carries series configuration to composed chart primitives",
          "DirectorPerformanceChart only, which is on no route",
        ],
        [
          "config/ChartToggle.tsx",
          "Aggregate-versus-individual ToggleButtonGroup",
          "Nothing — no chart imports it",
        ],
        [
          "series/vote-breakdown-chart-data.ts",
          "Vote outcomes, sources, holder types, and row-sum helpers",
          "The vote-matrix cards and their legends",
        ],
        [
          "HolderOutcome/HolderTotalsBarLabels.tsx",
          "Bar totals, formatted from a displayMode prop",
          "VotingSourceChartCard, despite living in HolderOutcome/",
        ],
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 2. The Percentage/Count Display Control                                    */
/* -------------------------------------------------------------------------- */

const displayControl: SpecSection = {
  id: "display-control",
  title: "2. The Percentage/Count Display Control",
  summary:
    "One toggle decides whether figures under a meeting read as percentages or counts.",
  background: [
    '`utils/tabulation-display.ts` holds the calculation: `TabulationDisplayMode` is `"numbers" | "percentages"`, and `formatTabulationMetric(value, total, mode)` returns `{ display, alternate }` — the reading for the mode and the other one. `formatTabulationPercentage(value)` covers figures that arrive already divided. Percentages carry two decimals; numbers go through an `Intl.NumberFormat` with `maximumFractionDigits: 2`.',
    '`contexts/TabulationDisplayContext.tsx` holds the mode in `useState`, defaulting to `"percentages"`. There is no `localStorage` and no URL parameter, so a reload returns to percentages. `useTabulationDisplay()` throws when no provider is above it.',
    "The provider is mounted in `app/[clientTicker]/meeting/layout.tsx` and `app/[clientTicker]/past-meeting/layout.tsx`. The control is a `ToggleButtonGroup` labelled `Tabulation display format` in `components/Navigation/EventTabs/MeetingNavigationBar.tsx`, fed the mode and setter by `components/Navigation/EventTabs/use-meeting-navigation.ts`.",
    "Eleven files call `useTabulationDisplay()` — seven charts plus three tables and `use-meeting-navigation.ts` — and `HolderTotalsBarLabels` takes the mode as a prop. The exception is `components/Charts/PositionsVoted/PositionsVotedChart.tsx`: it renders on `/[clientTicker]/reporting`, outside both layouts, so it cannot call the hook, and it has its own `positionCountFormatter` and `formatPositionPercentage` with a comment saying there is no display mode to follow.",
  ],
  topics: [
    {
      question: "What the control governs.",
      answer: [
        "Share quantities and position counts on the screens under a meeting, in charts and tables alike.",
      ],
      requirementIds: ["CHT2-06", "CHT2-07"],
    },
    {
      question: "Where it lives and what it defaults to.",
      answer: [
        "A two-option toggle in the meeting navigation bar, backed by a provider on the meeting and past-meeting layouts, defaulting to percentages.",
      ],
      requirementIds: ["CHT2-08"],
    },
    {
      question: "Which charts follow it.",
      answer: [
        "The seven that render under a meeting layout. `PositionsVotedChart` renders on the reporting route and formats its own figures.",
      ],
      requirementIds: ["CHT2-09", "CHT2-10"],
    },
  ],
  requirements: [
    {
      id: "CHT2-06",
      screens: [{ href: TABULATION, label: "Tabulation — the display toggle" }],
      title: "One mode for the whole event",
      statement:
        "A single `TabulationDisplayMode` governs every share quantity and position count under a meeting, and switching it updates every figure on screen without a refetch.",
      evidence: [
        "contexts/TabulationDisplayContext.tsx",
        "app/[clientTicker]/meeting/layout.tsx",
        "app/[clientTicker]/past-meeting/layout.tsx",
      ],
      acceptance: [
        "Given the Tabulation tab in percentages, when the user switches to numbers, then every share quantity and position count changes together, with no network request.",
        "Given the mode has been switched, when the user moves to another tab under the same meeting, then the mode is still in effect.",
      ],
    },
    {
      id: "CHT2-07",
      screens: [{ href: TABULATION, label: "Tabulation — any figure" }],
      title: "One formatter produces both readings",
      statement:
        "`formatTabulationMetric(value, total, mode)` is the only place a switchable figure becomes text, and it returns the current reading as `display` and the other as `alternate` so a tooltip can show the alternative without recomputing it.",
      evidence: ["utils/tabulation-display.ts"],
      acceptance: [
        "Given a value and its base, when the formatter is called in either mode, then display is that mode's reading and alternate is the other.",
        "Given a base of zero, when the formatter is called, then the percentage is 0.00% rather than NaN.",
      ],
    },
    {
      id: "CHT2-08",
      screens: [{ href: TABULATION, label: "Tabulation — navigation bar" }],
      title: "The toggle lives in the navigation bar",
      statement:
        "The control is a two-option `ToggleButtonGroup` in the meeting navigation bar, labelled `Tabulation display format`, with `View as Percentages` selected by default.",
      evidence: [
        "components/Navigation/EventTabs/MeetingNavigationBar.tsx",
        "components/Navigation/EventTabs/use-meeting-navigation.ts",
      ],
      acceptance: [
        "Given a meeting is open, when the navigation bar renders, then the toggle shows percentages selected.",
        "Given the selected option, when it is clicked again, then the mode does not clear to null.",
      ],
    },
    {
      id: "CHT2-09",
      screens: [{ href: TABULATION, label: "Tabulation — charts" }],
      title: "Charts under a meeting layout read the mode from the context",
      statement:
        "A chart rendered under the meeting or past-meeting layout calls `useTabulationDisplay()` and formats through `formatTabulationMetric`, or takes the mode as a prop when it is a child render function.",
      evidence: [
        "components/Charts/QuorumGauge/QuorumGaugeCard.tsx",
        "components/Charts/HolderOutcome/HolderTotalsBarLabels.tsx",
      ],
      acceptance: [
        "Given the seven charts under a meeting layout, when the mode is switched, then each one's figures change.",
        "Given HolderTotalsBarLabels, when it renders, then it formats from the displayMode prop its parent passes.",
      ],
    },
    {
      id: "CHT2-10",
      screens: [{ href: REPORTING, label: "Reporting — Positions Voted" }],
      title: "PositionsVotedChart formats through the display control",
      statement:
        "`PositionsVotedChart` takes the display mode — as a prop with a documented default, or from a hook that tolerates a missing provider — and its local `positionCountFormatter` and `formatPositionPercentage` are removed.",
      rationale:
        "It renders on the reporting route, outside both layouts, so calling `useTabulationDisplay()` as written would throw.",
      evidence: [
        "components/Charts/PositionsVoted/PositionsVotedChart.tsx",
        "contexts/TabulationDisplayContext.tsx",
      ],
      acceptance: [
        "Given the reporting page, when the chart renders in numbers mode, then its slice labels read as counts, and in percentages mode as percentages of the chart's own total.",
        "Given the chart's source, when it is read, then it holds no local number or percentage formatter.",
        "Given the chart mounted outside any provider, when it renders, then it uses the documented default rather than throwing.",
      ],
    },
  ],
  tables: [
    {
      title: "Who reads the display mode",
      caption: "The last row is the gap CHT2-10 closes.",
      headers: ["File", "How it gets the mode", "What it formats"],
      rows: [
        [
          "components/Charts/QuorumGauge/QuorumGaugeCard.tsx",
          "useTabulationDisplay()",
          "Represented and required shares",
        ],
        [
          "components/Charts/VotingSource/VotingSourceChartCard.tsx",
          "useTabulationDisplay()",
          "Shares per voting source",
        ],
        [
          "components/Charts/HolderOutcome/HolderOutcomeChartCard.tsx",
          "useTabulationDisplay()",
          "Slice values and the donut's centre figure",
        ],
        [
          "components/Charts/BeneficialVsRegistered/BeneficialVsRegisteredCard.tsx",
          "useTabulationDisplay()",
          "Slice values and legend figures",
        ],
        [
          "components/Charts/VoteDistribution/VoteDistributionChart.tsx",
          "useTabulationDisplay()",
          "Distribution totals",
        ],
        [
          "components/Charts/VotingActivity/VotingActivityCard.tsx",
          "useTabulationDisplay()",
          "Activity totals",
        ],
        [
          "components/Charts/SharesVoted/SharesVotedChart.tsx",
          "useTabulationDisplay()",
          "Shares voted (chart is on no route)",
        ],
        [
          "components/Charts/HolderOutcome/HolderTotalsBarLabels.tsx",
          "displayMode prop",
          "Bar totals",
        ],
        [
          "components/Tabulation/PositionsTable.tsx",
          "useTabulationDisplay()",
          "Share columns in the grid",
        ],
        [
          "components/Meeting/VotingTabulationTable.tsx",
          "useTabulationDisplay()",
          "Shares and percentages per proposal",
        ],
        [
          "components/Meeting/TabulationTracker.tsx",
          "useTabulationDisplay()",
          "Tracker figures",
        ],
        [
          "components/Charts/PositionsVoted/PositionsVotedChart.tsx",
          "Neither — renders outside the provider",
          "Its own Intl.NumberFormat and percentage helper",
        ],
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 3. Table and Report Exports                                                */
/* -------------------------------------------------------------------------- */

const reportExports: SpecSection = {
  id: "exports",
  title: "3. Table and Report Exports",
  summary:
    "The two export surfaces on the Tabulation tab. No chart has an export.",
  background: [
    "No component in `components/Charts/` renders a download or export control, and nothing in the repository serialises a chart's SVG or rasterises one to an image.",
    "`components/Tabulation/TabulationReportCard.tsx` sits beside the quorum gauge on the Tabulation tab as a `FeatureTile` with a `Download Report` action. Its handler `await import`s `utils/exportTabulationPdf.tsx` and passes the proposal rows it built from the tabulation report.",
    "`components/Tabulation/PositionsTable.tsx` adds `Export as PDF` and `Export as Excel` to the DataGrid toolbar through `additionalExportMenuItems`; both handlers `await import` their writer, `utils/exportPositionsPdf.tsx` and `utils/exportPositionsXlsx.ts`. The grid's own CSV and print buttons are switched off with `csvOptions.disableToolbarButton` and `printOptions.disableToolbarButton`, so those two items are the whole menu.",
    "The comment above those handlers records why they are lazy: imported statically, `@react-pdf/pdfkit` and `xlsx` pulled about 2.4MB into the tabulation page's chunk, and parsing them on load was a measurable part of the page's long animation frames.",
  ],
  topics: [
    {
      question: "What a user can export from the Tabulation tab.",
      answer: [
        "The tabulation report as a PDF from the report tile, and the positions grid as a PDF or a workbook from its toolbar menu.",
      ],
      requirementIds: ["CHT2-12", "CHT2-13"],
    },
    {
      question: "What charts export, and how the writers load.",
      answer: [
        "Charts export nothing. The two table and report writers are reached through `await import(...)` inside the click handler, never at module scope.",
      ],
      requirementIds: ["CHT2-11", "CHT2-14"],
    },
  ],
  requirements: [
    {
      id: "CHT2-11",
      screens: [
        { href: TABULATION, label: "Tabulation" },
        { href: REPORTING, label: "Reporting" },
        { href: NOBO, label: "NOBO" },
      ],
      title: "Charts carry no export control",
      statement:
        "No chart card in `components/Charts/` renders a download button, export menu, or image capture.",
      evidence: [
        "components/Charts/index.ts",
        "components/Charts/QuorumGauge/QuorumGaugeCard.tsx",
      ],
      acceptance: [
        "Given any chart card, when it renders, then its header holds no download or export control.",
        "Given components/Charts/, when it is searched, then it contains no canvas capture, SVG serialisation, or spreadsheet writer.",
      ],
    },
    {
      id: "CHT2-12",
      screens: [{ href: TABULATION, label: "Tabulation — report tile" }],
      title: "The tabulation report downloads as a PDF",
      statement:
        "The report tile beside the quorum gauge builds proposal rows from the tabulation report and hands them to `exportTabulationPdf`, showing `Loading...` until a meeting and at least one proposal are available.",
      evidence: [
        "components/Tabulation/TabulationReportCard.tsx",
        "utils/exportTabulationPdf.tsx",
      ],
      acceptance: [
        "Given a meeting with proposals, when the tile is clicked, then a tabulation PDF is produced for the current client ticker.",
        "Given no proposals have loaded, when the tile renders, then its action reads Loading... and it is dimmed.",
      ],
    },
    {
      id: "CHT2-13",
      screens: [{ href: TABULATION, label: "Tabulation — positions grid" }],
      title: "The positions grid exports PDF and Excel",
      statement:
        "The positions grid's toolbar menu offers exactly `Export as PDF` and `Export as Excel`, both built from the rows the grid currently shows.",
      evidence: [
        "components/Tabulation/PositionsTable.tsx",
        "utils/exportPositionsXlsx.ts",
        "utils/exportPositionsPdf.tsx",
      ],
      acceptance: [
        "Given the positions grid, when its export menu opens, then it lists PDF and Excel and no CSV or print item.",
        "Given a PDF export is running, when the menu opens, then the PDF item is disabled and reads Generating PDF….",
        "Given filters are applied to the grid, when either export runs, then the file holds the rows the grid is showing.",
      ],
    },
    {
      id: "CHT2-14",
      screens: [{ href: TABULATION, label: "Tabulation" }],
      title: "Export writers load on click",
      statement:
        "Every PDF and spreadsheet writer is reached through `await import(...)` inside its click handler, and none is imported at module scope by a page or a card on a chart route.",
      rationale:
        "Static imports put roughly 2.4MB of `@react-pdf/pdfkit` and `xlsx` in the tabulation page's chunk, where parsing it contributed to long animation frames.",
      evidence: [
        "components/Tabulation/PositionsTable.tsx",
        "components/Tabulation/TabulationReportCard.tsx",
      ],
      acceptance: [
        "Given the Tabulation tab, when it loads, then its chunk holds no spreadsheet or PDF writer code.",
        "Given an export item, when it is clicked, then the writer chunk is fetched and the item shows a busy state that clears whether the writer resolves or fails.",
      ],
    },
  ],
  tables: [
    {
      title: "The three export writers",
      caption: "None of them takes its input from a chart.",
      headers: ["Writer", "Output", "Reached from"],
      rows: [
        [
          "utils/exportTabulationPdf.tsx",
          "@react-pdf/renderer document",
          "Tabulation report tile (lazy). Phase8Layout and components/Reporting/TabulationReportCard.tsx import it statically, and neither is on a route.",
        ],
        [
          "utils/exportPositionsPdf.tsx",
          "@react-pdf/renderer document",
          "PositionsTable toolbar (lazy)",
        ],
        [
          "utils/exportPositionsXlsx.ts",
          "Single-sheet workbook via the xlsx package",
          "PositionsTable toolbar (lazy)",
        ],
      ],
    },
  ],
};

export const SPEC_SECTIONS: readonly SpecSection[] = [
  chartsDirectory,
  displayControl,
  reportExports,
];

export const SPEC_META: SpecMeta = {
  audience: "Engineering",
  author: "Issuer Portal UX",
  repository: "betanxt-issuer-portal / issuer-portal",
  status: "For build",
  title: "Issuer Portal — Charts and the Display Control",
  version: "2.0",
};
