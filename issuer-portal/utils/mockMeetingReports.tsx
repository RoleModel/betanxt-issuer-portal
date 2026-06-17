"use client";

import { Document, Page, Text, View, pdf } from "@react-pdf/renderer";
import React from "react";
import * as XLSX from "xlsx";

import { createSeededRandom, hashString } from "@/utils/deterministicSeed";
import {
  ReportMetaGrid,
  ReportPageNumber,
  ReportPdfHeader,
  downloadBlob,
  formatReportDate,
  reportStyles,
  resolveReportLogos,
} from "@/utils/reportPdfTheme";

/**
 * On-demand generators for the legacy meeting reports that have no stored
 * artifact. Content is representative mock data, seeded deterministically from
 * report name + meeting id so repeated downloads produce identical reports.
 */

type MockCellValue = string | number;

/** Column headers plus row data for a generated report table. */
interface MockReportTable {
  columns: string[];
  rows: MockCellValue[][];
}

export interface MockReportOptions {
  /** Legacy report name; also selects the table layout and the download file name. */
  reportName: string;
  /** Meeting the report is generated for; part of the deterministic seed. */
  meetingId: string;
  /** Issuer name shown in the PDF meta row. */
  companyName: string;
  /** Ticker used to resolve the client logo for the PDF header. */
  clientTicker?: string;
  /** Meeting type label, omitted from the meta row when absent. */
  meetingType?: string;
  /** ISO meeting date; also anchors generated activity dates. */
  meetingDate?: string;
}

const FIRST_NAMES = [
  "James",
  "Mary",
  "Robert",
  "Patricia",
  "Michael",
  "Linda",
  "David",
  "Barbara",
  "William",
  "Elizabeth",
  "Susan",
  "Thomas",
];

const LAST_NAMES = [
  "Anderson",
  "Bennett",
  "Carter",
  "Dawson",
  "Ellis",
  "Foster",
  "Grant",
  "Hughes",
  "Iverson",
  "Jensen",
  "Keller",
  "Lawson",
];

const PARTICIPANT_NAMES = [
  "Charles Schwab & Co.",
  "Fidelity Brokerage Services",
  "Morgan Stanley Smith Barney",
  "Merrill Lynch, Pierce, Fenner & Smith",
  "J.P. Morgan Securities",
  "Vanguard Brokerage Services",
  "E*TRADE Securities",
  "TD Ameritrade Clearing",
  "UBS Financial Services",
  "Pershing LLC",
];

const VOTE_SOURCES = ["WEB", "IVR", "PRINT"];

