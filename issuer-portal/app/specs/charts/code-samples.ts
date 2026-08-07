/**
 * Reference code attached to the charts requirements.
 *
 * @remarks
 * Stored as strings so the page can show and download them without the build
 * compiling them. All but one are abridged from code that ships today; the
 * exception is the fix sketched for CHT2-10.
 */

import type { CodeSample } from "@/app/specs/ui-enhancements/code-samples";

const CHARTS_INDEX = `// components/Charts/index.ts (abridged).
// Re-exports the chart components. No file imports it — every consumer imports
// the chart's own path, so this list is not the entry point it looks like.

export { default as BeneficialVsRegisteredCard } from "./BeneficialVsRegistered/BeneficialVsRegisteredCard";
export * from "./ConsolidatedVote/ConsolidatedVoteChart";
export * from "./ConsolidatedVote/useVoteBreakdown";
export { default as QuorumGaugeCard } from "./QuorumGauge/QuorumGaugeCard";
export { default as VoteMatrixChartCard } from "./VoteMatrix/VoteMatrixChartCard";
// …nineteen chart components in all, plus their hooks and data helpers.

// app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx — how it is
// actually done everywhere:
import QuorumGaugeCard from "@/components/Charts/QuorumGauge/QuorumGaugeCard";
import VoteMatrixChartCard from "@/components/Charts/VoteMatrix/VoteMatrixChartCard";
`;

const TABULATION_HOOK = `// hooks/useTabulationInsights.ts (abridged) — the Tabulation tab's data.
// Four typed calls in one Promise.all inside a useEffect, plus one raw fetch.

const [positionsResult, proposalsResult, meetingResult, tabulationReportResult] =
  await Promise.all([
    apiClient.GET("/positions", { params: { query: { meetingId, limit: 5000 } } }),
    apiClient.GET("/meetings/{meetingId}/proposals", { params: { path: { meetingId } } }),
    apiClient.GET("/meetings/{meetingId}", { params: { path: { meetingId } } }),
    apiClient.GET("/meetings/{meetingId}/tabulation-report", { params: { path: { meetingId } } }),
  ]);

// /position_votes has no generated operation, so it is fetched directly.
const response = await fetch(
  \`\${baseUrl}/position_votes?meetingId=\${encodeURIComponent(meetingId)}&limit=10000\`
);

// app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx — each card gets a
// projection of that one result.
const { proposals, filteredPositions, quorumGauge, voteMatrixProposals, loading, clientTicker } =
  useTabulationInsights(currentMeeting?.id, currentMeeting);

<QuorumGaugeCard model={quorumGauge} loading={loading} />
<VoteMatrixChartCard loading={loading} proposals={voteMatrixProposals} />
`;

const VOTE_MATRIX_COMPOSITION = `// components/Charts/VoteMatrix/VoteMatrixChartCard.tsx (abridged) — one card
// holding two, which is why neither child fetches: the filter state is shared.

const VoteMatrixChartCard = ({ loading, proposals }: VoteMatrixChartCardProps) => {
  const [hiddenOutcomeKeys, setHiddenOutcomeKeys] = useState<ReadonlySet<VoteOutcomeKey>>(() => new Set());
  const [hiddenSourceIds, setHiddenSourceIds] = useState<ReadonlySet<VoteSourceId>>(() => new Set());
  const [hiddenHolderTypes, setHiddenHolderTypes] = useState<ReadonlySet<HolderType>>(() => new Set());
  const [selectedProposalId, setSelectedProposalId] = useState("");

  const selectedProposal =
    proposals.find((proposal) => proposal.proposalId === selectedProposalId) ?? proposals.at(0);
  const rows = selectedProposal?.rows ?? [];
  const totalShares = rows.reduce((sum, row) => sum + sumRowOutcomes(row), 0);

  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { lg: "minmax(0, 1fr) minmax(0, 1fr)", xs: "1fr" } }}>
      <VotingSourceChartCard
        hiddenSourceIds={hiddenSourceIds}
        loading={loading}
        onSourceToggle={toggleSource}
        rows={rows}
        totalShares={totalShares}
      />
      <HolderOutcomeChartCard
        hiddenHolderTypes={hiddenHolderTypes}
        hiddenOutcomeKeys={hiddenOutcomeKeys}
        loading={loading}
        onProposalChange={setSelectedProposalId}
        proposals={proposals}
        rows={rows}
        selectedProposalId={selectedProposal?.proposalId ?? ""}
        totalShares={totalShares}
      />
    </Box>
  );
};
`;

