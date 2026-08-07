// material-ui
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";

// project imports
import DocumentThumbnail from "@/components/Documents/DocumentThumbnail";

import { thumbnailRenderWidth } from "./layout";
import PreviewLabel from "./PreviewLabel";

// =====|| PIECE PREVIEW — STYLE ||============================== //

// Positions the caption against the page rather than the tile.
const PreviewRoot = styled(Box)({
  position: "relative",
  width: "100%",
});

interface PiecePreviewProps {
  readonly label: string;
  readonly fileUrl: string;
  readonly onClick: () => void;
}

// =====|| PIECE PREVIEW ||============================== //

/** A captioned preview of one printed piece — a Full Set piece, or the NAA. */
const PiecePreview = ({ label, fileUrl, onClick }: PiecePreviewProps) => (
  <PreviewRoot>
    <DocumentThumbnail
      filePath={fileUrl}
      width={thumbnailRenderWidth}
      onClick={onClick}
    />
    <PreviewLabel label={label} />
  </PreviewRoot>
);

export default PiecePreview;
