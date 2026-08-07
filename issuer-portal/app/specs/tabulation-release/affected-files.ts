/**
 * The files worth reading for the tabulation-release work.
 *
 * @remarks
 * A sample, not an inventory — one file per idea. Paths are repo-relative from
 * `issuer-portal/` and are fetched at download time from `/api/dev/source`, the
 * route that already serves this app's source to the developer overlay, so only
 * issuer-portal files are listed here. The mock-api side (the OpenAPI schema and
 * the meeting update transform) is shown in the Code section instead.
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
    folder: "current/events-list",
    label: "The CSM events list, its grid, and its cells",
    sectionId: "releasing-tabulation",
    paths: [
      "app/events/page.tsx",
      "components/Events/EventsDataGrid.tsx",
      "components/Events/eventsDataGridColumns.tsx",
      "components/Events/EventDataGridCells.tsx",
    ],
  },
  {
    folder: "current/gating",
    label: "The hook that gates the data, and the context it copies",
    sectionId: "withheld-tabulation-surfaces",
    paths: [
      "hooks/useTabulationInsights.ts",
      "contexts/TabulationDisplayContext.tsx",
      "app/[clientTicker]/meeting/layout.tsx",
    ],
  },
  {
    folder: "current/withheld-surfaces",
    label: "The four surfaces that change while tabulation is withheld",
    sectionId: "withheld-tabulation-surfaces",
    paths: [
      "app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx",
      "components/Charts/QuorumGauge/QuorumGaugeCard.tsx",
      "components/Meeting/TabulationTracker.tsx",
      "components/Meeting/tabulation-tracker/VoteProgressBar.tsx",
      "components/Meeting/tabulation-tracker/HistoricalShareCard.tsx",
      "components/EmptyState.tsx",
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
 * Where each file is used, so a reviewer can go and look at it. Meeting routes
 * use the WEN demo client, which is seeded with positions and proposals.
 */
export const SCREEN_LINKS: Record<string, readonly ScreenLink[]> = {
  "app/events/page.tsx": [
    {
      href: "/events",
      label: "Events — CSM list",
    },
  ],
  "components/Events/EventsDataGrid.tsx": [
    {
      href: "/events",
      label: "Events — batch release",
    },
  ],
  "components/Events/eventsDataGridColumns.tsx": [
    {
      href: "/events",
      label: "Events — CSM list",
    },
  ],
  "components/Events/EventDataGridCells.tsx": [
    {
      href: "/events",
      label: "Events — a status chip",
    },
  ],
  "hooks/useTabulationInsights.ts": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation",
    },
  ],
  "contexts/TabulationDisplayContext.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation",
    },
  ],
  "contexts/TabulationReleaseContext.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation",
    },
  ],
  "app/[clientTicker]/meeting/layout.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
      label: "Meeting dashboard",
    },
  ],
  "app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation — withheld",
    },
  ],
  "components/Charts/QuorumGauge/QuorumGaugeCard.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation — quorum card",
    },
  ],
  "components/Meeting/TabulationTracker.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
      label: "Meeting dashboard — withheld",
    },
  ],
  "components/Meeting/tabulation-tracker/VoteProgressBar.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
      label: "Meeting dashboard — withheld",
    },
  ],
  "components/Meeting/tabulation-tracker/HistoricalShareCard.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
      label: "Meeting dashboard — withheld",
    },
  ],
  "components/EmptyState.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
      label: "Tabulation — withheld",
    },
  ],
  "mock-api-server/openapi-schema/openapi.yaml": [
    {
      href: "/events",
      label: "Events — CSM list",
    },
  ],
};
