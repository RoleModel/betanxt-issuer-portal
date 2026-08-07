/**
 * The files worth reading for the charts work.
 *
 * @remarks
 * A sample, not an inventory — one file per idea, so a reader gets the shape of
 * the directory without nineteen near-identical chart folders. The full list of
 * charts is in the inventory table on the spec page.
 *
 * Paths are repo-relative from `issuer-portal/` and are fetched at download
 * time from `/api/dev/source`, the route that already serves this app's source
 * to the developer overlay, so only issuer-portal files are listed here.
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
    folder: "current/charts-tabulation",
    label: "The Tabulation tab's charts",
    sectionId: "charts-directory",
    paths: [
      "components/Charts/index.ts",
      "app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx",
      "components/Charts/QuorumGauge/QuorumGaugeCard.tsx",
      "components/Charts/VoteMatrix/VoteMatrixChartCard.tsx",
      "components/Charts/VotingSource/VotingSourceChartCard.tsx",
      "components/Charts/HolderOutcome/HolderOutcomeChartCard.tsx",
    ],
  },
  {
    folder: "current/charts-elsewhere",
    label: "Charts on the reporting, reports, and chart-lab routes",
    sectionId: "charts-directory",
    paths: [
      "components/Charts/PositionsVoted/PositionsVotedChart.tsx",
      "components/Charts/BeneficialVsRegistered/BeneficialVsRegisteredCard.tsx",
      "components/Charts/VotingPerformance/VotingPerformanceChart.tsx",
      "components/Charts/GeoHeatmap/GeoHeatmapCard.tsx",
      "components/Charts/VoteDistribution/VoteDistributionChart.tsx",
      "components/Charts/ResponseRateTimeline/ResponseRateTimeline.tsx",
    ],
  },
  {
    folder: "current/charts-unrendered",
    label: "Chart components no route reaches",
    sectionId: "charts-directory",
    paths: [
      "components/Charts/SharesVoted/SharesVotedChart.tsx",
      "components/Charts/DirectorPerformance/DirectorPerformanceChart.tsx",
      "components/Charts/DirectorPerformance/IndividualDirectorChart.tsx",
      "components/Tabulation/SharesVotedCard.tsx",
    ],
  },
  {
    folder: "current/chart-shared",
    label: "The shared pieces in config/ and series/",
    sectionId: "charts-directory",
    paths: [
      "components/Charts/config/ConfiguredPieChart.tsx",
      "components/Charts/config/PieChartCenterLabel.tsx",
      "components/Charts/config/CustomLegend.tsx",
      "components/Charts/config/LegendToggle.tsx",
      "components/Charts/config/SkeletonChart.tsx",
      "components/Charts/series/vote-breakdown-chart-data.ts",
    ],
  },
  {
    folder: "current/data-sources",
    label: "The hooks behind the charts",
    sectionId: "charts-directory",
    paths: [
      "hooks/useTabulationInsights.ts",
      "hooks/useReporting.ts",
      "hooks/useGeoDistribution.ts",
      "hooks/use-voting-tabulation.ts",
      "components/Charts/ConsolidatedVote/useVoteBreakdown.ts",
      "components/Charts/QuorumTimeline/useQuorumTimeline.ts",
    ],
  },
  {
    folder: "current/display-control",
    label: "The display control and its mount points",
    sectionId: "display-control",
    paths: [
      "utils/tabulation-display.ts",
      "contexts/TabulationDisplayContext.tsx",
      "app/[clientTicker]/meeting/layout.tsx",
      "app/[clientTicker]/past-meeting/layout.tsx",
      "components/Navigation/EventTabs/MeetingNavigationBar.tsx",
      "components/Navigation/EventTabs/use-meeting-navigation.ts",
      "components/Charts/HolderOutcome/HolderTotalsBarLabels.tsx",
    ],
  },
  {
    folder: "current/exports",
    label: "The table and report exports",
    sectionId: "exports",
    paths: [
      "components/Tabulation/TabulationReportCard.tsx",
      "components/Tabulation/PositionsTable.tsx",
      "utils/exportTabulationPdf.tsx",
      "utils/exportPositionsPdf.tsx",
      "utils/exportPositionsXlsx.ts",
      "utils/reportPdfTheme.tsx",
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

const TABULATION: ScreenLink = {
  href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
  label: "Tabulation",
};
const CHART_LAB: ScreenLink = {
  href: "/WEN/meeting/wen-special-meeting-2026/tabulation/chart-lab",
  label: "Chart lab",
};
const REPORTING: ScreenLink = { href: "/WEN/reporting", label: "Reporting" };
const REPORTS: ScreenLink = {
  href: "/WEN/meeting/wen-special-meeting-2026/reports",
  label: "Reports",
};
const NOBO: ScreenLink = {
  href: "/WEN/meeting/wen-special-meeting-2026/nobo",
  label: "NOBO",
};

/**
 * Where each file is used, so a reviewer can go and look at it. Routes use the
 * WEN demo client, which is seeded with positions, proposals, and votes. Files
 * no route reaches are deliberately absent.
 */
