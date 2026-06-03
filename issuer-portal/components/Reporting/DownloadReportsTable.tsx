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
import React, { useEffect, useState } from "react";

import SROnlyTableCaption from "@/components/ui/SROnlyTableCaption";
import { getBrowserSupabase } from "@/lib/browserSupabase";

interface ReportItem {
  name: string;
  path?: string;
  isMock?: boolean;
  isHeader?: boolean;
  indent?: boolean;
}

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

const MOCK_REPORTS: ReportItem[] = [
  { name: "Ballot Comments", isMock: true },
  { name: "Change of Address Report", isMock: true },
  { name: "Meeting Attendance", isMock: true },
  { name: "Vote Report by Source and Day", isMock: true },
  { name: "Paper Election Statistics by Source and Day", isMock: true },
  { name: "Paper Elections Detailed Report", isMock: true },
  { name: "DTC/CDS Participant Vote Report", isMock: true },
  { name: "Registered Accounts Voted Report", isMock: true },
  { name: "Account Report", isHeader: true },
  { name: "Voted", isMock: true, indent: true },
  { name: "Unvoted", isMock: true, indent: true },
  { name: "All Accounts", isMock: true, indent: true },
  { name: "DTC/CDS Participant Account Report", isHeader: true },
  { name: "Voted", isMock: true, indent: true },
  { name: "Unvoted", isMock: true, indent: true },
  { name: "All Accounts", isMock: true, indent: true },
];

export default function DownloadReportsTable({ meetingId }: { meetingId: string }) {
  const [reports, setReports] = useState<ReportItem[]>([]);
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
          setReports(MOCK_REPORTS);
          return;
        }

        if (data) {
          const reportItems = (data as StorageFile[])
            .filter((file: StorageFile) => file.name.endsWith(".xls"))
            .map((file: StorageFile) => ({
              name: file.name.replace(".xls", ""),
              path: `${meetingId}/reports/${file.name}`,
              isMock: false,
            }));
          setReports(reportItems.length > 0 ? reportItems : MOCK_REPORTS);
        }
      } else {
        // Use mock reports for all other meetings
        setReports(MOCK_REPORTS);
      }
    }

    void fetchReports();
  }, [meetingId, supabase]);

  const handleDownload = async (path: string | undefined, fileName: string, isMock: boolean) => {
    if (isMock || !path) {
      return;
    }

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

  return (
    <Card>
      <CardHeader title="Download Meeting Reports" />
      <CardContent sx={{ p: 0 }}>
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
              {reports.map((report, index) => (
                <TableRow key={index}>
                  <TableCell sx={report.indent ? { pl: 4 } : undefined}>
                    {report.indent ? `- ${report.name}` : report.name}
                  </TableCell>
                  <TableCell align="right">
                    {!report.isHeader && (
                      <Box component="span" sx={{ display: "inline-flex", gap: 1 }}>
                        <IconButton
                          aria-label={`Download ${report.name} as PDF`}
                          title={`Download ${report.name} as PDF`}
                          disabled={report.isMock}
                          onClick={() =>
                            handleDownload(
                              report.path?.replace(".xls", ".pdf"),
                              `${report.name}.pdf`,
                              report.isMock ?? false,
                            )
                          }
                        >
                          <IconForFileType fileType="PDF" />
                        </IconButton>
                        <IconButton
                          aria-label={`Download ${report.name} as XLS`}
                          title={`Download ${report.name} as XLS`}
                          disabled={report.isMock}
                          onClick={() =>
                            handleDownload(
                              report.path,
                              `${report.name}.xls`,
                              report.isMock ?? false,
                            )
                          }
                        >
                          <IconForFileType fileType="XLS" />
                        </IconButton>
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
