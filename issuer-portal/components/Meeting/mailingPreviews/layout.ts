/**
 * Every measurement the Primary Mailing Summary row is built from, and the
 * arithmetic that turns them into the row's three shapes.
 *
 * @remarks
 * These live apart from the component because they are the part worth reading
 * on their own: the row's behaviour is almost entirely a consequence of the
 * numbers below and the two container-query thresholds derived from them.
 * Kept inline they were a wall of commented constants between the imports and
 * the first line of markup.
 *
 * Nothing here touches React, so the thresholds can be asserted directly in a
 * test rather than inferred from a rendered tile.
 */
import { featureTileThumbnailWidth } from "@/components/featureTileMetrics";

/**
 * Every preview on the row is the same size — a lone NAA or Electronic
 * notice, and each piece of the Full Set fan alike — so the three tiles read
 * as one set of documents rather than three scales of them. A client whose
 * package has not been split shows its merged package as a single piece, and
 * that piece has to match NAA and Electronic exactly.
 */
export const previewWidth = featureTileThumbnailWidth;

/** Displayed width of a preview once the tiles lay out side by side. */
const overlayThumbnailWidth = previewWidth.sm;

/**
 * Pixel width the PDF page is rasterised at. Held at the widest a preview is
 * ever displayed so the canvas is never scaled up — see the render scale in
 * DocumentThumbnail, which multiplies this for high-DPI screens.
 */
export const thumbnailRenderWidth = previewWidth.sm;

/** How far each fanned Full Set piece is stepped past the one before it. */
export const fanStep = 110;

/** How far each fanned piece is stepped *down* from the one before it. */
export const fanRise = 5;

/** Where the first fanned piece sits below the tile's top edge. */
export const fanTop = 16;

/** Gap between tiles, in px — `theme.spacing(2)`, needed here as a number. */
export const tileGap = 16;

/**
 * Pieces the tile previews. A package can run to five or more, but a fan that
 * long forces Full Set on to a row of its own and strands its count far from
 * its thumbnails, so the tile shows the first few and leaves the rest to the
 * mailing materials list.
 */
export const maxPreviewedPieces = 3;

/**
 * Room a tile's count and label need beside its previews: the wider of the
 * two — "Electronic", at 83px, against a five-figure count at 72px — plus the
 * column's own padding. This is the least they can live with, not a
 * comfortable width: flex wraps a row by comparing flex-basis totals, before
 * flex-shrink gets a say, so an inflated figure here drops a tile to the next
 * row while there is still space for it. Understating it is the worse
 * failure, though — the tile then shrinks past the point where the label
 * clears the preview, and the two overlap.
 */
const labelColumnWidth = 116;

/**
 * Room the overlay slot holds to the right of the preview it positions —
 * FeatureTile's own inset and padding, which sit outside the preview's width
 * and so have to be counted separately when budgeting a tile.
 */
const overlayGutter = 36;

/** The same, for the flow slot, which insets its previews by padding alone. */
const flowGutter = 16;

/** Width the fan spans once `pieceCount` pieces are stepped across it. */
const fanWidth = (pieceCount: number): number =>
  overlayThumbnailWidth + Math.max(0, pieceCount - 1) * fanStep;

/** The widths a row of tiles is laid out against, for a given fan length. */
export interface TileMetrics {
  /** Flex basis for the Full Set tile, which has to hold its whole fan. */
  readonly fullSetBasis: number;
  /** Flex basis for NAA and Electronic, which hold one preview each. */
  readonly singleBasis: number;
  /** Container width at which NAA and Electronic can pair on one row. */
  readonly pairedWidth: number;
  /** Container width at which all three tiles fit on one row. */
  readonly oneRowWidth: number;
}

/**
 * The row's layout thresholds for a Full Set package of `pieceCount` pieces.
 *
 * @remarks
 * Each tile asks for the width its previews actually need: Full Set for its
 * whole fan — a piece, each one after it stepped {@link fanStep} further
 * along — and NAA and Electronic for a single preview, each on top of the
 * gutter its slot holds beside it and a column for the count and label. A
 * twelfth-based grid could not express that, and rounding Full Set up to a
 * whole row left its count stranded a long way from its fan.
 *
 * The row then has three shapes, chosen by the width of the card the tiles sit
 * in rather than of the window — the meeting sidebar takes a share of the
 * window that the tiles never see. Narrowest: a tile per row. Then Full Set
 * across the top with NAA and Electronic paired beneath it. Widest: all three
 * on one line. Letting flex wrap decide instead would stop halfway, pairing
 * Full Set with NAA and stranding Electronic alone on a row wide enough to
 * push its count and its preview to opposite ends of an empty card.
 */
export const tileMetrics = (pieceCount: number): TileMetrics => {
  const fullSetBasis = labelColumnWidth + fanWidth(pieceCount) + flowGutter;
  const singleBasis = labelColumnWidth + overlayThumbnailWidth + overlayGutter;

  return {
    fullSetBasis,
    singleBasis,
    pairedWidth: 2 * singleBasis + tileGap,
    oneRowWidth: fullSetBasis + 2 * singleBasis + 2 * tileGap,
  };
};
