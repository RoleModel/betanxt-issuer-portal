// material-ui
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";

// ==============================|| PREVIEW LABEL — STYLE ||============================== //

/**
 * The caption chip.
 *
 * @remarks
 * Anchored to the right edge, which the fan always leaves visible — the Full
 * Set pieces overlap from the left, so a caption on that side is covered by
 * the piece in front of it. Pointer-transparent, so it never swallows the
 * click that opens the document underneath it. Clamped to two lines, which
 * fits every label the splitter writes without covering the whole page.
 */
const LabelChip = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 4,
  right: 8,
  maxWidth: "calc(100% - 44px)",
  padding: theme.spacing(0.375, 0.75),
  borderRadius: 3,
  backgroundColor: "rgba(0, 0, 0, 0.72)",
  color: theme.vars.palette.common.white,
  fontSize: 10,
  fontWeight: 600,
  lineHeight: 1.35,
  letterSpacing: 0.1,
  textAlign: "center",
  pointerEvents: "none",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
}));

interface PreviewLabelProps {
  readonly label: string;
}

// ==============================|| PREVIEW LABEL ||============================== //

/**
 * Names the document a preview is showing. At preview size a client's pieces
 * are hard to tell apart — notice, proxy statement and annual report share a
 * cover template — so the caption is what identifies them.
 */
const PreviewLabel = ({ label }: PreviewLabelProps) => (
  <LabelChip>{label}</LabelChip>
);

export default PreviewLabel;
