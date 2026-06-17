"use client";

import type { SelectChangeEvent } from "@mui/material";

import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { IconForFileType } from "@rolemodel/betanxt-design-system/components/icons/IconForFileType";
import React, { useEffect, useMemo, useState } from "react";

import SROnlyTableCaption from "@/components/ui/SROnlyTableCaption";
import { useClient } from "@/contexts/ClientContext";
import { useMeeting } from "@/contexts/MeetingContext";
import { useReports } from "@/hooks/useReports";
import { getBrowserSupabase } from "@/lib/browserSupabase";
import { exportBrokerBreakoutPdf } from "@/utils/brokerBreakoutReport";
import { exportMockReportPdf, exportMockReportXls } from "@/utils/mockMeetingReports";

interface ReportItem {
  /** Stable key used for React lists and the report-selection dropdown value. */
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
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

/**
 * Broker Breakout entry pinned to the top of every meeting's report list
 * (002-tabulation-enhancements). Generated client-side from tabulation data,
 * so it is always downloadable and offered as PDF only.
 */
const BROKER_BREAKOUT_REPORT: ReportItem = {
  id: "broker-breakout",
  name: "Broker Breakout Report",
  isBrokerBreakout: true,
};

const MOCK_REPORTS: ReportItem[] = [
  { id: "ballot-comments", name: "Ballot Comments", isMock: true },
  { id: "change-of-address", name: "Change of Address Report", isMock: true },
  { id: "meeting-attendance", name: "Meeting Attendance", isMock: true },
  { id: "vote-by-source-day", name: "Vote Report by Source and Day", isMock: true },
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
  { id: "dtc-participant-vote", name: "DTC/CDS Participant Vote Report", isMock: true },
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
 * sub-reports with their section (e.g. `Account Report - Voted`) so dropdown
 * entries and download labels are distinguishable out of context.
 *
 * @param report - Report list entry
 * @returns The qualified report name
 */
function fullReportName(report: ReportItem): string {
  return report.groupLabel ? `${report.groupLabel} - ${report.name}` : report.name;
}

/**
 * "Download Meeting Reports" card listing every report available for a
 * meeting, each downloadable as PDF and (except Broker Breakout) XLS.
 *
 * A quick-access dropdown above the table downloads the selected report as
 * PDF, defaulting to Broker Breakout. All reports are downloadable: real
 * stored artifacts are fetched from Supabase storage, while mock legacy
 * reports and the Broker Breakout Report are generated on demand in the
 * browser. Downloads are serialized — all buttons disable while one is in
 * flight (002-tabulation-enhancements).
 */
export default function DownloadReportsTable({ meetingId }: { meetingId: string }) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>(BROKER_BREAKOUT_REPORT.id);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { currentClient } = useClient();
  const { currentMeeting } = useMeeting();
  const { brokerVotingByProposal } = useReports(meetingId);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    async function fetchReports() {
      // Only fetch real reports for Wendy's 2025 annual meeting
      if (meetingId === "wen-annual-meeting-2025") {
        const { data, error } = await supabase.storage
          .from("documents")
          .list(`${meetingId}/reports`);

        if (error) {
          console.error("Error fetching reports:", error);
          setReports([BROKER_BREAKOUT_REPORT, ...MOCK_REPORTS]);
          return;
        }

        if (data) {
          const reportItems = (data as StorageFile[])
            .filter((file: StorageFile) => file.name.endsWith(".xls"))
            .map((file: StorageFile) => ({
              id: `${meetingId}/reports/${file.name}`,
              name: file.name.replace(".xls", ""),
              path: `${meetingId}/reports/${file.name}`,
              isMock: false,
            }));
          setReports([
            BROKER_BREAKOUT_REPORT,
            ...(reportItems.length > 0 ? reportItems : MOCK_REPORTS),
          ]);
        }
      } else {
        // Use mock reports for all other meetings
        setReports([BROKER_BREAKOUT_REPORT, ...MOCK_REPORTS]);
      }
    }

    void fetchReports();
  }, [meetingId, supabase]);

  const downloadableReports = useMemo(
    () => reports.filter((report) => !report.isHeader),
    [reports],
  );

  const downloadStorageReport = async (path: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("documents").download(path);

    if (error) {
      console.error("Error downloading report:", error);
      return;
    }

    if (data) {
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
   * Routes a download to the right producer: Broker Breakout → client-side
   * PDF generation, mock reports → seeded PDF/XLS generation, stored reports
   * → Supabase storage fetch. Ignored while another download is in flight.
   */
  const handleDownload = async (report: ReportItem, format: "pdf" | "xls") => {
    if (downloadingId) return;

    setDownloadingId(report.id);
    try {
      if (report.isBrokerBreakout) {
        await exportBrokerBreakoutPdf({
          companyName: currentClient?.company_name ?? currentClient?.short_name ?? "Company",
          clientTicker: currentClient?.ticker,
          meetingType: currentMeeting?.meetingType,
          meetingDate: currentMeeting?.meetingDate,
          brokerVotingByProposal,
        });
        return;
      }

      if (report.isMock) {
        const mockOptions = {
          reportName: fullReportName(report),
          meetingId,
          companyName: currentClient?.company_name ?? currentClient?.short_name ?? "Company",
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

      if (report.path) {
        const path = format === "pdf" ? report.path.replace(".xls", ".pdf") : report.path;
        await downloadStorageReport(path, `${report.name}.${format}`);
      }
    } catch (error) {
      console.error("Error generating report download:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSelectedReportChange = (event: SelectChangeEvent) => {
    setSelectedReportId(event.target.value);
  };

  const handleSelectedReportDownload = async () => {
    const selectedReport = downloadableReports.find((report) => report.id === selectedReportId);
    if (!selectedReport) return;
    await handleDownload(selectedReport, "pdf");
  };

  return (
    <Card>
      <CardHeader title="Download Meeting Reports" />
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, pb: 2 }}>
          <FormControl size="small" sx={{ flex: 1, minWidth: 240 }}>
            <InputLabel id="report-select-label">Report</InputLabel>
            <Select
              labelId="report-select-label"
              id="report-select"
              label="Report"
              value={selectedReportId}
              onChange={handleSelectedReportChange}
            >
              {downloadableReports.map((report) => (
                <MenuItem key={report.id} value={report.id}>
                  {fullReportName(report)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<FileDownloadOutlinedIcon />}
            disabled={downloadingId !== null || downloadableReports.length === 0}
            onClick={() => void handleSelectedReportDownload()}
          >
            Download
          </Button>
        </Box>
        <TableContainer>
          <Table size="small" stickyHeader>
            <SROnlyTableCaption>List of available meeting reports for download</SROnlyTableCaption>
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
                      report.indent
                        ? { pl: 4 }
                        : report.isHeader
                          ? {
                              backgroundColor: "var(--mui-palette-tableHeaderRow-restingFill)",
                            }
                          : undefined
                    }
                  >
                    {report.indent ? (
                      `- ${report.name}`
                    ) : report.isHeader ? (
                      <strong>{report.name}</strong>
                    ) : (
                      report.name
                    )}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={
                      report.isHeader
                        ? {
                            backgroundColor: "var(--mui-palette-tableHeaderRow-restingFill)",
                          }
                        : undefined
                    }
                  >
                    {!report.isHeader && (
                      <Box component="span" sx={{ display: "inline-flex", gap: 1 }}>
                        <IconButton
                          aria-label={`Download ${fullReportName(report)} as PDF`}
                          title={`Download ${fullReportName(report)} as PDF`}
                          disabled={downloadingId !== null}
                          onClick={() => void handleDownload(report, "pdf")}
                        >
                          <IconForFileType fileType="PDF" />
                        </IconButton>
                        {!report.isBrokerBreakout && (
                          <IconButton
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
}
