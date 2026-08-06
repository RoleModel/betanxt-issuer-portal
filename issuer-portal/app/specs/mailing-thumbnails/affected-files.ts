/**
 * The files worth reading for the mailing-thumbnail work.
 *
 * @remarks
 * A sample, not an inventory — one file per idea. Paths are repo-relative from
 * `issuer-portal/` and are fetched at download time from `/api/dev/source`, the
 * route that already serves this app's source to the developer overlay, so only
 * issuer-portal files are listed here. The mock-api files (the email template
 * and its preview route) are shown in the Code section instead.
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
    folder: "current/mailing-tiles",
    label: "The Mailing tab tiles and thumbnails",
    sectionId: "mailing-preview-thumbnails",
    paths: [
      "components/FeatureTile.tsx",
      "components/Meeting/MailingPreviewTiles.tsx",
      "components/Meeting/AdditionalMailingSummaryCard.tsx",
      "app/[clientTicker]/meeting/[meetingId]/mailing/page.tsx",
    ],
  },
  {
    folder: "current/document-preview",
    label: "Thumbnail and full-screen preview",
    sectionId: "mailing-preview-thumbnails",
    paths: [
      "components/Documents/DocumentThumbnail.tsx",
      "components/Documents/DocumentViewer.tsx",
    ],
  },
  {
    folder: "current/generators",
    label: "The mock-mailing PDF generator and splitter",
    sectionId: "generated-mailing-documents",
    paths: [
      "scripts/generate-mock-mailing-pdfs.tsx",
      "scripts/split-full-set-pdfs.ts",
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
 * Where each file is used, so a reviewer can go and look at it. Routes use the
 * WEN demo client, which is seeded with mailing data.
 */
export const SCREEN_LINKS: Record<string, readonly ScreenLink[]> = {
  "components/FeatureTile.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/mailing",
      label: "Mailing — Primary Mailing Summary",
    },
  ],
  "components/Meeting/MailingPreviewTiles.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/mailing",
      label: "Mailing — Primary Mailing Summary",
    },
  ],
  "components/Meeting/AdditionalMailingSummaryCard.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/mailing",
      label: "Mailing — Additional Mailing Summary",
    },
  ],
  "app/[clientTicker]/meeting/[meetingId]/mailing/page.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/mailing",
      label: "Mailing",
    },
  ],
  "components/Documents/DocumentThumbnail.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/mailing",
      label: "Mailing — a thumbnail",
    },
  ],
  "components/Documents/DocumentViewer.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/mailing",
      label: "Mailing — click a thumbnail",
    },
  ],
  "scripts/generate-mock-mailing-pdfs.tsx": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/mailing",
      label: "Mailing — Full Set / NAA previews",
    },
  ],
  "scripts/split-full-set-pdfs.ts": [
    {
      href: "/WEN/meeting/wen-special-meeting-2026/mailing",
      label: "Mailing — Full Set grid",
    },
  ],
};
