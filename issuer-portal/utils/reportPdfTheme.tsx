"use client";

import { Font, Image as PDFImage, StyleSheet, Text, View } from "@react-pdf/renderer";
import React from "react";

/**
 * Shared @react-pdf/renderer theme for all generated portal reports.
 * Mirrors the visual language of `exportTabulationPdf` (Roboto typography,
 * BetaNXT brand colors, bordered tables with the navy header bar) so every
 * report template family stays consistent (contract C5).
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
  headerBar: "#1F487D",
  accent: "#0D6580",
  text: "#1f1e1c",
  mutedText: "#666666",
  border: "#333333",
  rowAlt: "#F2F7FA",
  white: "#FFFFFF",
};

/**
 * Common page, header, meta-row, and table styles for report PDFs. Templates
 * compose these (e.g. `[reportStyles.cell, reportStyles.cellRight]`) and only
 * define their own column widths.
 */
export const reportStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: reportColors.white,
    padding: 30,
    fontFamily: "Roboto",
    fontSize: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
  },
  clientLogo: {
    width: 50,
    height: 50,
    objectFit: "contain",
  },
  betanxtLogo: {
    width: 60,
    height: 14,
  },
  fallbackLogo: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "Roboto",
  },
  betanxtText: {
    fontSize: 16,
    fontWeight: 700,
    color: reportColors.accent,
    fontFamily: "Roboto",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
    fontFamily: "Roboto",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 8,
    fontFamily: "Roboto",
    color: reportColors.mutedText,
    textAlign: "center",
  },
  metaSection: {
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: 700,
    fontFamily: "Roboto",
    color: reportColors.text,
  },
  metaValue: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: "Roboto",
    color: reportColors.text,
    marginLeft: 4,
    marginRight: 16,
  },
  tableContainer: {
    borderWidth: 0.5,
    borderColor: reportColors.border,
    marginTop: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: reportColors.headerBar,
    borderBottomWidth: 0.5,
    borderBottomColor: reportColors.border,
  },
  headerCell: {
    fontSize: 7,
    fontWeight: 700,
    fontFamily: "Roboto",
    color: reportColors.white,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: reportColors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: reportColors.border,
  },
  tableRowAlt: {
    flexDirection: "row",
    backgroundColor: reportColors.rowAlt,
    borderBottomWidth: 0.5,
    borderBottomColor: reportColors.border,
  },
  cell: {
    fontSize: 7,
    fontWeight: 400,
    fontFamily: "Roboto",
    color: reportColors.text,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: reportColors.white,
    borderTopWidth: 1,
    borderTopColor: reportColors.border,
  },
  totalCell: {
    fontSize: 7,
    fontWeight: 700,
    fontFamily: "Roboto",
    color: reportColors.text,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  cellRight: {
    textAlign: "right",
  },
  footnote: {
    marginTop: 8,
    fontSize: 6,
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
 * Builds the "Run Date" timestamp shown under every report title.
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
  /** Title rendered uppercased between the two logos. */
  reportTitle: string;
  /** Ticker used for the text fallback when no client logo resolves. */
  clientTicker?: string;
  /** Base64 data URL of the client logo (see {@link resolveReportLogos}). */
  clientLogoUrl?: string;
  /** Base64 data URL of the BetaNXT logo; falls back to styled text. */
  betanxtLogoUrl?: string;
}

/**
 * Standard report header: client logo on the left, centered title with run
 * date, BetaNXT logo on the right. Either logo gracefully degrades to text
 * when its image could not be resolved.
 */
export const ReportPdfHeader: React.FC<ReportPdfHeaderProps> = ({
  reportTitle,
  clientTicker,
  clientLogoUrl,
  betanxtLogoUrl,
}) => (
  <View style={reportStyles.header}>
    <View>
      {clientLogoUrl ? (
        <PDFImage style={reportStyles.clientLogo} src={clientLogoUrl} />
      ) : (
        <Text style={reportStyles.fallbackLogo}>
          {clientTicker ? `${clientTicker} Logo` : "Client Logo"}
        </Text>
      )}
    </View>
    <View style={{ marginBottom: 8 }}>
      <Text style={reportStyles.title}>{reportTitle.toUpperCase()}</Text>
      <Text style={reportStyles.subtitle}>Run Date: {formatRunDate()}</Text>
    </View>
    <View>
      {betanxtLogoUrl ? (
        <PDFImage style={reportStyles.betanxtLogo} src={betanxtLogoUrl} />
      ) : (
        <Text style={reportStyles.betanxtText}>BetaNXT</Text>
      )}
    </View>
  </View>
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
        const result = reader.result;
        resolve(typeof result === "string" && result.startsWith("data:") ? result : undefined);
      };
      reader.onerror = () => resolve(undefined);
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
 * Resolves the client and BetaNXT logos from the portal's public assets as
 * base64 data URLs for embedding in a report header.
 *
 * Missing or unfetchable logos resolve to `undefined` rather than failing, so
 * report generation never blocks on artwork ({@link ReportPdfHeader} renders
 * text fallbacks instead).
 *
 * @param clientTicker - Ticker used to look up `/logos/{TICKER}_logo.png`
 * @returns The resolved logo data URLs
 */
export async function resolveReportLogos(clientTicker?: string): Promise<ReportLogos> {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [clientLogoUrl, betanxtLogoUrl] = await Promise.all([
    clientTicker
      ? imageUrlToBase64(`${baseUrl}/logos/${clientTicker.toUpperCase()}_logo.png`)
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
