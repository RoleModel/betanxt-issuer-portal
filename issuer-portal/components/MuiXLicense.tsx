"use client";

import { LicenseInfo } from "@mui/x-license";

// Registered at module scope so the key is set before any MUI X Pro component
// (e.g. the geographic heatmap) renders. Skipped when the env var is absent,
// in which case Pro components show MUI's unlicensed watermark.
if (process.env.NEXT_PUBLIC_MUI_X_LICENSE) {
  LicenseInfo.setLicenseKey(process.env.NEXT_PUBLIC_MUI_X_LICENSE);
}

/**
 * Render-less client component that registers the MUI X Pro license key as a
 * module side effect. Mounted once in the root layout so importing it is all
 * that is required to license MUI X Pro charts app-wide.
 */
export default function MuiXLicense(): null {
  return null;
}
