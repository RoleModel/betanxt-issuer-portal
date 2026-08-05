/**
 * The files worth reading before starting this work.
 *
 * @remarks
 * A sample, not an inventory. The earlier list named all 74 files the work
 * touches — every chart, every table — which made the archive a second copy of
 * the repo and buried the handful of files that actually explain how the
 * features work. What is left is one file per idea: the context that holds the
 * display mode, the formatter every figure goes through, one table that
 * reformats, one card that deliberately does not, the two exports that must
 * stay counts, and the glossary in full because it is the part being changed.
 *
 * The rest follow the same patterns as these and are named under each
 * requirement's "In the code", so nothing is hidden — it just is not shipped in
 * the zip. Paths are repo-relative from `issuer-portal/` and are fetched at
 * download time from `/api/dev/source`, the route that already serves this
 * app's source to the developer overlay.
 */

export interface AffectedGroup {
  /** Folder inside the zip. */
  readonly folder: string;
  readonly label: string;
  /** Repo-relative paths from `issuer-portal/`. */
  readonly paths: readonly string[];
  /** Which spec section this group belongs to. */
  readonly sectionId: string;
}

export const AFFECTED_GROUPS: readonly AffectedGroup[] = [
  {
    folder: "current/display-mode",
    label: "Display mode — the toggle itself",
    sectionId: "percentage-count-toggle",
    paths: [
      "contexts/TabulationDisplayContext.tsx",
      "utils/tabulation-display.ts",
    ],
  },
  {
    folder: "current/charts",
    label: "Shared chart configuration",
    sectionId: "chart-structure",
    paths: [
      "components/Charts/index.ts",
      "components/Charts/config/ChartDataContext.tsx",
      "components/Charts/config/ChartToggle.tsx",
    ],
  },
  {
    folder: "current/tables-and-cards",
    label: "Figures on screen — one of each kind",
    sectionId: "percentage-count-toggle",
    paths: [
      "components/Meeting/TabulationTracker.tsx",
      "components/Meeting/VotingTabulationTable.tsx",
      // Cited by PCT-06 as the example of figures the toggle must leave alone.
      "components/Meeting/KeyDatesCard.tsx",
    ],
  },
  {
    folder: "current/exports",
    label: "Exports — must stay counts",
    sectionId: "percentage-count-toggle",
    paths: ["utils/exportTabulationPdf.tsx", "utils/exportPositionsXlsx.ts"],
  },
  {
    folder: "current/glossary",
    label: "Glossary and tooltips",
    sectionId: "glossary-formatting",
    paths: [
      "components/InfoDialog.tsx",
      "components/SpeedDial.tsx",
      "contexts/GlossaryContext.tsx",
      "components/ui/GlossaryText.tsx",
      "components/ui/GlossaryToolTip.tsx",
      "components/ui/CustomToolTip.tsx",
      "components/ui/GLOSSARY.md",
      "lib/termsDefinitions.ts",
    ],
  },
];

/** Every path in the package, deduplicated. */
export const ALL_AFFECTED_PATHS: readonly string[] = [
  ...new Set(AFFECTED_GROUPS.flatMap((group) => group.paths)),
];

export interface ScreenLink {
  readonly href: string;
  readonly label: string;
}

/**
 * Where each file is actually used, so a reviewer can go and look at it.
 *
 * @remarks
 * Routes use the WEN demo client, which is the one seeded with full tabulation
 * data — the charts render empty for clients without it, which would make these
 * links look broken. Only files with a screen worth visiting are listed; shared
 * helpers and contexts have no single screen of their own.
 */
