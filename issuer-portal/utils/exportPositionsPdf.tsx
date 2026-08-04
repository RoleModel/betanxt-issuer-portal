"use client";

import React from "react";

import {
  ReportPageNumber,
  ReportPdfHeader,
  downloadBlob,
  reportStyles,
  resolveReportLogos,
} from "@/utils/reportPdfTheme";

/**
 * Positions Report PDF (landscape), restyled to the shared report redesign:
 * fixed logo row, left-aligned title block, gray column headers, and hairline
 * row separators instead of shaded banding.
 */

interface Position {
  cusip: string;
  accountType: string;
  setKey: string;
  name: string;
  accountNumber: string;
  voteStatus: string;
  controlNumber: string;
  shares: number;
  sharesVoted: number;
  source: string;
  dateVoted: string | null;
  sentBy: string | null;
}

interface ExportOptions {
  positions: Position[];
  meetingTitle: string;
  clientTicker?: string;
}

// Format number with thousand separators
const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};

// Format date
const formatDate = (date: string | null): string => {
  if (!date) return "";

  try {
    // Handle MM/DD/YYYY format with optional time
    let dateStr = date;
    if (date.includes(" 12:00AM")) {
      dateStr = date.replace(" 12:00AM", "");
    }

    const parsedDate = new Date(dateStr);

    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      // Try parsing as MM/DD/YYYY directly
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        const altDate = new Date(year, month - 1, day);

        if (!isNaN(altDate.getTime())) {
          return altDate.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          });
        }
      }
      return "";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

interface PositionsPDFDocumentProps {
  readonly positions: Position[];
  readonly meetingTitle: string;
  readonly clientTicker?: string;
  readonly clientLogoUrl?: string;
  readonly betanxtLogoUrl?: string;
}

// Main export function
export async function exportPositionsToPdf(options: ExportOptions) {
  const { positions, meetingTitle, clientTicker } = options;

  try {
    // Load the heavy PDF renderer on demand so it stays out of the initial bundle.
    const { Document, Page, StyleSheet, Text, View, pdf } =
      await import("@react-pdf/renderer");

    const columnWidths = StyleSheet.create({
      cusip: { width: "8%" },
      accountType: { width: "8%" },
      setKey: { width: "5%" },
      name: { width: "20%" },
      accountNumber: { width: "12%" },
      voteStatus: { width: "8%" },
      controlNumber: { width: "8%" },
      shares: { width: "5%" },
      sharesVoted: { width: "10%" },
      source: { width: "6%" },
      dateVoted: { width: "10%" },
      sentBy: { width: "6%" },
    });

    // Positions PDF Document Component
    const PositionsPDFDocument: React.FC<PositionsPDFDocumentProps> = ({
      positions: documentPositions,
      meetingTitle: documentMeetingTitle,
      clientTicker: documentClientTicker,
      clientLogoUrl,
      betanxtLogoUrl,
    }) => {
      return (
        <Document>
          <Page size="LETTER" style={reportStyles.page} orientation="landscape">
            <ReportPdfHeader
              reportTitle="Positions Report"
              subtitle={documentMeetingTitle}
              clientTicker={documentClientTicker}
              clientLogoUrl={clientLogoUrl}
              betanxtLogoUrl={betanxtLogoUrl}
            />

            <View style={reportStyles.tableContainer}>
              <View style={reportStyles.tableHeaderRow} fixed>
                <Text style={[reportStyles.headerCell, columnWidths.cusip]}>
                  CUSIP
                </Text>
                <Text
                  style={[reportStyles.headerCell, columnWidths.accountType]}
                >
                  Account Type
                </Text>
                <Text style={[reportStyles.headerCell, columnWidths.setKey]}>
                  Set Key
                </Text>
                <Text style={[reportStyles.headerCell, columnWidths.name]}>
                  Name
                </Text>
                <Text
                  style={[reportStyles.headerCell, columnWidths.accountNumber]}
                >
                  Account #
                </Text>
                <Text
                  style={[reportStyles.headerCell, columnWidths.controlNumber]}
                >
                  Control #
                </Text>
                <Text
                  style={[
                    reportStyles.headerCell,
                    columnWidths.shares,
                    reportStyles.cellRight,
                  ]}
                >
                  Shares
                </Text>
                <Text
                  style={[
                    reportStyles.headerCell,
                    columnWidths.sharesVoted,
                    reportStyles.cellRight,
                  ]}
                >
                  Shares Voted
                </Text>
                <Text
                  style={[reportStyles.headerCell, columnWidths.voteStatus]}
                >
                  Vote Status
                </Text>
                <Text style={[reportStyles.headerCell, columnWidths.source]}>
                  Source
                </Text>
                <Text style={[reportStyles.headerCell, columnWidths.dateVoted]}>
                  Date Voted
                </Text>
                <Text
                  style={[
                    reportStyles.headerCell,
                    columnWidths.sentBy,
                    reportStyles.cellRight,
                  ]}
                >
                  Sent By
                </Text>
              </View>

              {documentPositions.map((position) => (
                <View
                  key={`${position.cusip}-${position.accountNumber}-${position.setKey}-${position.controlNumber}`}
                  style={reportStyles.tableRow}
                  wrap={false}
                >
                  <Text style={[reportStyles.cell, columnWidths.cusip]}>
                    {position.cusip}
                  </Text>
                  <Text style={[reportStyles.cell, columnWidths.accountType]}>
                    {position.accountType}
                  </Text>
                  <Text style={[reportStyles.cell, columnWidths.setKey]}>
                    {position.setKey}
                  </Text>
                  <Text style={[reportStyles.cell, columnWidths.name]}>
                    {position.name}
                  </Text>
                  <Text style={[reportStyles.cell, columnWidths.accountNumber]}>
                    {position.accountNumber}
                  </Text>
                  <Text style={[reportStyles.cell, columnWidths.controlNumber]}>
                    {position.controlNumber}
                  </Text>
                  <Text
                    style={[
                      reportStyles.cell,
                      columnWidths.shares,
                      reportStyles.cellRight,
                    ]}
                  >
                    {formatNumber(position.shares)}
                  </Text>
                  <Text
                    style={[
                      reportStyles.cell,
                      columnWidths.sharesVoted,
                      reportStyles.cellRight,
                    ]}
                  >
                    {formatNumber(position.sharesVoted)}
                  </Text>
                  <Text style={[reportStyles.cell, columnWidths.voteStatus]}>
                    {position.voteStatus}
                  </Text>
                  <Text style={[reportStyles.cell, columnWidths.source]}>
                    {position.source}
                  </Text>
                  <Text style={[reportStyles.cell, columnWidths.dateVoted]}>
                    {formatDate(position.dateVoted)}
                  </Text>
                  <Text
                    style={[
                      reportStyles.cell,
                      columnWidths.sentBy,
                      reportStyles.cellRight,
                    ]}
                  >
                    {position.sentBy === "EMAIL" ? "Email" : "Mail"}
                  </Text>
                </View>
              ))}
            </View>

            <ReportPageNumber />
          </Page>
        </Document>
      );
    };

    const { clientLogoUrl, betanxtLogoUrl } =
      await resolveReportLogos(clientTicker);

    const pdfBlob = await pdf(
      <PositionsPDFDocument
        positions={positions}
        meetingTitle={meetingTitle}
        clientTicker={clientTicker}
        clientLogoUrl={clientLogoUrl}
        betanxtLogoUrl={betanxtLogoUrl}
      />
    ).toBlob();

    const fileName = `${meetingTitle.replace(/\s+/g, "_")}_Positions_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    downloadBlob(pdfBlob, fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
