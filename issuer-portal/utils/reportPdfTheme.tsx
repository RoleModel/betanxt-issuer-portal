"use client";

import {
  Font,
  Image as PDFImage,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import React from "react";

import { getBrandConfigByTicker } from "@/utils/brandConfig";
import { loadImageAsPngDataUrl } from "@/utils/clientBranding";

/**
 * Shared @react-pdf/renderer theme for all generated portal reports.
 *
 * Visual language (from the report redesign mock): white page, Roboto, a
 * fixed logo row (client left, BetaNXT right), a left-aligned bold title with
 * gray subtitle, hairline-divided meta grid, and borderless tables that use
 * gray column headers, light-gray section bands, and hairline row separators
 * instead of heavy borders or colored header bars.
 */

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-300-normal.woff",
      fontWeight: 300,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-500-normal.woff",
      fontWeight: 500,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

/** Brand palette shared by every generated report PDF. */
export const reportColors = {
  ink: "#1F1E1C",
  mutedText: "#666666",
  subtleText: "#8A8A8A",
  hairline: "#E4E4E4",
  hairlineStrong: "#C9C9C9",
  sectionBg: "#F3F3F3",
  accent: "#0D6580",
  white: "#FFFFFF",
};

/**
 * Common page, header, meta-grid, and table styles for report PDFs. Templates
 * compose these (e.g. `[reportStyles.cell, reportStyles.cellRight]`) and only
 * define their own column widths.
 */
export const reportStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: reportColors.white,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: "Roboto",
    fontSize: 8,
    color: reportColors.ink,
  },
  // --- Header ---
  logoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  clientLogo: {
    width: 110,
    height: 26,
    objectFit: "contain",
    objectPosition: "left",
  },
  betanxtLogo: {
    width: 64,
    height: 15,
    objectFit: "contain",
    objectPosition: "right",
  },
  fallbackLogo: {
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "Roboto",
    color: reportColors.ink,
  },
  betanxtText: {
    fontSize: 13,
    fontWeight: 700,
    color: reportColors.accent,
    fontFamily: "Roboto",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: reportColors.hairline,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Roboto",
    color: reportColors.ink,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: 400,
    fontFamily: "Roboto",
    color: reportColors.mutedText,
  },
  runDate: {
    fontSize: 7,
    fontWeight: 400,
    fontFamily: "Roboto",
    color: reportColors.subtleText,
  },
  // --- Meta grid (two key/value pairs per row, hairline-divided) ---
  metaSection: {
    marginTop: 6,
    marginBottom: 4,
  },
  metaGridRow: {
    flexDirection: "row",
  },
  metaGridItem: {
    flexDirection: "row",
    width: "50%",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: reportColors.hairline,
  },
  metaGridItemSpacer: {
    width: "50%",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: reportColors.hairline,
  },
  metaLabel: {
    width: "46%",
    fontSize: 8,
    fontWeight: 400,
    fontFamily: "Roboto",
    color: reportColors.mutedText,
    paddingRight: 8,
  },
  metaValue: {
    flex: 1,
    fontSize: 8,
    fontWeight: 400,
    fontFamily: "Roboto",
    color: reportColors.ink,
    paddingRight: 16,
  },
  metaFullRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: reportColors.hairline,
    flexDirection: "row",
  },
  // Legacy single-line meta row (kept for simple templates)
  metaRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  // --- Tables ---
  tableContainer: {
    marginTop: 14,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: reportColors.hairlineStrong,
    paddingBottom: 2,
  },
  headerCell: {
    fontSize: 7,
    fontWeight: 500,
    fontFamily: "Roboto",
    color: reportColors.mutedText,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  /** Light-gray band for section/group rows (e.g. a proposal heading). */
  sectionRow: {
    flexDirection: "row",
    backgroundColor: reportColors.sectionBg,
    marginTop: 6,
    borderRadius: 2,
  },
  sectionCell: {
    fontSize: 7.5,
    fontWeight: 700,
    fontFamily: "Roboto",
    color: reportColors.ink,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: reportColors.white,
    borderBottomWidth: 1,
    borderBottomColor: reportColors.hairline,
  },
  /** @deprecated banding removed in the redesign; identical to tableRow. */
  tableRowAlt: {
    flexDirection: "row",
    backgroundColor: reportColors.white,
    borderBottomWidth: 1,
    borderBottomColor: reportColors.hairline,
  },
  cell: {
    fontSize: 7.5,
    fontWeight: 400,
    fontFamily: "Roboto",
    color: reportColors.ink,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  cellLabel: {
    fontSize: 7.5,
    fontWeight: 500,
    fontFamily: "Roboto",
    color: reportColors.ink,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: reportColors.white,
    borderTopWidth: 1,
    borderTopColor: reportColors.hairlineStrong,
  },
  totalCell: {
    fontSize: 7.5,
    fontWeight: 700,
    fontFamily: "Roboto",
    color: reportColors.ink,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  cellRight: {
    textAlign: "right",
  },
  footnote: {
    marginTop: 10,
    fontSize: 6.5,
    fontFamily: "Roboto",
    color: reportColors.subtleText,
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 40,
    fontSize: 7,
    fontFamily: "Roboto",
    color: reportColors.mutedText,
  },
});

/**
 * Formats a numeric value with US thousands separators for table cells.
 *
 * @param num - Value to format
 * @param decimals - Fixed number of fraction digits to show (default `0`)
 * @returns Localized number string, e.g. `1,234,567`
 */
export function formatReportNumber(num: number, decimals = 0): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a percentage value for report cells.
 *
 * @param value - Percentage already scaled to 0–100
 * @returns The value with two decimals and a `%` suffix, e.g. `87.50%`
 */
export function formatReportPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Formats an ISO date string as `MM/DD/YYYY` for report metadata rows.
 *
 * @param date - ISO date string (may be empty or malformed)
 * @returns Formatted date, or an empty string when the input cannot be parsed
 */
export function formatReportDate(date: string): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * Builds the "Run Date" timestamp shown in every report header.
 *
 * @returns The current date and time in US locale, e.g. `6/11/2026, 1:45:02 PM`
 */
export function formatRunDate(): string {
  return new Date().toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export interface ReportPdfHeaderProps {
  /** Bold left-aligned title under the logo row (e.g. `Tabulation Report`). */
  readonly reportTitle: string;
  /** Gray subtitle under the title (e.g. the meeting type). */
  readonly subtitle?: string;
  /** Ticker used for the text fallback when no client logo resolves. */
  readonly clientTicker?: string;
  /** Base64 data URL of the client logo (see {@link resolveReportLogos}). */
  readonly clientLogoUrl?: string;
  /** Base64 data URL of the BetaNXT logo; falls back to styled text. */
  readonly betanxtLogoUrl?: string;
}

/**
 * Standard report header: a fixed logo row (client logo left, BetaNXT logo
 * right) that repeats on every page, followed by the left-aligned bold title,
 * optional gray subtitle, run date on the right, and a hairline divider.
 * Either logo gracefully degrades to text when its image could not resolve.
 */
export const ReportPdfHeader: React.FC<ReportPdfHeaderProps> = ({
  reportTitle,
  subtitle,
  clientTicker,
  clientLogoUrl,
  betanxtLogoUrl,
}) => (
  <>
    <View style={reportStyles.logoRow} fixed>
      {clientLogoUrl ? (
        <PDFImage style={reportStyles.clientLogo} src={clientLogoUrl} />
      ) : (
        <Text style={reportStyles.fallbackLogo}>
          {clientTicker ? `${clientTicker} Logo` : "Client Logo"}
        </Text>
      )}
      {betanxtLogoUrl ? (
        <PDFImage style={reportStyles.betanxtLogo} src={betanxtLogoUrl} />
      ) : (
        <Text style={reportStyles.betanxtText}>BetaNXT</Text>
      )}
    </View>
    <View style={reportStyles.titleRow}>
      <View>
        <Text style={reportStyles.title}>{reportTitle}</Text>
        {subtitle ? (
          <Text style={reportStyles.subtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <Text style={reportStyles.runDate}>Run Date: {formatRunDate()}</Text>
    </View>
  </>
);

/** One key/value entry in a {@link ReportMetaGrid}; empty label = spacer cell. */
export interface ReportMetaItem {
  label: string;
  value: string;
}

interface ReportMetaGridProps {
  /** Items laid out two per row, in reading order (left, right, left, right…). */
  readonly items: ReportMetaItem[];
}

/**
 * Two-column key/value metadata grid with a hairline divider under each row,
 * matching the redesign mock's meta section. Pass `{ label: '', value: '' }`
 * to leave a cell empty when the columns are uneven.
 */
export const ReportMetaGrid: React.FC<ReportMetaGridProps> = ({ items }) => {
  const rows: ReportMetaItem[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <View style={reportStyles.metaSection}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={reportStyles.metaGridRow}>
          {row.map((item, itemIndex) =>
            item.label ? (
              <View key={itemIndex} style={reportStyles.metaGridItem}>
                <Text style={reportStyles.metaLabel}>{item.label}</Text>
                <Text style={reportStyles.metaValue}>{item.value}</Text>
              </View>
            ) : (
              <View key={itemIndex} style={reportStyles.metaGridItemSpacer} />
            )
          )}
          {row.length === 1 ? (
            <View style={reportStyles.metaGridItemSpacer} />
          ) : null}
        </View>
      ))}
    </View>
  );
};

/**
 * Fixed page-number footer (`Page N of M`) rendered bottom-right on every
 * page via @react-pdf's render-prop pagination.
 */
export const ReportPageNumber: React.FC = () => (
  <Text
    style={reportStyles.pageNumber}
    render={({ pageNumber, totalPages }) =>
      `Page ${pageNumber} of ${totalPages}`
    }
    fixed
  />
);

/**
 * Fetches an image and converts it to a base64 data URL so @react-pdf can
 * embed it without re-fetching at render time.
 *
 * @param url - Absolute URL of the image
 * @returns A `data:` URL, or `undefined` when the fetch or conversion fails
 */
async function imageUrlToBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;

    const blob = await response.blob();
    return await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const { result } = reader;
        resolve(
          typeof result === "string" && result.startsWith("data:")
            ? result
            : undefined
        );
      };
      reader.onerror = () => {
        resolve(undefined);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export interface ReportLogos {
  /** Base64 data URL of the client logo, when one exists for the ticker. */
  clientLogoUrl?: string;
  /** Base64 data URL of the BetaNXT logo. */
  betanxtLogoUrl?: string;
}

/**
 * Resolves the client logo for a ticker as a PNG data URL, trying the legacy
 * flat asset first (`/logos/{TICKER}_logo.png`), then the brand-config logo
 * and icon paths (which may be SVGs rasterized to PNG via canvas).
 *
 * @param clientTicker - Client ticker symbol
 * @param baseUrl - Origin used to build absolute asset URLs
 * @returns A PNG data URL, or `undefined` when no candidate resolves
 */
async function resolveClientLogo(
  clientTicker: string,
  baseUrl: string
): Promise<string | undefined> {
  const ticker = clientTicker.toUpperCase();
  const brand = getBrandConfigByTicker(ticker);

  const candidatePaths = [
    `/logos/${ticker}_logo.png`,
    ...(brand?.logoPath ? [brand.logoPath] : []),
    ...(brand?.iconPath ? [brand.iconPath] : []),
  ];

  for (const path of candidatePaths) {
    const dataUrl = await loadImageAsPngDataUrl(`${baseUrl}${path}`);
    if (dataUrl) return dataUrl;
  }
  return undefined;
}

/**
 * Resolves the client and BetaNXT logos from the portal's public assets as
 * base64 data URLs for embedding in a report header.
 *
 * The client logo is looked up via {@link resolveClientLogo}: the legacy
 * `/logos/{TICKER}_logo.png` asset first, then the ticker's brand-config
 * logo/icon (SVGs are rasterized to PNG since @react-pdf can't embed SVG).
 *
 * Missing or unfetchable logos resolve to `undefined` rather than failing, so
 * report generation never blocks on artwork ({@link ReportPdfHeader} renders
 * text fallbacks instead).
 *
 * @param clientTicker - Ticker used to look up the client logo
 * @returns The resolved logo data URLs
 */
export async function resolveReportLogos(
  clientTicker?: string
): Promise<ReportLogos> {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [clientLogoUrl, betanxtLogoUrl] = await Promise.all([
    clientTicker
      ? resolveClientLogo(clientTicker, baseUrl)
      : Promise.resolve(undefined),
    imageUrlToBase64(`${baseUrl}/images/betanxt-logo.png`),
  ]);

  return { clientLogoUrl, betanxtLogoUrl };
}

/**
 * Triggers a browser download of a generated blob via a temporary anchor
 * element, revoking the object URL afterwards.
 *
 * @param blob - File contents to download
 * @param fileName - Name suggested to the browser's save dialog
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
