/**
 * Measurements shared between FeatureTile and the callers that lay out their
 * own previews inside it.
 *
 * These live outside FeatureTile.tsx because a module that exports both a
 * component and a plain value cannot be hot-replaced: Fast Refresh has no way
 * to tell whether the value changed, so it remounts the tree and drops the
 * state of everything on the page.
 */

/**
 * Display width of a tile preview. FeatureTile applies this to a preview in
 * its overlay slot; a caller filling the flow slot has to size its own, and
 * sharing this constant is what keeps the two the same size on a row where
 * both appear.
 */
export const featureTileThumbnailWidth = { xs: 120, sm: 140 } as const;
