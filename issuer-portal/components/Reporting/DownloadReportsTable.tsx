"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { IconForFileType } from "@rolemodel/betanxt-design-system/components/icons/IconForFileType";
import { useEffect, useState } from "react";

import GlossaryText from "@/components/ui/GlossaryText";
import SROnlyTableCaption from "@/components/ui/SROnlyTableCaption";
import { useClient } from "@/contexts/ClientContext";
import { useMeeting } from "@/contexts/MeetingContext";
import { useReports } from "@/hooks/useReports";
import { getBrowserSupabase } from "@/lib/browserSupabase";
import { exportBrokerBreakoutPdf } from "@/utils/brokerBreakoutReport";
import {
  exportMockReportPdf,
  exportMockReportXls,
} from "@/utils/mockMeetingReports";

interface ReportItem {
  /** Stable key used for React lists and download state. */
  id: string;
  name: string;
  /** Parent section name for indented sub-reports (e.g. `Account Report - Voted`). */
  groupLabel?: string;
  /** Storage path for real reports persisted in Supabase storage. */
  path?: string;
  /** Generated on demand via the mock report exporters instead of storage. */
  isMock?: boolean;
  /** Non-downloadable section heading row. */
  isHeader?: boolean;
  indent?: boolean;
  /** Generated on demand via {@link exportBrokerBreakoutPdf} (PDF only). */
  isBrokerBreakout?: boolean;
}

interface StorageFile {
  readonly name: string;
}

/** Narrows an untyped storage-list entry to the report field this card needs. */
const isStorageFile = (value: unknown): value is StorageFile =>
  typeof value === "object" &&
  value !== null &&
  "name" in value &&
  typeof value.name === "string";

/**
 * Broker Breakout entry pinned to the top of every meeting's report list
 * (002-tabulation-enhancements). Generated client-side from tabulation data,
 * so it is always downloadable and offered as PDF only.
 */
const brokerBreakoutReport: ReportItem = {
  id: "broker-breakout",
  name: "Broker Breakout Report",
  isBrokerBreakout: true,
};

const mockReports: ReportItem[] = [
  { id: "ballot-comments", name: "Ballot Comments", isMock: true },
  { id: "change-of-address", name: "Change of Address Report", isMock: true },
  { id: "meeting-attendance", name: "Meeting Attendance", isMock: true },
  {
    id: "vote-by-source-day",
    name: "Vote Report by Source and Day",
    isMock: true,
  },
  {
    id: "paper-election-stats",
    name: "Paper Election Statistics by Source and Day",
    isMock: true,
  },
  {
    id: "paper-elections-detailed",
    name: "Paper Elections Detailed Report",
    isMock: true,
  },
  {
    id: "dtc-participant-vote",
    name: "DTC/CDS Participant Vote Report",
    isMock: true,
  },
  {
    id: "registered-accounts-voted",
    name: "Registered Accounts Voted Report",
    isMock: true,
  },
  { id: "account-report-header", name: "Account Report", isHeader: true },
  {
    id: "account-report-voted",
    name: "Voted",
    groupLabel: "Account Report",
    isMock: true,
    indent: true,
  },
  {
    id: "account-report-unvoted",
    name: "Unvoted",
    groupLabel: "Account Report",
    isMock: true,
    indent: true,
  },
  {
    id: "account-report-all",
    name: "All Accounts",
    groupLabel: "Account Report",
    isMock: true,
    indent: true,
  },
  {
    id: "dtc-account-report-header",
    name: "DTC/CDS Participant Account Report",
    isHeader: true,
  },
  {
    id: "dtc-account-report-voted",
    name: "Voted",
    groupLabel: "DTC/CDS Participant Account Report",
    isMock: true,
    indent: true,
  },
  {
    id: "dtc-account-report-unvoted",
    name: "Unvoted",
    groupLabel: "DTC/CDS Participant Account Report",
    isMock: true,
    indent: true,
  },
  {
    id: "dtc-account-report-all",
    name: "All Accounts",
    groupLabel: "DTC/CDS Participant Account Report",
    isMock: true,
    indent: true,
  },
];

/**
 * Resolves the unambiguous display name for a report, prefixing grouped
 * sub-reports with their section (e.g. `Account Report - Voted`) so download
 * labels are distinguishable out of context.
 *
 * @param report - Report list entry
 * @returns The qualified report name
 */
function fullReportName(report: ReportItem): string {
  return report.groupLabel !== undefined && report.groupLabel !== ""
    ? `${report.groupLabel} - ${report.name}`
    : report.name;
}

/**
 * "Download Meeting Reports" card listing every report available for a
 * meeting, each downloadable as PDF and (except Broker Breakout) XLS.
 *
 * All reports are downloadable: real stored artifacts are fetched from
 * Supabase storage, while mock legacy reports and the Broker Breakout Report
 * are generated on demand in the browser. Downloads are serialized — all
 * buttons disable while one is in flight (002-tabulation-enhancements).
 */
