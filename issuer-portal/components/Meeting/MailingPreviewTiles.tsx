"use client";

import { MailOutlineOutlined } from "@mui/icons-material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Box, Collapse, IconButton, Skeleton, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useTheme } from "@mui/material/styles";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import useSWR from "swr";

import type { components } from "@/domain-models/generated-schema";

import DocumentThumbnail from "@/components/Documents/DocumentThumbnail";
import FeatureTile from "@/components/FeatureTile";
import buildApiClient from "@/domain-models/apiClient";
import { brandConfigs } from "@/utils/brandConfig";

type Document = components["schemas"]["Document"];

// DocumentViewer is a large, modal-only component (pdf-lib, signature/upload
// hooks) — only needed once a thumbnail is clicked, so defer it out of the
// tile page's initial bundle.
const DocumentViewer = dynamic(
  async () => await import("@/components/Documents/DocumentViewer"),
  { ssr: false }
);

/** Mock-api base, matching the rest of the app's hooks. */
const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

/** Width, in px, of each preview thumbnail. */
const thumbnailWidth = 60;

interface ActivePreview {
  readonly title: string;
  readonly fileUrl: string;
  /** Electronic notices are HTML emails shown in the website (iframe) view. */
  readonly isWebsite: boolean;
}

/** One piece of the Full Set package, thumbnailed in the expanded row. */
interface FullSetItem {
  readonly key: string;
  readonly label: string;
  readonly fileUrl: string;
}

/**
 * The mailing pieces a Full Set package can contain, in mailing order. The
 * operations team stores these in the database per meeting, so which pieces
 * appear — typically 3–5 — varies by event and the row sizes to what exists.
 */
const FULL_SET_PIECES: readonly {
  readonly matches: (documentType: string) => boolean;
  readonly label: string;
}[] = [
  {
    matches: (documentType) => documentType.includes("proxy card"),
    label: "Proxy Card",
  },
  {
    matches: (documentType) => documentType === "vif",
    label: "Voter Information Form",
  },
  {
    matches: (documentType) =>
      documentType.includes("proxy statement") &&
      !documentType.includes("draft"),
    label: "Proxy Statement",
  },
  {
    matches: (documentType) => documentType.includes("annual report"),
    label: "Annual Report",
  },
  {
    matches: (documentType) => documentType.includes("10-k"),
    label: "Form 10-K",
  },
];

const hasNonEmptyString = (value: string | null | undefined): value is string =>
  value !== null && value !== undefined && value.length > 0;

const formatNumber = (value: number | null | undefined): string =>
  value === null || value === undefined ? "0" : value.toLocaleString("en-US");

/**
 * The Full Set pieces stored in the database for this meeting, in mailing
 * order. Falls back to the generated complete package when the database has
 * no individual pieces, so the expanded row is never empty.
 */
const toFullSetItems = (
  documents: readonly Document[] | undefined,
  fallbackUrl: string
): FullSetItem[] => {
  const items: FullSetItem[] = [];

  for (const piece of FULL_SET_PIECES) {
    const match = (documents ?? []).find(
      (document) =>
        hasNonEmptyString(document.type) &&
        hasNonEmptyString(document.filePath) &&
        hasNonEmptyString(document.id) &&
        piece.matches(document.type.toLowerCase())
    );
    if (match?.id !== undefined && hasNonEmptyString(match.filePath)) {
      items.push({
        key: match.id,
        label: piece.label,
        fileUrl: match.filePath,
      });
    }
  }

  return items.length > 0
    ? items
    : [
        {
          key: "full-set-package",
          label: "Complete Proxy Package",
          fileUrl: fallbackUrl,
        },
      ];
};

/**
 * A thumbnail of the Electronic notice email, shown as a pre-rendered PNG
 * snapshot (generated per client) cropped to the tile with object-fit cover,
 * so the reader sees what actually went out rather than a generic icon.
 */
