// material-ui
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";

// project imports
import DocumentThumbnail from "@/components/Documents/DocumentThumbnail";

import { previewWidth, thumbnailRenderWidth } from "./layout";
import PreviewLabel from "./PreviewLabel";

// =====|| PIECE PREVIEW — STYLE ||============================== //

/**
 * Sizes the preview and anchors its caption to the page rather than the tile.
 *
 * @remarks
 * `relative`, not `absolute`: the caller decides where a preview sits — a fan
 * piece is stepped by its index, a lone one is inset from the corner — and
 * this only has to be the caption's containing block. Absolute here also made
 * `width: 100%` resolve against the tile's card instead of the preview, which
 * stretched the page to the full width of the tile.
 */
const PreviewRoot = styled(Box)({
  position: "relative",
  // The thumbnail rasterises at a fixed pixel width so the canvas is sharp;
  // this makes what it *displays* follow the preview instead, which is what
  // narrows the fan on a phone. Styling its own child, not a caller's.
  "& > .MuiBox-root": { width: "100%" },
});

interface PiecePreviewProps {
  readonly label: string;
  readonly fileUrl: string;
  readonly onClick: () => void;
}

// =====|| PIECE PREVIEW ||============================== //

/** A captioned preview of one printed piece — a Full Set piece, or the NAA. */
const PiecePreview = ({ label, fileUrl, onClick }: PiecePreviewProps) => (
  <PreviewRoot className="mailing-preview" sx={{ width: previewWidth }}>
    <DocumentThumbnail
      filePath={fileUrl}
      width={thumbnailRenderWidth}
      onClick={onClick}
    />
    <PreviewLabel label={label} />
  </PreviewRoot>
);

export default PiecePreview;
