/* eslint-disable sort-keys -- Object order mirrors the documented chart-role sequence. */

/**
 * Builds the fixed, nine-role palette used by every voting chart.
 *
 * @param primaryColor - The active client's approved primary brand color.
 * @param secondaryColor - The active client's approved secondary brand color.
 * @param colorScheme - The active scheme. Dark source fills are lightened so
 * their patterns remain visible against the portal's dark canvas.
 * @returns Chart colors in the semantic order documented in the repository
 * README: Registered, Beneficial, Web, Print, IVR, For, Against, Abstain, and
 * Withhold.
 *
 * @remarks
 * Holder roles are derived directly from client branding. Source roles rotate
 * the primary hue by fixed channel offsets, keeping Web, Print, and IVR
 * visually distinct from both holder categories in every client theme.
 * Outcome roles intentionally remain semantic so an expressive client brand
 * cannot make vote results harder to distinguish. Native CSS color functions
 * keep the derived source colors responsive to the active theme without
 * baking a resolved color into app code.
 */
const sourceChannelHueOffsets = {
  ivr: 280,
  print: 190,
  web: 100,
} as const;

/**
 * Creates a source-channel color that is recognizable across client brands.
 *
 * @param hueOffset - Rotation from the client's primary hue for the voting
 * source's semantic role.
 * @param primaryColor - The active client's primary brand color.
 * @param colorScheme - The scheme receiving the channel color.
 * @returns A valid native CSS color expression for the source role.
 *
 * @remarks
 * The fixed lightness and chroma make channels stable and readable, while the
 * hue rotation keeps them visually related to the brand without becoming
 * Registered or Beneficial. The dark scheme adds white in a second
 * `color-mix()` because the CSS function accepts exactly two colors.
 */
const createSourceChannelColor = (
  hueOffset: number,
  primaryColor: string,
  colorScheme: "dark" | "light"
): string => {
  const brandTinted = `oklch(from ${primaryColor} 52% 0.14 calc(h + ${hueOffset}))`;

  return colorScheme === "dark"
    ? `color-mix(in oklch, ${brandTinted} 78%, white 22%)`
    : brandTinted;
};

export const generateChartPalette = (
  primaryColor: string,
  secondaryColor: string,
  colorScheme: "dark" | "light" = "light"
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
  createSourceChannelColor(
    sourceChannelHueOffsets.web,
    primaryColor,
    colorScheme
  ),
  createSourceChannelColor(
    sourceChannelHueOffsets.print,
    primaryColor,
    colorScheme
  ),
  createSourceChannelColor(
    sourceChannelHueOffsets.ivr,
    primaryColor,
    colorScheme
  ),
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