const EmailThumbnail = ({
  pngUrl,
  onClick,
}: {
  readonly pngUrl: string;
  readonly onClick: () => void;
}) => (
  <Box
    onClick={onClick}
    sx={{
      position: "relative",
      width: thumbnailWidth,
      aspectRatio: "8.5 / 11",
      overflow: "hidden",
      borderRadius: 1,
      border: "1px solid",
      borderColor: "divider",
      backgroundColor: "background.paper",
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "primary.main",
        boxShadow: 2,
        transform: "scale(1.02)",
      },
    }}
  >
    {/* Fallback shown until — or if — the PNG snapshot fails to load. */}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "text.disabled",
      }}
    >
      <MailOutlineOutlined fontSize="small" />
    </Box>
    <Box
      component="img"
      src={pngUrl}
      alt="Electronic notice preview"
      onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
        event.currentTarget.style.display = "none";
      }}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "top",
        display: "block",
      }}
    />
  </Box>
);

interface MailingPreviewTilesProps {
  readonly loading: boolean;
  readonly meetingId?: string;
  readonly fullSetPositions?: number | null;
  readonly naaPositions?: number | null;
  readonly electronicPositions?: number | null;
}

/**
 * The three Primary Mailing Summary tiles (Full Set, NAA, Electronic). NAA and
 * Electronic each carry exactly one clickable thumbnail of what was mailed.
 * Full Set holds a variable number of pieces, so its tile toggles an
 * expandable row beneath the tiles — mirroring the tabulation table's
 * expandable rows — showing one thumbnail per piece, pulled from the meeting's
 * documents in the database. Clicking any thumbnail opens the document viewer
 * for a full-size preview.
 */