const METRIC_FORMATTER = `// utils/tabulation-display.ts — the whole file.
// One call yields both readings, so a label and its tooltip cannot disagree.

export type TabulationDisplayMode = "numbers" | "percentages";

interface TabulationMetric {
  readonly alternate: string;
  readonly display: string;
}

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const formatPercentage = (value: number, total: number): string => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return \`\${percentage.toFixed(2)}%\`;
};

export const formatTabulationMetric = (
  value: number,
  total: number,
  displayMode: TabulationDisplayMode
): TabulationMetric => {
  const numberValue = numberFormatter.format(value);
  const percentageValue = formatPercentage(value, total);

  return displayMode === "numbers"
    ? { alternate: percentageValue, display: numberValue }
    : { alternate: numberValue, display: percentageValue };
};

export const formatTabulationPercentage = (value: number): string =>
  \`\${value.toFixed(2)}%\`;
`;

const DISPLAY_CONTEXT = `// contexts/TabulationDisplayContext.tsx — the whole provider.
// Plain useState, default "percentages": the choice does not survive a reload
// and does not appear in the URL. The hook throws without a provider, which is
// why PositionsVotedChart cannot call it (CHT2-10).

export const TabulationDisplayProvider = ({ children }: { readonly children: ReactNode }) => {
  const [displayMode, setDisplayMode] = useState<TabulationDisplayMode>("percentages");

  // React Compiler is deliberately not enabled (see issuer-portal/next.config.ts),
  // so this memo is load-bearing for context consumer stability.
  const value = useMemo<TabulationDisplayContextValue>(
    () => ({ displayMode, setDisplayMode }),
    [displayMode]
  );

  return (
    <TabulationDisplayContext.Provider value={value}>{children}</TabulationDisplayContext.Provider>
  );
};

export const useTabulationDisplay = (): TabulationDisplayContextValue => {
  const context = useContext(TabulationDisplayContext);

  if (context === null) {
    throw new Error("useTabulationDisplay must be used within a TabulationDisplayProvider");
  }

  return context;
};

// components/Navigation/EventTabs/MeetingNavigationBar.tsx — the control.
<ToggleButtonGroup
  exclusive
  aria-label="Tabulation display format"
  size="small"
  value={displayMode}
  onChange={(event, nextDisplayMode: string | null) => {
    void event;
    if (nextDisplayMode === "numbers" || nextDisplayMode === "percentages") {
      setDisplayMode(nextDisplayMode);
    }
  }}
>
  <DisplayToggleButton value="percentages" aria-label="View as Percentages">Percentage</DisplayToggleButton>
  <DisplayToggleButton value="numbers" aria-label="View as Numbers">Count</DisplayToggleButton>
</ToggleButtonGroup>
`;

const DISPLAY_GAP = `// components/Charts/PositionsVoted/PositionsVotedChart.tsx (CHT2-10).
// It renders on /[clientTicker]/reporting, outside the meeting layouts where
// TabulationDisplayProvider is mounted, so it grew its own formatters.

// AS BUILT — a second, private copy of the formatting rules:
const positionCountFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const formatPositionCount = (value: number): string => positionCountFormatter.format(value);

const formatPositionPercentage = (value: number, total: number): string => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return \`\${percentage.toFixed(2)}%\`;
};

// This chart renders outside TabulationDisplayProvider, so there
// is no display mode to follow; always lead with the count.
valueFormatter: (item) =>
  \`\${formatPositionCount(item.value)} (\${formatPositionPercentage(item.value, centerValue)})\`,

// PROPOSED — a hook that tolerates a missing provider, so the fallback is
// stated once rather than reinvented per chart.
export const useDisplayModeOrDefault = (): TabulationDisplayMode => {
  const context = useContext(TabulationDisplayContext);
  return context?.displayMode ?? "percentages";
};

valueFormatter: (item) => {
  const metric = formatTabulationMetric(item.value, centerValue, displayMode);
  return \`\${metric.display} (\${metric.alternate})\`;
},
`;

const REPORT_TILE_EXPORT = `// components/Tabulation/TabulationReportCard.tsx (abridged) — CHT2-12.
// The tile beside the quorum gauge. It builds the rows, then loads the writer.

const isDataReady = !!(currentMeeting && votingProposals.length > 0);

const handleDownload = async (): Promise<void> => {
  // …builds tabulationData: quorum figures plus one row per proposal…

  // Loaded on demand: a static import pulls @react-pdf into the tabulation
  // page's chunk, where parsing it contributes to long animation frames even
  // though no PDF is produced until this handler runs.
  const { exportTabulationPdf } = await import("@/utils/exportTabulationPdf");
  await exportTabulationPdf({ tabulationData, clientTicker: currentMeeting.ticker });
};

<FeatureTile
  title={isMeetingConcluded ? "Final Tabulation Results" : "Preliminary Tabulation Results"}
  description="Results for each proposal, showing vote counts, percentages, and quorum status."
  actionText={isDataReady ? "Download Report" : "Loading..."}
  onClick={handleDownload}
  sx={{ opacity: isDataReady ? 1 : 0.6, cursor: isDataReady ? "pointer" : "default" }}
/>
`;

