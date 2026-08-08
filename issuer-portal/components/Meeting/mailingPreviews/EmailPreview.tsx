// material-ui
import { MailOutlineOutlined } from "@mui/icons-material";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";

import { previewWidth } from "./layout";
// project imports
import PreviewLabel from "./PreviewLabel";

// ==============================|| EMAIL PREVIEW — STYLE ||============================== //

// Positioned by the caller, exactly like PiecePreview, so the Electronic and
// NAA previews sit at the same inset on their tiles.
const PreviewRoot = styled(Box)(({ theme }) => ({
  position: "relative",
  aspectRatio: "8.5 / 11",
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.vars.palette.divider}`,
  backgroundColor: theme.vars.palette.background.paper,
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    borderColor: theme.vars.palette.primary.main,
    boxShadow: theme.shadows[2],
    transform: "scale(1.02)",
  },
}));

// Shown until — or if — the PNG snapshot fails to load.
const FallbackIcon = styled(Box)(({ theme }) => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.vars.palette.text.disabled,
}));

const SnapshotImage = styled("img")({
  position: "relative",
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "top",
  display: "block",
});

interface EmailPreviewProps {
  readonly pngUrl: string;
  readonly label: string;
  readonly onClick: () => void;
}

// ==============================|| EMAIL PREVIEW ||============================== //

/**
 * A captioned preview of the Electronic notice email, shown as a pre-rendered
 * PNG snapshot (generated per client) cropped to the tile with object-fit
 * cover, so the reader sees what actually went out rather than a generic icon.
 */
const EmailPreview = ({ pngUrl, label, onClick }: EmailPreviewProps) => (
  <PreviewRoot
    className="email-preview"
    onClick={onClick}
    sx={{ width: previewWidth }}
  >
    <FallbackIcon>
      <MailOutlineOutlined fontSize="small" />
    </FallbackIcon>
    <SnapshotImage
      src={pngUrl}
      alt="Electronic notice preview"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
    <PreviewLabel label={label} />
  </PreviewRoot>
);

export default EmailPreview;