const DownloadReportsTable = ({
  meetingId,
}: {
  readonly meetingId: string;
}) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { currentClient } = useClient();
  const { currentMeeting } = useMeeting();
  const { brokerVotingByProposal } = useReports(meetingId);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    let ignore = false;
    async function fetchReports() {
      // Only fetch real reports for Wendy's 2025 annual meeting
      if (meetingId === "wen-annual-meeting-2025") {
        const { data, error } = await supabase.storage
          .from("documents")
          .list(`${meetingId}/reports`);

        if (error !== null) {
          console.error("Error fetching reports:", error);
          if (!ignore) {
            setReports([brokerBreakoutReport, ...mockReports]);
          }
          return;
        }

        if (Array.isArray(data)) {
          const reportItems: ReportItem[] = [];
          for (const item of data) {
            if (!isStorageFile(item) || !item.name.endsWith(".xls")) {
              continue;
            }

            reportItems.push({
              id: `${meetingId}/reports/${item.name}`,
              name: item.name.replace(".xls", ""),
              path: `${meetingId}/reports/${item.name}`,
              isMock: false,
            });
          }
          if (!ignore) {
            setReports([
              brokerBreakoutReport,
              ...(reportItems.length > 0 ? reportItems : mockReports),
            ]);
          }
        }
      } else {
        // Use mock reports for all other meetings
        setReports([brokerBreakoutReport, ...mockReports]);
      }
    }

    void fetchReports();
    return () => {
      ignore = true;
    };
  }, [meetingId, supabase]);

  const downloadStorageReport = async (path: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(path);

    if (error !== null) {
      console.error("Error downloading report:", error);
      return;
    }

    if (data instanceof Blob) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  /**
   * Produces one report using its matching storage or client-side exporter.
   *
   * @param report - Report selected by the user.
   * @param format - Requested document format.
   * @returns A promise that resolves after the selected download is produced.
   */
  const executeDownload = async (
    report: ReportItem,
    format: "pdf" | "xls"
  ): Promise<void> => {
    if (report.isBrokerBreakout === true) {
      await exportBrokerBreakoutPdf({
        companyName:
          currentClient?.company_name ?? currentClient?.short_name ?? "Company",
        clientTicker: currentClient?.ticker,
        meetingType: currentMeeting?.meetingType,
        meetingDate: currentMeeting?.meetingDate,
        brokerVotingByProposal,
      });
      return;
    }

    if (report.isMock === true) {
      const mockOptions = {
        reportName: fullReportName(report),
        meetingId,
        companyName:
          currentClient?.company_name ?? currentClient?.short_name ?? "Company",
        clientTicker: currentClient?.ticker,
        meetingType: currentMeeting?.meetingType,
        meetingDate: currentMeeting?.meetingDate,
      };

      if (format === "pdf") {
        await exportMockReportPdf(mockOptions);
      } else {
        exportMockReportXls(mockOptions);
      }
      return;
    }

    if (report.path !== undefined && report.path !== "") {
      const path =
        format === "pdf" ? report.path.replace(".xls", ".pdf") : report.path;
      await downloadStorageReport(path, `${report.name}.${format}`);
    }
  };

  /**
   * Serializes report downloads and always returns the table to its ready
   * state after the selected exporter completes or fails.
   *
   * @param report - Report selected by the user.
   * @param format - Requested document format.
   * @returns A promise that resolves after the download attempt finishes.
   */
  const handleDownload = async (
    report: ReportItem,
    format: "pdf" | "xls"
  ): Promise<void> => {
    if (downloadingId !== null) return;

    setDownloadingId(report.id);
    try {
      await executeDownload(report, format);
    } catch (error) {
      console.error("Error generating report download:", error);
    }

    setDownloadingId(null);
  };

  return (
    <Card>
      <CardHeader
        title={<GlossaryText>Download Meeting Reports</GlossaryText>}
        subheader={
          currentClient?.company_name ?? currentClient?.short_name ?? "Company"
        }
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table size="small" stickyHeader>
            <SROnlyTableCaption>
              List of available meeting reports for download
            </SROnlyTableCaption>
            <TableHead>
              <TableRow>
                <TableCell>Report Name</TableCell>
                <TableCell align="right">Download</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell
                    sx={
                      report.indent === true
                        ? { pl: 4 }
                        : report.isHeader === true
                          ? {
                              backgroundColor:
                                "var(--mui-palette-tableHeaderRow-restingFill)",
                            }
                          : undefined
                    }
                  >
                    {report.indent === true ? (
                      `- ${report.name}`
                    ) : report.isHeader === true ? (
                      <strong>{report.name}</strong>
                    ) : (
                      report.name
                    )}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={
                      report.isHeader === true
                        ? {
                            backgroundColor:
                              "var(--mui-palette-tableHeaderRow-restingFill)",
                          }
                        : undefined
                    }
                  >
                    {report.isHeader !== true && (
                      <Box
                        component="span"
                        sx={{ display: "inline-flex", gap: 1 }}
                      >
                        <IconButton
                          aria-label={`Download ${fullReportName(report)} as PDF`}
                          color="primary"
                          title={`Download ${fullReportName(report)} as PDF`}
                          disabled={downloadingId !== null}
                          onClick={() => void handleDownload(report, "pdf")}
                        >
                          <IconForFileType fileType="PDF" />
                        </IconButton>
                        {report.isBrokerBreakout !== true && (
                          <IconButton
                            color="primary"
                            aria-label={`Download ${fullReportName(report)} as XLS`}
                            title={`Download ${fullReportName(report)} as XLS`}
                            disabled={downloadingId !== null}
                            onClick={() => void handleDownload(report, "xls")}
                          >
                            <IconForFileType fileType="XLS" />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default DownloadReportsTable;
