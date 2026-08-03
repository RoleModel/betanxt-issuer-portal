"use client";

/**
 * Reads the CSS custom properties the running page actually resolved.
 *
 * @remarks
 * Collected from the stylesheets rather than from a hand-kept list: the MUI
 * theme alone emits hundreds of `--mui-*` variables and the design system adds
 * its own, so any written-down list would be wrong within a day. Values come
 * from `getComputedStyle(:root)`, which means a `color-mix()` or a `var()`
 * chain reports the color you can see instead of the expression that produced
 * it.
 */

export interface Token {
  readonly name: string;
  /** As authored, which may be an expression. */
  readonly raw: string;
  /** `#rrggbb`, or `#rrggbbaa` when translucent. Empty for non-colors. */
  readonly hex: string;
}

/** Names only — the colors panel filters this same list down to paintable values. */
export const collectCustomPropertyNames = (): readonly string[] => {
  const names = new Set<string>();

  const walk = (rules: CSSRuleList): void => {
    for (const rule of rules) {
      const nested = Reflect.get(rule, "cssRules");
      if (nested instanceof CSSRuleList) {
        walk(nested);
      }

      const style = Reflect.get(rule, "style");
      if (!(style instanceof CSSStyleDeclaration)) {
        continue;
      }

      for (const property of style) {
        if (property.startsWith("--")) {
          names.add(property);
        }
      }
    }
  };

  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules);
    } catch {
      // Cross-origin sheet — not ours, and not readable.
    }
  }

  return [...names];
};

let probe: HTMLSpanElement | null = null;

const getProbe = (): HTMLSpanElement => {
  probe ??= document.createElement("span");

  if (probe.parentElement === null) {
    probe.style.display = "none";
    document.body.append(probe);
  }

  return probe;
};

/**
 * Resolves any CSS color syntax to what the browser paints.
 *
 * @param value - A color in any syntax the theme uses: hex, `rgb()`,
 * `color-mix()`, `oklch()`, `light-dark()`.
 * @returns The browser's own `rgb()`/`rgba()` form, or `null` when the value is
 * not a color at all.
 *
 * @remarks
 * Assigning to `style.color` and reading it back goes through the real cascade,
 * so the answer is exact. It also rejects non-colors for free: the browser
 * refuses an invalid value and leaves the property empty. Painting onto a canvas
 * and sampling the pixel looks equivalent but is not — a translucent color drawn
 * over a transparent canvas comes back with its channels divided by a tiny
 * alpha, which made every `rgba()` token in the theme resolve visibly wrong.
 */
const resolveColor = (value: string): string | null => {
  const element = getProbe();
  const input = value.trim();

  if (input.length === 0) {
    return null;
  }

  element.style.color = "";
  element.style.color = input;

  if (element.style.color.length === 0) {
    return null;
  }

  const resolved = getComputedStyle(element).color;
  return resolved.length > 0 ? resolved : null;
};

const toHexPair = (value: number): string =>
  value.toString(16).padStart(2, "0");

const RGB_PATTERN =
  /^rgba?\(\s*(?<red>[\d.]+)[\s,]+(?<green>[\d.]+)[\s,]+(?<blue>[\d.]+)(?:[\s,/]+(?<alpha>[\d.%]+))?\s*\)$/u;

/** `rgb(8, 31, 52)` → `#081f34`; translucent values keep an alpha pair. */
export const toHex = (value: string): string | null => {
  const resolved = resolveColor(value);

  if (resolved === null) {
    return null;
  }

  const match = RGB_PATTERN.exec(resolved);

  if (match?.groups === undefined) {
    // A wide-gamut color() the browser reports in another form — hand it back
    // rather than approximate it.
    return resolved;
  }

  const { red, green, blue, alpha } = match.groups;
  const channels = [red, green, blue]
    .map((channel) => toHexPair(Math.round(Number(channel))))
    .join("");

  if (alpha === undefined) {
    return `#${channels}`;
  }

  const alphaValue = alpha.endsWith("%")
    ? Number(alpha.slice(0, -1)) / 100
    : Number(alpha);

  return alphaValue >= 1
    ? `#${channels}`
    : `#${channels}${toHexPair(Math.round(alphaValue * 255))}`;
};

