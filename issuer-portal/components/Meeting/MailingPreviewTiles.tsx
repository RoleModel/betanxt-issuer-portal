"use client";

// material-ui
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { useTheme } from "@mui/material/styles";
// third-party
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useState } from "react";

// project imports
import FeatureTile from "@/components/FeatureTile";

import EmailPreview from "./mailingPreviews/EmailPreview";
import {
  fanPiecePosition,
  singlePreviewPosition,
  tileGap,
  tileMetrics,
} from "./mailingPreviews/layout";
import PiecePreview from "./mailingPreviews/PiecePreview";
import { useMailingPreviews } from "./mailingPreviews/useMailingPreviews";

// DocumentViewer is a large, modal-only component (pdf-lib, signature/upload
// hooks) — only needed once a thumbnail is clicked, so defer it out of the
// tile page's initial bundle.
const DocumentViewer = dynamic(
  async () => await import("@/components/Documents/DocumentViewer"),
  {
    ssr: false,
  }
);

/** The notice both the printed NAA and the Electronic email carry. */
const NOTICE_LABEL = "Notice of Internet Availability";

/** What the viewer is currently showing, if anything. */
interface ActivePreview {
  readonly title: string;
  readonly fileUrl: string;
  /** Electronic notices are HTML emails shown in the website (iframe) view. */
  readonly isWebsite: boolean;
}

const formatNumber = (value: number | null | undefined): string =>
  value === null || value === undefined ? "0" : value.toLocaleString("en-US");

interface MailingPreviewTilesProps {
  readonly loading: boolean;
  readonly fullSetPositions?: number | null;
  readonly naaPositions?: number | null;
  readonly electronicPositions?: number | null;
}

// ==============================|| MAILING PREVIEW TILES ||============================== //

/**
 * The three Primary Mailing Summary tiles (Full Set, NAA, Electronic). NAA and
 * Electronic each carry exactly one clickable preview of what was mailed, held
 * at the tile's right edge. Full Set is a package — proxy card, proxy
 * statement, annual report and so on, with issuers free to add to it — so its
 * count is fluid and the tile fans the first few pieces. Clicking any preview
 * opens the document viewer at full size.
 *
 * @remarks
 * The measurements and the row's three shapes live in `./mailingPreviews/layout`,
 * and everything the tiles preview is resolved by `useMailingPreviews`. What is
 * left here is the composition.
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

  const { fullSetPieces, naaUrl, electronicPngUrl, electronicUrl } =
    useMailingPreviews(ticker, theme.palette.primary.main);

  const openPdf = (title: string, fileUrl: string) => {
    setActivePreview({ title, fileUrl, isWebsite: false });
  };

  const { fullSetBasis, singleBasis, pairedWidth, oneRowWidth } = tileMetrics(
    fullSetPieces.length
  );

  const tiles = [
    {
      key: "full-set",
      subtitle: "Full Set",
      value: fullSetPositions,
      /**
       * Full Set leads the row — it is the whole package where the other two
       * are a single notice each — so it takes a brand-coloured left edge.
       * Filling the tile instead would say the same thing louder and less
       * accurately: its count is usually the smallest of the three, and the
       * fan of previews it carries loses contrast on a saturated surface.
       */
      accent: "primary" as const,
      thumbnail: (
        <>
          {fullSetPieces.map((piece, index) => (
            <Box key={piece.key} sx={fanPiecePosition(index)}>
              <PiecePreview
                label={piece.label}
                fileUrl={piece.fileUrl}
                onClick={() => {
                  openPdf(`Full Set — ${piece.label}`, piece.fileUrl);
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
      accent: undefined,
      thumbnail: (
        <Box sx={singlePreviewPosition}>
          <PiecePreview
            label={NOTICE_LABEL}
            fileUrl={naaUrl}
            onClick={() => {
              openPdf(`NAA — ${NOTICE_LABEL}`, naaUrl);
            }}
          />
        </Box>
      ),
    },
    {
      key: "electronic",
      subtitle: "Electronic",
      value: electronicPositions,
      accent: undefined,
      thumbnail: (
        <Box sx={singlePreviewPosition}>
          <EmailPreview
            label={NOTICE_LABEL}
            pngUrl={electronicPngUrl}
            onClick={() => {
              setActivePreview({
                title: `Electronic — ${NOTICE_LABEL}`,
                fileUrl: electronicUrl,
                isWebsite: true,
              });
            }}
          />
        </Box>
      ),
    },
  ];

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
                  accent={tile.accent}
                  title={formatNumber(tile.value)}
                  subtitle={tile.subtitle}
                >
                  {tile.thumbnail}
                </FeatureTile>
              )}
            </Box>
          );
        })}
      </Box>

      <DocumentViewer
        open={activePreview !== null}
        onClose={() => {
          setActivePreview(null);
        }}
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
