"use client";

import { MailOutlineOutlined } from "@mui/icons-material";
import { Box, Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import useSWR from "swr";

import DocumentThumbnail from "@/components/Documents/DocumentThumbnail";
import FeatureTile from "@/components/FeatureTile";
import { brandConfigs } from "@/utils/brandConfig";

// DocumentViewer is a large, modal-only component (pdf-lib, signature/upload
// hooks) — only needed once a thumbnail is clicked, so defer it out of the
// tile page's initial bundle.
const DocumentViewer = dynamic(
  async () => await import("@/components/Documents/DocumentViewer"),
  {
    ssr: false,
  }
);

/** Mock-api base, matching the rest of the app's hooks. */
const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

/** Width, in px, of the single NAA / Electronic preview thumbnail. */
const thumbnailWidth = 60;

/**
 * Display width of one Full Set piece. Below sm the pieces stack under the
 * tile's count and label rather than fanning along its right edge, so they
 * shrink to a width that fits three to a row on a phone.
 */
const fullSetPieceWidth = { xs: 84, sm: 120 } as const;

/** Displayed width of a preview once the tiles lay out side by side. */
const overlayThumbnailWidth = fullSetPieceWidth.sm;

/** How far each fanned Full Set piece is stepped past the one before it. */
const fanStep = 110;

/** Gap between tiles, in px — `theme.spacing(2)`, needed here as a number. */
const tileGap = 16;

/**
 * Room a tile's count and label need beside its previews. This is the least
 * they can live with, not a comfortable width: flex wraps a row by comparing
 * flex-basis totals, before flex-shrink gets a say, so an inflated figure here
 * drops a tile to the next row while there is still space for it.
 */
const labelColumnWidth = 112;

/**
 * Pieces the tile previews. A package can run to five or more, but a fan that long forces Full Set on to a row of its own and strands its count far from its thumbnails, so the tile shows the first few and leaves the rest to the mailing materials list.
 */
const maxPreviewedPieces = 3;

/** Width the fan spans once `pieceCount` pieces are stepped across it. */
const fanWidth = (pieceCount: number): number =>
  overlayThumbnailWidth + Math.max(0, pieceCount - 1) * fanStep;

interface ActivePreview {
  readonly title: string;
  readonly fileUrl: string;
  /** Electronic notices are HTML emails shown in the website (iframe) view. */
  readonly isWebsite: boolean;
}

/** One piece of the Full Set package, thumbnailed in the tile's grid. */
interface FullSetItem {
  readonly key: string;
  readonly label: string;
  readonly fileUrl: string;
}

/**
 * The manifest written next to each client's split Full Set pieces by
 * scripts/split-full-set-pdfs.ts. It stands in for the mailing-materials
 * records the operations team will store in the database.
 */
interface PieceManifest {
  readonly pieces: readonly { readonly file: string; readonly label: string }[];
}

const isManifestPiece = (
  value: unknown
): value is { file: string; label: string } =>
  typeof value === "object" &&
  value !== null &&
  "file" in value &&
  typeof value.file === "string" &&
  "label" in value &&
  typeof value.label === "string";

const isPieceManifest = (value: unknown): value is PieceManifest => {
  if (typeof value !== "object" || value === null || !("pieces" in value)) {
    return false;
  }
  const { pieces } = value;
  return (
    Array.isArray(pieces) &&
    pieces.every((piece: unknown) => isManifestPiece(piece))
  );
};

const formatNumber = (value: number | null | undefined): string =>
  value === null || value === undefined ? "0" : value.toLocaleString("en-US");

/**
 * The Full Set pieces for this client, in mailing order — from the split
 * package's manifest, falling back to the merged package as a single piece so
 * the grid always has something to show.
 */
const toFullSetItems = (
  manifest: PieceManifest | undefined,
  ticker: string,
  fallbackUrl: string
): FullSetItem[] => {
  const fromManifest = (manifest?.pieces ?? []).map((piece) => ({
    key: piece.file,
    label: piece.label,
    fileUrl: `/mock-mailings/${ticker}/full-set/${piece.file}`,
  }));
  if (fromManifest.length > 0) return fromManifest;

  return [
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
  readonly fullSetPositions?: number | null;
  readonly naaPositions?: number | null;
  readonly electronicPositions?: number | null;
}

/**
 * The three Primary Mailing Summary tiles (Full Set, NAA, Electronic). NAA and
 * Electronic each carry exactly one clickable thumbnail of what was mailed,
 * held at the tile's right edge. Full Set is a package: a proxy card, proxy
 * statement, annual report and so on, with issuers free to add to it, so the
 * count is fluid and the tile fans the first {@link maxPreviewedPieces} of
 * them. Clicking any thumbnail opens the document viewer at full size.
 *
 * The row itself takes one of three shapes, chosen by the width of the card
 * the tiles sit in — see the container queries below.
 */
const MailingPreviewTiles = ({
  loading,
  fullSetPositions,
  naaPositions,
  electronicPositions,
}: MailingPreviewTilesProps) => {
  const theme = useTheme();
  const params = useParams<{ clientTicker?: string }>();
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(
    null
  );

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

  // The split pieces of this client's Full Set package — the prototype's
  // stand-in for the mailing materials the operations team stores in the
  // database. 404s (unsplit packages) resolve to undefined.
  const { data: pieceManifest } = useSWR<PieceManifest | undefined>(
    ticker.length > 0
      ? `/mock-mailings/${ticker}/full-set/manifest.json`
      : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) return undefined;
      const json: unknown = await response.json();
      return isPieceManifest(json) ? json : undefined;
    },
    { revalidateOnFocus: false }
  );

  const fullSetItems = useMemo(
    () =>
      toFullSetItems(pieceManifest, ticker, fullSetUrl).slice(
        0,
        maxPreviewedPieces
      ),
    [pieceManifest, ticker, fullSetUrl]
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
        <>
          {fullSetItems.map((item, index) => (
            <Box
              key={item.key}
              className="feature-tile-thumbnail"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                zIndex: 0,
                // From sm up the pieces fan along the tile's right edge, each
                // overlapping and stepping down from the one before it. Below
                // sm the tile is too narrow to spread them — the tail of the
                // fan lands outside the card — so they leave the overlay and
                // stack below the count and label as a wrapping row instead.
                flex: { xs: "0 0 auto", sm: "1 0 50%" },
                pr: { sm: 2 },
                position: { xs: "relative", sm: "absolute" },
                right: { sm: `${index * fanStep}px` },
                top: { sm: `${10 + index * 5}px` },
                "& > .MuiBox-root": {
                  width: fullSetPieceWidth,
                },
              }}
            >
              <DocumentThumbnail
                filePath={item.fileUrl}
                width={thumbnailWidth}
                onClick={() => {
                  openPdf(`Full Set — ${item.label}`, item.fileUrl);
                }}
              />
            </Box>
          ))}
        </>
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

  // Each tile asks for the width its previews actually need: Full Set for its
  // whole fan — a 140px piece, each one after it stepped 120px further along —
  // and NAA and Electronic for a single 140px preview, all on top of a column
  // for the count and label. A twelfth-based grid could not express that, and
  // rounding Full Set up to a whole row left its count stranded a long way
  // from its fan.
  const fullSetBasis = labelColumnWidth + fanWidth(fullSetItems.length);
  const singleBasis = labelColumnWidth + overlayThumbnailWidth;

  // The row has three shapes, and which one applies depends on the width of
  // the card the tiles sit in rather than of the window — the meeting sidebar
  // takes a share of the window that the tiles never see. Narrowest: a tile
  // per row. Then Full Set across the top with NAA and Electronic paired
  // beneath it. Widest: all three on one line. Letting flex wrap decide
  // instead would stop halfway, pairing Full Set with NAA and stranding
  // Electronic alone on a row wide enough to push its count and its preview
  // to opposite ends of an empty card.
  const pairedWidth = 2 * singleBasis + tileGap;
  const oneRowWidth = fullSetBasis + 2 * singleBasis + 2 * tileGap;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "stretch",
          gap: `${tileGap}px`,
          containerType: "inline-size",
        }}
      >
        {tiles.map((tile) => {
          const isFullSet = tile.key === "full-set";
          const basis = isFullSet ? fullSetBasis : singleBasis;

          return (
            <Box
              key={tile.key}
              sx={{
                display: "flex",
                minWidth: 0,
                flexGrow: basis,
                flexShrink: 1,
                flexBasis: "100%",
                [`@container (min-width: ${pairedWidth}px)`]: {
                  flexBasis: isFullSet
                    ? "100%"
                    : `calc(50% - ${tileGap / 2}px)`,
                },
                [`@container (min-width: ${oneRowWidth}px)`]: {
                  flexBasis: `${basis}px`,
                },
              }}
            >
              {loading ? (
                <Skeleton variant="rounded" height={80} sx={{ flexGrow: 1 }} />
              ) : (
                <FeatureTile
                  flex
                  height="auto"
                  variant="base"
                  title={formatNumber(tile.value)}
                  subtitle={tile.subtitle}
                  thumbnail={tile.thumbnail}
                  thumbnailLayout={isFullSet ? "flow" : "overlay"}
                />
              )}
            </Box>
          );
        })}
      </Box>

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
