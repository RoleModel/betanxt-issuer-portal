/**
 * Builds the fixed, nine-role palette used by every voting chart.
 *
 * @param primaryColor - The active client's approved primary brand color.
 * @param secondaryColor - The active client's approved secondary brand color.
 * @returns Chart colors in the semantic order documented in the repository
 * README: Registered, Beneficial, Web, Print, IVR, For, Against, Abstain, and
 * Withhold.
 *
 * @remarks
 * Only the holder and source roles are derived from client branding. Outcome
 * roles intentionally remain semantic so an expressive client brand cannot
 * make vote results harder to distinguish. Native CSS `color-mix()` keeps the
 * derived source colors responsive to the active theme without baking a
 * resolved color into application code.
 */
export const generateChartPalette = (
  primaryColor: string,
  secondaryColor: string
): readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
] => [
  primaryColor,
  secondaryColor,
  `color-mix(in oklch, ${secondaryColor} 82%, ${primaryColor} 18%)`,
  `color-mix(in oklch, ${secondaryColor} 72%, white 28%)`,
  `color-mix(in oklch, ${secondaryColor} 72%, black 28%)`,
  "oklch(57% 0.15 175)",
  "oklch(56% 0.2 28)",
  "oklch(78% 0.16 85)",
  "oklch(48% 0.11 250)",
];

/**
 * Semantic CSS-variable references for vote-related charts.
 *
 * Each role exposes its background color and the foreground that was computed
 * for that exact color. Use `contrastColor` for labels or text placed over an
 * arc, bar, or progress indicator; do not substitute a global primary or
 * secondary contrast token.
 */
export const voteChartColors = {
  holders: {
    registered: {
      color: "var(--mui-palette-voteChart-registered-main)",
      contrastColor: "var(--mui-palette-voteChart-registered-contrastText)",
    },
    beneficial: {
      color: "var(--mui-palette-voteChart-beneficial-main)",
      contrastColor: "var(--mui-palette-voteChart-beneficial-contrastText)",
    },
  },
  sources: {
    web: {
      color: "var(--mui-palette-voteChart-web-main)",
      contrastColor: "var(--mui-palette-voteChart-web-contrastText)",
    },
    print: {
      color: "var(--mui-palette-voteChart-print-main)",
      contrastColor: "var(--mui-palette-voteChart-print-contrastText)",
    },
    ivr: {
      color: "var(--mui-palette-voteChart-ivr-main)",
      contrastColor: "var(--mui-palette-voteChart-ivr-contrastText)",
    },
  },
  outcomes: {
    for: {
      color: "var(--mui-palette-voteChart-for-main)",
      contrastColor: "var(--mui-palette-voteChart-for-contrastText)",
    },
    against: {
      color: "var(--mui-palette-voteChart-against-main)",
      contrastColor: "var(--mui-palette-voteChart-against-contrastText)",
    },
    abstain: {
      color: "var(--mui-palette-voteChart-abstain-main)",
      contrastColor: "var(--mui-palette-voteChart-abstain-contrastText)",
    },
    withhold: {
      color: "var(--mui-palette-voteChart-withhold-main)",
      contrastColor: "var(--mui-palette-voteChart-withhold-contrastText)",
    },
  },
} as const;
