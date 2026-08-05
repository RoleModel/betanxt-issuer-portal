/**
 * The real files each part of this work touches.
 *
 * @remarks
 * Listed so the download can include the actual components an engineer has to
 * change, not just the proposed code. Paths are repo-relative from
 * `issuer-portal/` and are fetched at download time from `/api/dev/source`,
 * which already serves this app's own source to the developer overlay — the
 * page needs no filesystem access and no second copy of the tree.
 *
 * Keep this list accurate. It is what the zip contains and what the estimate is
 * counted from.
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
      "components/Navigation/EventTabs/MeetingNavigationBar.tsx",
      "components/Navigation/EventTabs/use-meeting-navigation.ts",
      "app/[clientTicker]/meeting/layout.tsx",
      "app/[clientTicker]/reporting/layout.tsx",
    ],
  },
  {
    folder: "current/charts",
    label: "Charts and their config",
    sectionId: "chart-consolidation",
    paths: [
      "components/Charts/BeneficialVsRegistered/BeneficialVsRegisteredCard.tsx",
      "components/Charts/BrokerVoting/BrokerVotingChart.tsx",
      "components/Charts/ConsolidatedVote/ConsolidatedVoteChart.tsx",
      "components/Charts/ConsolidatedVote/useVoteBreakdown.ts",
      "components/Charts/DirectorPerformance/DirectorPerformanceChart.tsx",
      "components/Charts/DirectorPerformance/IndividualDirectorChart.tsx",
      "components/Charts/GeoHeatmap/GeoHeatmapCard.tsx",
      "components/Charts/HolderOutcome/HolderOutcomeChartCard.tsx",
      "components/Charts/HolderOutcome/HolderTotalsBarLabels.tsx",
      "components/Charts/Participation/ParticipationChart.tsx",
      "components/Charts/PositionsVoted/PositionsVotedChart.tsx",
      "components/Charts/QuorumGauge/QuorumGaugeCard.tsx",
      "components/Charts/QuorumTimeline/QuorumTimelineChart.tsx",
      "components/Charts/QuorumTimeline/useQuorumTimeline.ts",
      "components/Charts/ResponseRateTimeline/ResponseRateTimeline.tsx",
      "components/Charts/SharesVoted/SharesVotedChart.tsx",
      "components/Charts/VoteDistribution/VoteDistributionChart.tsx",
      "components/Charts/VoteDistribution/VoteDistributionLegend.tsx",
      "components/Charts/VoteDistribution/vote-distribution-chart-data.ts",
      "components/Charts/VoteMatrix/VoteMatrixChartCard.tsx",
      "components/Charts/VotingActivity/VotingActivityCard.tsx",
      "components/Charts/VotingPerformance/VotingPerformanceChart.tsx",
      "components/Charts/VotingSource/SourcePatternDefinitions.tsx",
      "components/Charts/VotingSource/VotingSourceChartCard.tsx",
      "components/Charts/VotingSource/VotingSourceLegend.tsx",
      "components/Charts/YearOverYear/YearOverYearChart.tsx",
      "components/Charts/config/ChartDataContext.tsx",
      "components/Charts/config/ChartToggle.tsx",
      "components/Charts/config/ConfiguredPieChart.tsx",
      "components/Charts/config/CustomLegend.tsx",
      "components/Charts/config/GaugeCenterLabel.tsx",
      "components/Charts/config/LegendToggle.tsx",
      "components/Charts/config/LineMarker.tsx",
      "components/Charts/config/PieChartCenterLabel.tsx",
      "components/Charts/config/SkeletonChart.tsx",
      "components/Charts/data/vote-breakdown-chart-data.ts",
      "components/Charts/index.ts",
      "utils/quorum.ts",
    ],
  },
  {
    folder: "current/tables-and-cards",
    label: "Tables and cards showing figures",
    sectionId: "percentage-count-toggle",
    paths: [
      "components/Meeting/TabulationTracker.tsx",
      "components/Meeting/tabulation-tracker/useTabulationTrackerData.ts",
      "components/Meeting/tabulation-tracker/VoteProgressBar.tsx",
      "components/Meeting/tabulation-tracker/HistoricalShareCard.tsx",
      "components/Meeting/VotingTabulationTable.tsx",
      "components/Meeting/MailingDataCard.tsx",
      "components/Meeting/AdditionalMailingSummaryCard.tsx",
      "components/Meeting/PastMeetingsTable.tsx",
      // Cited by PCT-06 as the example of figures the toggle must leave alone.
      "components/Meeting/KeyDatesCard.tsx",
      "components/Tabulation/PositionsTable.tsx",
      "components/Tabulation/DetailedTabulationTable.tsx",
      "components/Reporting/ProposalPerformanceTable.tsx",
      "components/Reporting/QuorumPerformanceTable.tsx",
      "components/Reporting/VoteStatusSummaryTable.tsx",
      "components/Reporting/EventSummaryTable.tsx",
      "hooks/useReporting.ts",
      "hooks/useTabulationInsights.ts",
    ],
  },
  {
    folder: "current/exports",
    label: "Exports — must stay counts",
    sectionId: "percentage-count-toggle",
    paths: [
      "utils/exportTabulationPdf.tsx",
      "utils/exportPositionsPdf.tsx",
      "utils/exportPositionsXlsx.ts",
      "utils/brokerBreakoutReport.tsx",
      "components/Reporting/DownloadReportsTable.tsx",
    ],
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
