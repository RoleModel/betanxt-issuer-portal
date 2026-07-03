# client-theming

A portable, drop-in module for **per-client branding**. It bundles three things that usually get scattered across an app:

1. **Brandfetch integration** — fetch a company's logos and colors by domain or name.
2. **Brand registry** — a typed `BrandConfig` store with ticker/name lookups.
3. **Theme generation** — turn brand colors into a contrast-aware MUI light/dark theme.

It depends only on `@mui/material` (for the theme layer) and the global `fetch`. No private design system, no framework lock-in. Copy the folder into any React + MUI (v6/v7) project and go.

---

## What's inside

```
client-theming/
├── .env.example              # BRANDFETCH_API_KEY + how to get it
├── package.json              # exports map + peer deps
├── tsconfig.json             # strict, no-any config
├── README.md
└── src/
    ├── index.ts              # barrel — re-exports everything
    ├── brand/                # BrandConfig type + registry + lookups
    │   ├── types.ts
    │   └── registry.ts
    ├── brandfetch/           # Brandfetch API client (SERVER-SIDE)
    │   ├── types.ts
    │   ├── client.ts         # fetchBrand / searchBrands / fetchBrandByName
    │   ├── pickLogo.ts       # pickBestLogo / pickBrandColors
    │   └── toBrandConfig.ts  # brandResponseToBrandConfig / slugify
    ├── theme/                # MUI theme from brand colors (ISOMORPHIC)
    │   ├── contrast.ts       # contrastText()
    │   ├── createClientTheme.ts
    │   └── augmentation.ts   # adds `tertiary` palette color to MUI types
    └── logo/                 # PNG/SVG logo helpers (BROWSER-ONLY)
        └── browser.ts
```

Every function is JSDoc-annotated — hover in your editor for parameter docs and examples.

### Which module runs where

| Module                      | Environment                                  | Needs                         |
| --------------------------- | -------------------------------------------- | ----------------------------- |
| `client-theming/brandfetch` | **Server only** (API route, script, backend) | `BRANDFETCH_API_KEY`, `fetch` |
| `client-theming/theme`      | Isomorphic                                   | `@mui/material`               |
| `client-theming/brand`      | Isomorphic                                   | —                             |
| `client-theming/logo`       | **Browser only**                             | `document`, `canvas`, `fetch` |

> Keep `BRANDFETCH_API_KEY` server-side. It's a private, billable credential — never ship it to the browser.

---

## Install / drop in

**Option A — copy the folder.** Drop `client-theming/` anywhere in your repo and import via a relative/alias path:

```ts
import { createClientTheme } from "../client-theming/src/theme";
```

**Option B — workspace package.** Add it to your workspaces (pnpm/npm/yarn). The `exports` map already exposes the entry points:

```ts
import { createClientTheme, fetchBrand } from "@rolemodel/client-theming";
import { fetchBrand } from "@rolemodel/client-theming/brandfetch";
import { createClientTheme } from "@rolemodel/client-theming/theme";
```

Peer deps (already in your MUI app): `@mui/material >=6`, `react >=18`, `react-dom >=18`.

---

## Getting a Brandfetch API key

The `brandfetch` module reads its key from the `BRANDFETCH_API_KEY` environment variable.

1. Create a free account at **https://brandfetch.com** (developer portal: **https://developers.brandfetch.com**).
2. Open the **Developers** dashboard and **create an application / API key**.
3. Copy the **API key** — it's used as a Bearer token for both the Brand API and the Search API.
4. Add it to your environment (do **not** commit it):

```bash
cp client-theming/.env.example .env      # then edit .env
# .env
BRANDFETCH_API_KEY=bf_live_xxxxxxxxxxxxxxxx
```

Reference: https://docs.brandfetch.com/reference/brand-api

You can also pass a key explicitly instead of using the env var:

```ts
await fetchBrand("wendys.com", { apiKey: myKey });
```

---

## Usage

### 1. Generate a theme from brand colors