/**
 * Which color scheme the values were read in.
 *
 * @remarks
 * `--mui-palette-*` resolves differently per scheme, so an export that does not
 * say which one it captured is ambiguous.
 */
export const getCurrentScheme = (): string => {
  const root = document.documentElement;
  return (
    root.dataset.muiColorScheme ??
    (root.classList.contains("dark") ? "dark" : "light")
  );
};

/**
 * Every custom property the page has, resolved.
 *
 * @remarks
 * Collected when a panel is opened rather than while it renders: MUI's CSS-vars
 * provider writes its `:root` block in an effect, so a first-render read misses
 * every `--mui-*` variable.
 */
export const collectTokens = (): readonly Token[] => {
  const root = getComputedStyle(document.documentElement);

  return collectCustomPropertyNames()
    .map((name): Token => {
      const raw = root.getPropertyValue(name).trim();
      return { hex: toHex(raw) ?? "", name, raw };
    })
    .filter((token) => token.raw.length > 0)
    .sort((first: Token, second: Token) =>
      first.name.localeCompare(second.name)
    );
};

export interface TokenGroup {
  readonly title: string;
  readonly matches: (name: string) => boolean;
}

/** First match wins, so the portal's own tokens sort above MUI's bulk. */
export const tokenGroups: readonly TokenGroup[] = [
  {
    matches: (name) => name.startsWith("--mui-palette-voteChart"),
    title: "Vote chart roles",
  },
  {
    matches: (name) => name.startsWith("--mui-palette-voteDistribution"),
    title: "Vote distribution",
  },
  {
    matches: (name) => name.startsWith("--mui-palette-phase"),
    title: "Meeting phases",
  },
  {
    matches: (name) => name.startsWith("--mui-palette-status"),
    title: "Job statuses",
  },
  {
    matches: (name) =>
      /--mui-palette-(?:primary|secondary|tertiary|appSwitcher|keydate)/u.test(
        name
      ),
    title: "Client brand",
  },
  {
    matches: (name) =>
      /--mui-palette-(?:error|warning|info|success)/u.test(name),
    title: "Status",
  },
  {
    matches: (name) =>
      /--mui-palette-(?:text|background|divider|action|common|grey|neutral)/u.test(
        name
      ),
    title: "Surfaces & text",
  },
  {
    matches: (name) => name.startsWith("--font-"),
    title: "Fonts",
  },
  {
    matches: (name) =>
      /--mui-(?:shape|shadows|opacity|overlays|spacing|zIndex|breakpoint)/u.test(
        name
      ),
    title: "Shape, spacing & elevation",
  },
  { matches: (name) => name.startsWith("--mui-"), title: "Other MUI" },
  { matches: () => true, title: "Everything else" },
];

export const groupTitleFor = (name: string): string =>
  tokenGroups.find((group) => group.matches(name))?.title ?? "Everything else";

/** A paste-ready CSS block of the resolved values, grouped and commented. */
export const toCssBlock = (
  tokens: readonly Token[],
  scheme: string
): string => {
  const lines: string[] = [
    `/* BetaNXT Issuer Portal — resolved tokens (${scheme} scheme, ${tokens.length} values) */`,
    ":root {",
  ];

  for (const group of tokenGroups) {
    const inGroup = tokens.filter(
      (token) => groupTitleFor(token.name) === group.title
    );

    if (inGroup.length === 0) {
      continue;
    }

    lines.push(`  /* ${group.title} */`);
    for (const token of inGroup) {
      lines.push(
        `  ${token.name}: ${token.hex.length > 0 ? token.hex : token.raw};`
      );
    }
    lines.push("");
  }

  lines.push("}");
  return lines.join("\n");
};