const US_STATES = ["NY", "CA", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI", "NJ", "VA"];

const BALLOT_COMMENTS = [
  "Please confirm receipt of my proxy card.",
  "Voting instructions updated per account holder request.",
  "Shareholder requested paper confirmation by mail.",
  "Duplicate ballot received; original retained.",
  "Signature verified against account records.",
  "Ballot received after initial mailing; counted as valid.",
];

const ATTENDANCE_TYPES = ["In Person", "Virtual", "Proxy"];

function pick<T>(random: () => number, values: T[]): T {
  return values[Math.floor(random() * values.length)];
}

function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function holderName(random: () => number): string {
  return `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`;
}

function accountNumber(random: () => number): string {
  return String(randomInt(random, 100_000_000, 999_999_999));
}

function controlNumber(random: () => number): string {
  return String(randomInt(random, 1_000_000_000, 9_999_999_999));
}

/**
 * Generates an ISO date 1–`maxDaysBack` days before the anchor date, so
 * activity dates always land plausibly ahead of the meeting.
 *
 * @param random - Seeded random source
 * @param anchorIso - Meeting date to anchor to; invalid/missing values fall back to a fixed date
 * @param maxDaysBack - Upper bound on how far before the anchor the date may fall
 * @returns ISO date string (`YYYY-MM-DD`)
 */
function dateBefore(
  random: () => number,
  anchorIso: string | undefined,
  maxDaysBack: number,
): string {
  const anchor = anchorIso ? new Date(anchorIso) : new Date("2026-05-15");
  const base = Number.isNaN(anchor.getTime()) ? new Date("2026-05-15") : anchor;
  const result = new Date(base);
  result.setDate(result.getDate() - randomInt(random, 1, maxDaysBack));
  return result.toISOString().split("T")[0];
}

/**
 * Picks a vote status consistent with the report being generated: "Voted" /
 * "Unvoted" report variants always match their name, while mixed account
 * reports lean ~60% voted.
 *
 * @param reportName - Report name inspected for a voted/unvoted qualifier
 * @param random - Seeded random source for the mixed case
 * @returns `'Voted'` or `'Unvoted'`
 */
function voteStatusForReport(reportName: string, random: () => number): string {
  const normalized = reportName.toLowerCase();
  if (normalized.includes("unvoted")) return "Unvoted";
  if (normalized.includes("voted")) return "Voted";
  return random() < 0.6 ? "Voted" : "Unvoted";
}

/**
 * Builds the column/row data for a legacy report, choosing the table layout
 * by matching keywords in the report name (ballot comments, change of
 * address, attendance, by source and day, paper elections, participant vote)
 * and falling back to a generic account/vote-status layout.
 *
 * Seeded from `reportName:meetingId`, so the same report for the same meeting
 * always yields identical data, while different reports and meetings differ.
 *
 * @param reportName - Legacy report name driving the layout selection
 * @param meetingId - Meeting id contributing to the deterministic seed
 * @param meetingDate - Anchor for generated dates (defaults applied when absent)
 * @returns The table to render into PDF or XLS
 */
export function buildMockReportTable(
  reportName: string,
  meetingId: string,
  meetingDate?: string,
): MockReportTable {
  const random = createSeededRandom(hashString(`${reportName}:${meetingId}`));
  const normalized = reportName.toLowerCase();
  const rowCount = randomInt(random, 14, 18);

  if (normalized.includes("ballot comments")) {
    return {
      columns: ["Control #", "Holder Name", "Comment", "Date Received"],
      rows: Array.from({ length: rowCount }, () => [
        controlNumber(random),
        holderName(random),
        pick(random, BALLOT_COMMENTS),
        dateBefore(random, meetingDate, 45),
      ]),
    };
  }

  if (normalized.includes("change of address")) {
    return {
      columns: ["Account #", "Holder Name", "Previous State", "New State", "Effective Date"],
      rows: Array.from({ length: rowCount }, () => [
        accountNumber(random),
        holderName(random),
        pick(random, US_STATES),
        pick(random, US_STATES),
        dateBefore(random, meetingDate, 90),
      ]),
    };
  }

  if (normalized.includes("attendance")) {
    return {
      columns: ["Holder Name", "Account #", "Shares", "Attendance Type", "Check-In Time"],
      rows: Array.from({ length: rowCount }, () => [
        holderName(random),
        accountNumber(random),
        randomInt(random, 100, 250_000),
        pick(random, ATTENDANCE_TYPES),
        `${randomInt(random, 8, 10)}:${String(randomInt(random, 0, 59)).padStart(2, "0")} AM`,
      ]),
    };
  }

  if (normalized.includes("by source and day")) {
    const days = 10;
    const rows: MockCellValue[][] = [];
    for (let dayIndex = days; dayIndex >= 1; dayIndex -= 1) {
      VOTE_SOURCES.forEach((source) => {
        const votes = randomInt(random, 5, 400);
        rows.push([
          dateBefore(random, meetingDate, dayIndex + 1),
          source,
          votes,
          votes * randomInt(random, 80, 1_200),
        ]);
      });
    }
    return {
      columns: ["Date", "Source", "Votes Received", "Shares Voted"],
      rows,
    };
  }

  if (normalized.includes("paper elections detailed")) {
    return {
      columns: ["Control #", "Account #", "Holder Name", "Shares", "Date Received"],
      rows: Array.from({ length: rowCount }, () => [
        controlNumber(random),
        accountNumber(random),
        holderName(random),
        randomInt(random, 100, 180_000),
        dateBefore(random, meetingDate, 30),
      ]),
    };
  }

  if (normalized.includes("participant vote")) {
    return {
      columns: ["Participant", "Shares For", "Shares Against", "Shares Abstain", "Total Voted"],
      rows: PARTICIPANT_NAMES.map((participant) => {
        const sharesFor = randomInt(random, 50_000, 2_500_000);
        const sharesAgainst = randomInt(random, 1_000, 400_000);
        const sharesAbstain = randomInt(random, 500, 120_000);
        return [
          participant,
          sharesFor,
          sharesAgainst,
          sharesAbstain,
          sharesFor + sharesAgainst + sharesAbstain,
        ];
      }),
    };
  }

  return {
    columns: ["Account #", "Holder Name", "Shares", "Vote Status", "Date Voted"],
    rows: Array.from({ length: rowCount }, () => {
      const status = voteStatusForReport(reportName, random);
      return [
        accountNumber(random),
        holderName(random),
        randomInt(random, 100, 300_000),
        status,
        status === "Voted" ? dateBefore(random, meetingDate, 40) : "",
      ];
    }),
  };
}

interface MockReportDocumentProps {
  options: MockReportOptions;
  table: MockReportTable;
  clientLogoUrl?: string;
  betanxtLogoUrl?: string;
}

/**
 * Generic single-page @react-pdf document for any mock report: themed header,
 * meeting meta row, and an evenly-spaced column table with alternating row
 * shading, matching the shared report theme.
 */
const MockReportPDFDocument: React.FC<MockReportDocumentProps> = ({
  options,
  table,
  clientLogoUrl,
  betanxtLogoUrl,
}) => {
  const { reportName, companyName, clientTicker, meetingType, meetingDate } = options;
  const columnWidth = { width: `${100 / table.columns.length}%` };
  // Right-align columns whose every value is numeric (counts, shares, etc.).
  const numericColumns = table.columns.map(
    (_, columnIndex) =>
      table.rows.length > 0 && table.rows.every((row) => typeof row[columnIndex] === "number"),
  );

  return (
    <Document>
      <Page size="LETTER" style={reportStyles.page}>
        <ReportPdfHeader
          reportTitle={reportName}
          subtitle={meetingType}
          clientTicker={clientTicker}
          clientLogoUrl={clientLogoUrl}
          betanxtLogoUrl={betanxtLogoUrl}
        />

        <ReportMetaGrid
          items={[
            { label: "Company Name:", value: companyName },
            ...(meetingDate
              ? [{ label: "Meeting Date:", value: formatReportDate(meetingDate) }]
              : []),
            ...(meetingType ? [{ label: "Meeting Type:", value: meetingType }] : []),
          ]}
        />

        <View style={reportStyles.tableContainer}>
          <View style={reportStyles.tableHeaderRow}>
            {table.columns.map((column, columnIndex) => (
              <Text
                key={column}
                style={[
                  reportStyles.headerCell,
                  columnWidth,
                  ...(numericColumns[columnIndex] ? [reportStyles.cellRight] : []),
                ]}
              >
                {column}
              </Text>
            ))}
          </View>
          {table.rows.map((row, rowIndex) => (
            <View key={rowIndex} style={reportStyles.tableRow}>
              {row.map((value, cellIndex) => (
                <Text
                  key={cellIndex}
                  style={[
                    reportStyles.cell,
                    columnWidth,
                    ...(numericColumns[cellIndex] ? [reportStyles.cellRight] : []),
                  ]}
                >
                  {typeof value === "number" ? value.toLocaleString("en-US") : value}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={reportStyles.footnote}>
          System-generated report. Figures shown are representative for this meeting.
        </Text>

        <ReportPageNumber />
      </Page>
    </Document>
  );
};

/**
 * Generates a mock report as a PDF in the browser and triggers a download
 * named `{reportName}.pdf`. Resolves header logos before rendering.
 *
 * @param options - Report identity plus meeting/client display context
 */
export async function exportMockReportPdf(options: MockReportOptions): Promise<void> {
  const table = buildMockReportTable(options.reportName, options.meetingId, options.meetingDate);
  const { clientLogoUrl, betanxtLogoUrl } = await resolveReportLogos(options.clientTicker);

  const pdfBlob = await pdf(
    <MockReportPDFDocument
      options={options}
      table={table}
      clientLogoUrl={clientLogoUrl}
      betanxtLogoUrl={betanxtLogoUrl}
    />,
  ).toBlob();

  downloadBlob(pdfBlob, `${options.reportName}.pdf`);
}

/**
 * Generates a mock report as an XLS workbook and triggers a download named
 * `{reportName}.xls`. Uses the same seeded table as the PDF variant, so both
 * formats of a report always contain identical data. Column widths are sized
 * to the longest cell value, and the sheet name is sanitized to Excel's
 * 31-character limit.
 *
 * @param options - Report identity plus meeting context for data generation
 */
export function exportMockReportXls(options: MockReportOptions): void {
  const table = buildMockReportTable(options.reportName, options.meetingId, options.meetingDate);

  const worksheet = XLSX.utils.aoa_to_sheet([table.columns, ...table.rows]);
  worksheet["!cols"] = table.columns.map((column, index) => {
    const longestValue = table.rows.reduce(
      (max, row) => Math.max(max, String(row[index] ?? "").length),
      column.length,
    );
    return { wch: Math.min(50, longestValue + 4) };
  });

  const workbook = XLSX.utils.book_new();
  const sheetName = options.reportName.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Report";
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${options.reportName}.xls`);
}