const MailingPreviewTiles = ({
  loading,
  meetingId,
  fullSetPositions,
  naaPositions,
  electronicPositions,
}: MailingPreviewTilesProps) => {
  const theme = useTheme();
  const params = useParams<{ clientTicker?: string }>();
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(
    null
  );
  const [fullSetExpanded, setFullSetExpanded] = useState(false);

  const ticker =
    typeof params.clientTicker === "string"
      ? params.clientTicker.toUpperCase()
      : "";

  // Brand name and colour drive the Electronic email's per-client theming.
  // The legal name is the brandConfigs key (e.g. "The Wendy's Company").
  const [companyLegal, brand] = useMemo(
    () =>
      Object.entries(brandConfigs).find(
        ([, config]) => config.ticker?.toUpperCase() === ticker
      ) ?? [undefined, undefined],
    [ticker]
  );
  const company = brand?.companyName ?? ticker;
  const brandColor = brand?.primaryColor ?? theme.palette.primary.main;

  const fullSetUrl = `/mock-mailings/${ticker}/full-set.pdf`;
  const naaUrl = `/mock-mailings/${ticker}/naa.pdf`;
  const electronicPngUrl = `/mock-mailings/${ticker}/electronic.png`;

  // The Full Set pieces live in the meeting's documents — the operations team
  // stores mailing materials in the database, so nothing is uploaded here.
  const { data: meetingDocuments } = useSWR<Document[]>(
    hasNonEmptyString(meetingId)
      ? `/meetings/${meetingId}/documents?context=mailing-full-set`
      : null,
    async () => {
      if (!hasNonEmptyString(meetingId)) return [];

      const apiClient = await buildApiClient();
      const { data, error } = await apiClient.GET(
        "/meetings/{meetingId}/documents",
        { params: { path: { meetingId } } }
      );

      if (error) throw new Error("Unable to load meeting documents");

      return data ?? [];
    },
    { revalidateOnFocus: false }
  );

  const fullSetItems = useMemo(
    () => toFullSetItems(meetingDocuments, fullSetUrl),
    [meetingDocuments, fullSetUrl]
  );

  // Every client-identifying field must be overridden here — the preview
  // route's fixture defaults are Woodward's real notice copy, so any field
  // left unset would leak Woodward's legal name, proxy links, and contact
  // emails into other clients' previews.
  const electronicUrl = useMemo(
    () =>
      `${apiBase}/emails/preview?${new URLSearchParams({
        template: "mailing-electronic-notice",
        format: "html",
        company,
        companyLegal: companyLegal ?? company,
        color: brandColor,
        proxyPushUrl: `https://www.proxypush.com/${ticker}`,
        proxyPushLabel: `www.proxypush.com/${ticker}`,
        voteSiteUrl: `https://www.proxydocs.com/${ticker}`,
        ...(brand
          ? {
              printedContactEmail: `investor.relations@${brand.domain}`,
              questionsContactEmail: `proxyvoting@${brand.domain}`,
            }
          : {}),
      }).toString()}`,
    [company, companyLegal, brandColor, ticker, brand]
  );

  const fullSetRowOpen = fullSetExpanded && !loading;

  const openPdf = (title: string, fileUrl: string) => {
    setActivePreview({ title, fileUrl, isWebsite: false });
  };

  const closePreview = () => {
    setActivePreview(null);
  };

  const tiles: {
    key: string;
    subtitle: string;
    value: number | null | undefined;
    thumbnail: React.ReactNode;
  }[] = [
    {
      key: "full-set",
      subtitle: "Full Set",
      value: fullSetPositions,
      thumbnail: (
        <IconButton
          aria-expanded={fullSetExpanded}
          aria-label={`${fullSetExpanded ? "Hide" : "Show"} full set contents`}
          onClick={() => {
            setFullSetExpanded((expanded) => !expanded);
          }}
          size="small"
        >
          {fullSetExpanded ? (
            <KeyboardArrowUpIcon />
          ) : (
            <KeyboardArrowDownIcon />
          )}
        </IconButton>
      ),
    },
    {
      key: "naa",
      subtitle: "NAA",
      value: naaPositions,
      thumbnail: (
        <DocumentThumbnail
          filePath={naaUrl}
          width={thumbnailWidth}
          onClick={() => {
            openPdf("NAA — Notice of Internet Availability", naaUrl);
          }}
        />
      ),
    },
    {
      key: "electronic",
      subtitle: "Electronic",
      value: electronicPositions,
      thumbnail: (
        <EmailThumbnail
          pngUrl={electronicPngUrl}
          onClick={() => {
            setActivePreview({
              title: "Electronic — Notice of Internet Availability",
              fileUrl: electronicUrl,
              isWebsite: true,
            });
          }}
        />
      ),
    },
  ];

  return (
    <>
      <Grid container spacing={2}>
        {tiles.map((tile) => (
          <Grid key={tile.key} size={{ xs: 12, md: 4 }}>
            {loading ? (
              <Skeleton variant="rounded" height={80} />
            ) : (
              <FeatureTile
                height="auto"
                variant="base"
                title={formatNumber(tile.value)}
                subtitle={tile.subtitle}
                thumbnail={tile.thumbnail}
              />
            )}
          </Grid>
        ))}
      </Grid>

      {/* The Full Set contents, one thumbnail per piece stored for the
          meeting. The row wraps fluidly so 3, 4, or 5 pieces all read well. */}
      <Collapse in={fullSetRowOpen} unmountOnExit>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            p: 2,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.default",
          }}
        >
          {fullSetItems.map((item) => (
            <Box
              key={item.key}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                width: 96,
              }}
            >
              <DocumentThumbnail
                filePath={item.fileUrl}
                width={thumbnailWidth}
                onClick={() => {
                  openPdf(`Full Set — ${item.label}`, item.fileUrl);
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>

      <DocumentViewer
        open={activePreview !== null}
        onClose={closePreview}
        fileUrl={activePreview?.fileUrl}
        title={activePreview?.title}
        isWebsiteView={activePreview?.isWebsite ?? false}
        signatureAreas={[]}
        hideActivityButtons
        showDownloadButton={activePreview?.isWebsite === false}
      />
    </>
  );
};

export default MailingPreviewTiles;