export const SCREEN_LINKS: Record<string, readonly ScreenLink[]> = {
  "app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx": [TABULATION],
  "components/Charts/QuorumGauge/QuorumGaugeCard.tsx": [TABULATION],
  "components/Charts/VoteMatrix/VoteMatrixChartCard.tsx": [TABULATION],
  "components/Charts/VotingSource/VotingSourceChartCard.tsx": [TABULATION],
  "components/Charts/HolderOutcome/HolderOutcomeChartCard.tsx": [TABULATION],
  "components/Charts/HolderOutcome/HolderTotalsBarLabels.tsx": [TABULATION],
  "components/Charts/PositionsVoted/PositionsVotedChart.tsx": [REPORTING],
  "components/Charts/BeneficialVsRegistered/BeneficialVsRegisteredCard.tsx": [
    CHART_LAB,
  ],
  "components/Charts/VotingPerformance/VotingPerformanceChart.tsx": [REPORTING],
  "components/Charts/GeoHeatmap/GeoHeatmapCard.tsx": [REPORTING, NOBO],
  "components/Charts/VoteDistribution/VoteDistributionChart.tsx": [REPORTS],
  "components/Charts/ResponseRateTimeline/ResponseRateTimeline.tsx": [
    CHART_LAB,
  ],
  "components/Charts/ConsolidatedVote/useVoteBreakdown.ts": [CHART_LAB],
  "components/Charts/QuorumTimeline/useQuorumTimeline.ts": [REPORTING],
  "components/Charts/config/ConfiguredPieChart.tsx": [TABULATION, REPORTS],
  "components/Charts/config/PieChartCenterLabel.tsx": [TABULATION, REPORTING],
  "components/Charts/config/CustomLegend.tsx": [REPORTING],
  "components/Charts/config/LegendToggle.tsx": [TABULATION, REPORTS],
  "components/Charts/config/SkeletonChart.tsx": [REPORTING, REPORTS],
  "components/Charts/series/vote-breakdown-chart-data.ts": [TABULATION],
  "hooks/useTabulationInsights.ts": [TABULATION],
  "hooks/useReporting.ts": [REPORTING],
  "hooks/useGeoDistribution.ts": [REPORTING, NOBO],
  "hooks/use-voting-tabulation.ts": [CHART_LAB],
  "utils/tabulation-display.ts": [TABULATION],
  "contexts/TabulationDisplayContext.tsx": [TABULATION],
  "app/[clientTicker]/meeting/layout.tsx": [TABULATION],
  "app/[clientTicker]/past-meeting/layout.tsx": [TABULATION],
  "components/Navigation/EventTabs/MeetingNavigationBar.tsx": [TABULATION],
  "components/Navigation/EventTabs/use-meeting-navigation.ts": [TABULATION],
  "components/Tabulation/TabulationReportCard.tsx": [TABULATION],
  "components/Tabulation/PositionsTable.tsx": [TABULATION],
  "utils/exportTabulationPdf.tsx": [TABULATION],
  "utils/exportPositionsPdf.tsx": [TABULATION],
  "utils/exportPositionsXlsx.ts": [TABULATION],
  "utils/reportPdfTheme.tsx": [TABULATION],
};