const POSITIONS_TABLE_EXPORT = `// components/Tabulation/PositionsTable.tsx (abridged) — CHT2-13, CHT2-14.
// The comment below is the reason both writers are loaded on click.

// The PDF and spreadsheet writers are loaded on demand. Imported statically
// they pulled @react-pdf/pdfkit and xlsx (~2.4MB) into this page's chunk, and
// parsing them on load was a measurable chunk of the tabulation page's long
// animation frames even though neither is needed until an export is clicked.
const handleExportPdf = async (): Promise<void> => {
  if (isExporting) return;
  setIsExporting(true);

  try {
    const { exportPositionsToPdf } = await import("@/utils/exportPositionsPdf");
    await exportPositionsToPdf({ clientTicker, meetingTitle, positions: collectExportPositions() });
    setIsExporting(false);
  } catch {
    setIsExporting(false);
  }
};

const handleExportXlsx = async (): Promise<void> => {
  const { exportPositionsToXlsx } = await import("@/utils/exportPositionsXlsx");
  exportPositionsToXlsx({ clientTicker, meetingTitle, positions: collectExportPositions() });
};

// Two items added to the grid toolbar; the grid's own CSV and print buttons are
// switched off, so these two are the whole menu.
slotProps={{
  toolbar: {
    additionalExportMenuItems: (onMenuItemClick) => [
      <MenuItem disabled={isExporting} key="export-pdf" onClick={() => { onMenuItemClick(); void handleExportPdf(); }}>
        {isExporting ? "Generating PDF…" : "Export as PDF"}
      </MenuItem>,
      <MenuItem key="export-excel" onClick={() => { onMenuItemClick(); void handleExportXlsx(); }}>
        Export as Excel
      </MenuItem>,
    ],
    csvOptions: { disableToolbarButton: true },
    printOptions: { disableToolbarButton: true },
  },
}}
`;

export const CODE_SAMPLES: readonly CodeSample[] = [
  {
    asBuilt: true,
    code: CHARTS_INDEX,
    filename: "components/Charts/index.ts",
    language: "typescript",
    satisfies: ["CHT2-01"],
    sectionId: "charts-directory",
    title: "The index that nothing imports",
  },
  {
    asBuilt: true,
    code: TABULATION_HOOK,
    filename: "hooks/useTabulationInsights.ts",
    language: "tsx",
    satisfies: ["CHT2-03", "CHT2-04"],
    sectionId: "charts-directory",
    title: "One hook behind the Tabulation tab",
  },
  {
    asBuilt: true,
    code: VOTE_MATRIX_COMPOSITION,
    filename: "components/Charts/VoteMatrix/VoteMatrixChartCard.tsx",
    language: "tsx",
    satisfies: ["CHT2-01", "CHT2-02"],
    sectionId: "charts-directory",
    title: "One card composing two charts",
  },
  {
    asBuilt: true,
    code: METRIC_FORMATTER,
    filename: "utils/tabulation-display.ts",
    language: "typescript",
    satisfies: ["CHT2-07"],
    sectionId: "display-control",
    title: "The formatter that returns both readings",
  },
  {
    asBuilt: true,
    code: DISPLAY_CONTEXT,
    filename: "contexts/TabulationDisplayContext.tsx",
    language: "tsx",
    satisfies: ["CHT2-06", "CHT2-08"],
    sectionId: "display-control",
    title: "The provider and the toggle",
  },
  {
    code: DISPLAY_GAP,
    filename: "components/Charts/PositionsVoted/PositionsVotedChart.tsx",
    language: "tsx",
    satisfies: ["CHT2-10"],
    sectionId: "display-control",
    title: "The one chart the toggle cannot switch, and the fix",
  },
  {
    asBuilt: true,
    code: REPORT_TILE_EXPORT,
    filename: "components/Tabulation/TabulationReportCard.tsx",
    language: "tsx",
    satisfies: ["CHT2-12", "CHT2-14"],
    sectionId: "exports",
    title: "The tabulation report's PDF download",
  },
  {
    asBuilt: true,
    code: POSITIONS_TABLE_EXPORT,
    filename: "components/Tabulation/PositionsTable.tsx",
    language: "tsx",
    satisfies: ["CHT2-13", "CHT2-14"],
    sectionId: "exports",
    title: "The positions grid's PDF and Excel items",
  },
];