export const SCREEN_LINKS: Record<string, readonly ScreenLink[]> = {
  "contexts/TabulationDisplayContext.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Any meeting screen — the toggle",
    },
  ],
  "utils/tabulation-display.ts": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Every figure on Tabulation",
    },
  ],
  "utils/quorum.ts": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
      label: "Quorum gauge",
    },
  ],
  "utils/exportTabulationPdf.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/reports",
      label: "Reports — Download Report",
    },
  ],
  "utils/exportPositionsXlsx.ts": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Positions tab — Export as Excel",
    },
  ],
  "components/Meeting/tabulation-tracker/HistoricalShareCard.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
      label: "Meeting dashboard — tracker",
    },
  ],
  "components/SpeedDial.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Support menu, bottom right",
    },
  ],
  "contexts/GlossaryContext.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Any underlined term",
    },
  ],
  "components/ui/GlossaryText.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Underlined terms on Tabulation",
    },
  ],
  "components/ui/GlossaryToolTip.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Hover an underlined term",
    },
  ],
  "lib/termsDefinitions.ts": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Every definition in the glossary",
    },
  ],
  "hooks/useGlossarySearch.ts": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Glossary search box",
    },
  ],
  "components/Charts/index.ts": [
    { href: "/WEN/reporting", label: "Every chart on Reporting" },
  ],
  "components/InfoDialog.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Any page — support menu, bottom right",
    },
  ],
  "components/Charts/QuorumGauge/QuorumGaugeCard.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
      label: "Meeting dashboard",
    },
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation",
    },
  ],
  "components/Charts/SharesVoted/SharesVotedChart.tsx": [
    { href: "/WEN/meeting/wen-special-meeting-2026/reports", label: "Reports" },
  ],
  "components/Meeting/TabulationTracker.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
      label: "Meeting dashboard",
    },
  ],
  "components/Meeting/VotingTabulationTable.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation — Overview tab",
    },
  ],
  "components/Meeting/MailingDataCard.tsx": [
    { href: "/WEN/meeting/wen-special-meeting-2026/mailing", label: "Mailing" },
  ],
  "components/Meeting/AdditionalMailingSummaryCard.tsx": [
    { href: "/WEN/meeting/wen-special-meeting-2026/mailing", label: "Mailing" },
  ],
  "components/Meeting/PastMeetingsTable.tsx": [
    { href: "/WEN/past-meetings", label: "Past meetings" },
  ],
  "components/Meeting/tabulation-tracker/VoteProgressBar.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
      label: "Meeting dashboard",
    },
  ],
  "components/Navigation/EventTabs/MeetingNavigationBar.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Any meeting page — the toggle itself",
    },
  ],
  "components/Tabulation/PositionsTable.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation — Positions tab",
    },
  ],
  "components/Charts/HolderOutcome/HolderOutcomeChartCard.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation",
    },
  ],
  "components/Charts/VotingSource/VotingSourceChartCard.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation",
    },
  ],
  "components/Charts/HolderOutcome/HolderTotalsBarLabels.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation",
    },
  ],
  "components/Charts/VoteMatrix/VoteMatrixChartCard.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation",
    },
  ],
  "components/Charts/BeneficialVsRegistered/BeneficialVsRegisteredCard.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation/chart-lab",
      label: "Chart lab",
    },
  ],
  "components/Charts/VotingActivity/VotingActivityCard.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation/chart-lab",
      label: "Chart lab",
    },
  ],
  "components/Charts/ConsolidatedVote/ConsolidatedVoteChart.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation/chart-lab",
      label: "Chart lab",
    },
  ],
  "components/Charts/ResponseRateTimeline/ResponseRateTimeline.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation/chart-lab",
      label: "Chart lab",
    },
  ],
  "components/Charts/VoteDistribution/VoteDistributionChart.tsx": [
    { href: "/WEN/meeting/wen-special-meeting-2026/reports", label: "Reports" },
  ],
  "components/Reporting/DownloadReportsTable.tsx": [
    { href: "/WEN/meeting/wen-special-meeting-2026/reports", label: "Reports" },
  ],
  "components/Charts/PositionsVoted/PositionsVotedChart.tsx": [
    { href: "/WEN/reporting", label: "Reporting" },
  ],
  "components/Charts/YearOverYear/YearOverYearChart.tsx": [
    { href: "/WEN/reporting", label: "Reporting" },
  ],
  "components/Charts/Participation/ParticipationChart.tsx": [
    { href: "/WEN/reporting", label: "Reporting" },
  ],
  "components/Charts/BrokerVoting/BrokerVotingChart.tsx": [
    { href: "/WEN/reporting", label: "Reporting" },
  ],
  "components/Charts/VotingPerformance/VotingPerformanceChart.tsx": [
    { href: "/WEN/reporting", label: "Reporting" },
  ],
  "components/Charts/GeoHeatmap/GeoHeatmapCard.tsx": [
    { href: "/WEN/reporting", label: "Reporting" },
  ],
  "components/Reporting/ProposalPerformanceTable.tsx": [
    { href: "/WEN/reporting", label: "Reporting" },
  ],
  "components/Reporting/EventSummaryTable.tsx": [
    { href: "/WEN/reporting", label: "Reporting" },
  ],
  "components/Charts/QuorumTimeline/QuorumTimelineChart.tsx": [
    { href: "/WEN/reporting", label: "Reporting" },
  ],
  "components/Meeting/KeyDatesCard.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
      label: "Meeting dashboard",
    },
  ],
};
