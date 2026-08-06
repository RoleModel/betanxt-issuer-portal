"use client";

import { MailOutlineOutlined } from "@mui/icons-material";
import { Box, Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useTheme } from "@mui/material/styles";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";

import DocumentThumbnail from "@/components/Documents/DocumentThumbnail";
import FeatureTile from "@/components/FeatureTile";
import { brandConfigs } from "@/utils/brandConfig";

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

const formatNumber = (value: number | null | undefined): string =>
  value === null || value === undefined ? "0" : value.toLocaleString("en-US");

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
 * The three Primary Mailing Summary tiles (Full Set, NAA, Electronic), each
 * with a clickable thumbnail of exactly what was mailed. Full Set and NAA show
 * the generated PDF; Electronic shows the themed react-email notice. Clicking a
 * thumbnail opens the document viewer for a full-size preview.
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
        <DocumentThumbnail
          filePath={fullSetUrl}
          width={thumbnailWidth}
          onClick={() => {
            openPdf("Full Set — Complete Proxy Package", fullSetUrl);
          }}
        />
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
