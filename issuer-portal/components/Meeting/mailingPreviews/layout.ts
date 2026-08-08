/**
 * Every measurement the Primary Mailing Summary row is built from.
 *
 * @remarks
 * These live apart from the component because the row's behaviour is almost
 * entirely a consequence of the numbers below. Nothing here touches React, so
 * the layout thresholds can be asserted directly in a test rather than
 * inferred from a rendered tile.
 */

/**
 * Displayed width of every preview — a lone NAA or Electronic notice, and each
 * piece of the Full Set fan alike — so the three tiles read as one set of
 * documents rather than three scales of them.
 *
 * @remarks
 * Narrower on a phone so a three-piece fan still fits beside the count. The
 * alternative was dropping the fan to a single piece there, which cost the
 * Full Set tile the one thing that says it is a package.
 */
export const previewWidth = { xs: 100, sm: 140 } as const;

/**
 * Pixel width the PDF page is rasterised at. Held at the width a preview is
 * displayed so the canvas is never scaled up — see the render scale in
 * DocumentThumbnail, which multiplies this for high-DPI screens.
 */
export const thumbnailRenderWidth = previewWidth.sm;

/**
 * How far every preview is held in from the top and right edges of its tile.
 *
 * @remarks
 * One inset for all of them. A fan piece and a lone notice used to sit at
 * different distances from the edge — 16px against 36px — which read as a
 * mistake next to each other on the same row, because it was one.
 */
export const previewInset = 16;

/**
 * How far each fanned Full Set piece is stepped left of the one before it.
 * Tightened on a phone in step with {@link previewWidth}, so the fan keeps the
 * same proportion of each piece visible at either size.
 */
export const fanStep = { xs: 90, sm: 110 } as const;

/** How far each fanned piece is stepped down from the one before it. */
export const fanRise = 5;

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
 * column's own padding.
 *
 * @remarks
 * This is the least they can live with, not a comfortable width: flex wraps a
 * row by comparing flex-basis totals, before flex-shrink gets a say, so an
 * inflated figure here drops a tile to the next row while there is still space
 * for it. Understating it is the worse failure, though — the tile then shrinks
 * past the point where the label clears the preview, and the two overlap.
 */
const labelColumnWidth = 116;

/** Width the fan spans once `pieceCount` pieces are stepped across it. */
const fanWidth = (pieceCount: number): number =>
  previewWidth.sm + Math.max(0, pieceCount - 1) * fanStep.sm;

/**
 * Where a lone preview sits — NAA's and Electronic's.
 *
 * @remarks
 * Absolute against the tile's card, so it costs the tile no height and the
 * card's own `overflow: hidden` crops the bottom of the page. That crop is
 * deliberate: a whole page at this width would make the tile taller than the
 * count it belongs to, and the row is read as three counts, not three pages.
 */
export const singlePreviewPosition = {
  position: "absolute",
  top: previewInset,
  right: previewInset,
} as const;

/**
 * Where the `index`-th fanned Full Set piece sits.
 *
 * @remarks
 * Absolute at every width, from the same corner as a lone preview. The pieces
 * used to return to the document flow below `sm` and wrap beneath the count,
 * which is what broke the row on a phone: three in-flow pages made the tile
 * several times taller than its own text and pushed the next tile off screen.
 *
 * The whole fan shows at every width. It fits on a phone because the pieces
 * and their step both narrow there, rather than because some of them are
 * dropped.
 */
export const fanPiecePosition = (index: number) => ({
  position: "absolute",
  top: `${previewInset + index * fanRise}px`,
  right: {
    xs: `${previewInset + index * fanStep.xs}px`,
    sm: `${previewInset + index * fanStep.sm}px`,
  },
});

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
 * whole fan, NAA and Electronic for a single preview, each on top of the inset
 * it is held in by and a column for the count and label.
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
  const fullSetBasis = labelColumnWidth + fanWidth(pieceCount) + previewInset;
  const singleBasis = labelColumnWidth + previewWidth.sm + previewInset;

  return {
    fullSetBasis,
    singleBasis,
    pairedWidth: 2 * singleBasis + tileGap,
    oneRowWidth: fullSetBasis + 2 * singleBasis + 2 * tileGap,
  };
};
