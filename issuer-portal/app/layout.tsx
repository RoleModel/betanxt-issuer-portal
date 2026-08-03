import type {} from "@mui/material/themeCssVarsAugmentation";
import type { Metadata, Viewport } from "next";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { LicenseInfo } from "@mui/x-license";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Agentation } from "agentation";
import { SessionProvider } from "next-auth/react";
import { Roboto, Roboto_Condensed } from "next/font/google";
import localFont from "next/font/local";
import React from "react";

import RootLayoutClient from "@/components/Layout/RootLayoutClient";
import SWRProvider from "@/components/Layout/SWRProvider";
import GlobalStyle from "@/components/mui-styling/GlobalStyles";
import ThemeRegistry from "@/components/mui-styling/ThemeRegistry";
import MuiXLicense from "@/components/MuiXLicense";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

LicenseInfo.setLicenseKey(process.env.NEXT_PUBLIC_MUI_XGRID_LICENSE ?? "");

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
  preload: true,
});

const robotoCondensed = Roboto_Condensed({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-condensed",
  preload: true,
});

const Tungsten = localFont({
  src: [
    { path: "../public/fonts/Tungsten.woff2", weight: "400" },
    { path: "../public/fonts/Tungsten-Medium.woff2", weight: "500" },
  ],
  variable: "--font-tungsten",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: "var(--mui-palette-primary-main)",
  width: "device-width",
  initialScale: 1,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "BetaNXT Issuer Portal",
  description: "Proxy event management portal.",
};

export const dynamic = "force-dynamic";

const RootLayout = ({ children }: { readonly children: React.ReactNode }) => {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${robotoCondensed.variable} ${Tungsten.variable}`}
    >
      <body>
        <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: true }}>
          <SessionProvider>
            <SWRProvider>
              <ClientProvider>
                <NotificationProvider>
                  <ChatbotProvider>
                    <ThemeRegistry>
                      <GlobalStyle />
                      <MuiXLicense />
                      <RootLayoutClient>{children}</RootLayoutClient>
                    </ThemeRegistry>
                  </ChatbotProvider>
                </NotificationProvider>
              </ClientProvider>
            </SWRProvider>
          </SessionProvider>
        </AppRouterCacheProvider>
        <SpeedInsights />
        <Analytics />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
};

export default RootLayout;