```ts
import { ThemeProvider } from "@mui/material/styles";
import { createClientTheme } from "@rolemodel/client-theming/theme";

// From explicit colors
const theme = createClientTheme({
  primaryColor: "#0078A3",
  secondaryColor: "#DAD55E",
  tertiaryColor: "#DB163A", // optional
});

// From a ticker in the registry
const wendys = createClientTheme("WEN");

// Merge with your own base theme options (typography, components, breakpoints…)
const branded = createClientTheme(
  { primaryColor: "#005C2B", secondaryColor: "#193E2D" },
);

export function App({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
```

`createClientTheme` computes readable `contrastText` for each color (WCAG 4.5:1) and produces **both** `light` and `dark` color schemes with CSS variables enabled. Prefer `createClientThemeOptions(input)` if you'd rather merge the options yourself before calling `createTheme`.

#### Enabling the `tertiary` color in TypeScript

The theme adds a `tertiary` palette color and `<Button color="tertiary" />`. The MUI module augmentation ships in `theme/augmentation.ts` and is imported by the theme entry point. If your bundler tree-shakes ambient types away, import it once in your app setup:

```ts
import "@rolemodel/client-theming/theme";
```

### 2. Fetch a brand from Brandfetch (server-side)

```ts
import { fetchBrand, fetchBrandByName, pickBrandColors } from "@rolemodel/client-theming/brandfetch";

const brand = await fetchBrand("paycom.com"); // by domain
const byName = await fetchBrandByName("Paycom"); // search + fetch

if (brand) {
  const { primaryColor, secondaryColor } = pickBrandColors(brand.colors);
}
```

### 3. Look up brands in the registry

```ts
import { getBrandConfigByTicker, getBrandLogoPath } from "@rolemodel/client-theming/brand";

const config = getBrandConfigByTicker("WEN"); // BrandConfig | null
const logo = getBrandLogoPath("The Wendy's Company");
```

### 4. Load a logo as a PNG (browser, e.g. for PDFs)

```ts
"use client";
import { loadClientLogoAsPngBase64, loadImageAsPngDataUrl } from "@rolemodel/client-theming/logo";

const dataUrl = await loadClientLogoAsPngBase64({ ticker: "WEN" });
const anyLogo = await loadImageAsPngDataUrl("/logos/brands/acme_logo.svg"); // rasterizes SVG
```

---

## Generating a full brand registry

`src/brand/registry.ts` ships with a few example entries. Generate your own from Brandfetch by combining the client with the mapper. A minimal Node script:

```ts
// scripts/generate-registry.ts  — run with: npx tsx scripts/generate-registry.ts
import { writeFileSync } from "node:fs";
import { fetchBrandByName, brandResponseToBrandConfig } from "@rolemodel/client-theming/brandfetch";
import type { BrandConfig } from "@rolemodel/client-theming/brand";

const companies = [
  { name: "The Wendy's Company", ticker: "WEN" },
  { name: "Paycom Software, Inc.", ticker: "PAYC" },
];

const registry: Record<string, BrandConfig> = {};
for (const { name, ticker } of companies) {
  const brand = await fetchBrandByName(name);
  if (brand) registry[name] = brandResponseToBrandConfig(brand, { ticker, companyName: name });
}

writeFileSync(
  "src/brand/registry.generated.ts",
  `import type { BrandConfig } from "./types";\n\n` +
    `export const brandConfigs: Record<string, BrandConfig> = ${JSON.stringify(registry, null, 2)};\n`,
);
```

`brandResponseToBrandConfig` only computes colors and **deterministic asset paths** (e.g. `/logos/brands/{slug}_logo.svg`). It does not download files — fetch each picked logo's `src` (from `pickBestLogo`) and save it to the matching path if you want to self-host the assets.

---

## Notes & limitations

- **Theme scope.** This is the reusable core distilled from the source app. App-specific pieces (React context/providers, app-bar hooks, meeting-phase colors, Supabase logo uploads, PDF/mailing generators) were intentionally **left out** so the package stays framework-agnostic. Wire the theme into your own provider.
- **MUI version.** Built for MUI v6/v7 (CSS variables + `colorSchemes`). On v5 you'd need to adapt the palette shape.
- **No build step required.** The package exposes `.ts` source directly via its `exports` map; your app's bundler (Next.js, Vite, etc.) compiles it. Add a build if you plan to publish to a registry.
- **Type safety.** Strict TypeScript, no `any`, no implicit index access — matches the source project's conventions.
