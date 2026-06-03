"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

import { useClient } from "@/contexts/ClientContext";

import type { createClientTheme } from "./theme";

import {
  createClientTheme as createThemeOptions,
  dfinThemeOptions,
  morrowSodaliThemeOptions,
} from "./theme";

const TICKER_PREFIX_REGEX = /^\/([A-Z]{2,5})\//;

const userTypeBrandTicker: Record<string, string> = {
  PARENT_CLIENT: "DFIN",
  SOLICITOR: "MRSO",
};

const multiClientUserTypes = new Set(["PARENT_CLIENT", "SOLICITOR", "CSM"]);

/** Cache dynamically-created theme options so we don't rebuild every render */
const themeCache = new Map<string, ReturnType<typeof createClientTheme>>();

function getThemeOptions(tick: string): ReturnType<typeof createClientTheme> {
  const existing = themeCache.get(tick);
  if (existing) return existing;
  const opts = createThemeOptions(tick);
  themeCache.set(tick, opts);
  return opts;
}

const brandThemeForUserType: Record<string, ReturnType<typeof createClientTheme>> = {
  PARENT_CLIENT: dfinThemeOptions,
  SOLICITOR: morrowSodaliThemeOptions,
};

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const { currentClient } = useClient();
  const { data: session } = useSession();
  const pathname = usePathname();

  const ticker = currentClient?.ticker;
  const userType = session?.user?.type;

  // Extract client ticker from URL to detect client context
  const urlTicker = useMemo(() => {
    const match = TICKER_PREFIX_REGEX.exec(pathname);
    return match ? match[1] : null;
  }, [pathname]);

  const theme = useMemo(() => {
    const isMultiClientUser = userType ? multiClientUserTypes.has(userType) : false;

    if (isMultiClientUser && userType) {
      // When on a client-specific page, use that client's brand theme
      if (urlTicker) {
        return createTheme(getThemeOptions(urlTicker));
      }

      // Fall back to the user's org brand on top-level pages (events, profile, etc.)
      const orgTheme = brandThemeForUserType[userType];
      if (orgTheme) {
        return createTheme(orgTheme);
      }
    }

    // Use client ticker if available, otherwise fall back to user-type brand
    const effectiveTicker = ticker ?? (userType ? userTypeBrandTicker[userType] : undefined);

    return createTheme(effectiveTicker ? getThemeOptions(effectiveTicker) : dfinThemeOptions);
  }, [ticker, userType, urlTicker]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}

export const useClientTicker = () => {
  const { currentClient } = useClient();
  return currentClient?.ticker ?? "DFIN";
};

export { useTheme } from "@mui/material/styles";
