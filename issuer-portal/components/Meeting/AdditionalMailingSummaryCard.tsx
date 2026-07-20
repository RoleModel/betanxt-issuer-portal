"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

import DocumentThumbnail from "@/components/Documents/DocumentThumbnail";
import DocumentViewer from "@/components/Documents/DocumentViewer";

/**
 * A single follow-up ("FW") mailing job for an event. Most events have 1-3 of
 * these; a few can have ~15, so this renders as a scrollable table.
 */
export interface FollowUpJob {
  id: string;
  /** Alternate job name shown to the issuer */
  alternateJobName: string;
  /** Date the follow-up job was sent */
  sentDate?: string;
  /** Number of positions included in this follow-up job */
  positions?: number;
  /** URL of the PDF showing exactly what was mailed */
  pdfUrl?: string;
  /** Count of ad-hoc / email fulfillment requests (the "Q") tied to this job */
  fulfillmentRequests?: number;
  fullSetFulfillmentRequests?: number;
  electronicFulfillmentRequests?: number;
}

interface AdditionalMailingSummaryCardProps {
  /** Client ticker — selects the per-client themed mock PDFs under /mock-mailings/{TICKER}. */
  ticker?: string | null;
  jobs?: FollowUpJob[];
  loading?: boolean;
}

/**
 * Builds the prototype mock follow-up jobs for a client. The themed
 * proxy/document PDFs are generated per client by
 * scripts/generate-mock-mailing-pdfs.tsx into /public/mock-mailings/{TICKER}.
 *
 * Exported so reporting surfaces (e.g. the quorum timeline's follow-up
 * milestones) can reuse the same follow-up mailing data source until a real
 * endpoint exists.
 *
 * @param ticker - Client ticker; selects the per-client mock PDF directory
 * @returns Mock follow-up mailing jobs with sent dates and PDF URLs
 */
export const buildMockFollowUpJobs = (ticker: string): FollowUpJob[] => {
  const base = `/mock-mailings/${ticker.toUpperCase()}`;
  return [
    {
      id: "fw-1",
      alternateJobName: "FW1 — Proxy Card (Reminder, Unvoted)",
      sentDate: "04/18/2026",
      positions: 1240,
      pdfUrl: `${base}/fw1-reminder-unvoted.pdf`,
      fulfillmentRequests: 30000,
      fullSetFulfillmentRequests: 17000,
      electronicFulfillmentRequests: 23000,
    },
    {
      id: "fw-2",
      alternateJobName: "FW2 — Supplemental Proxy Material",
      sentDate: "04/25/2026",
      positions: 318,
      pdfUrl: `${base}/fw2-supplemental-proxy.pdf`,
      fulfillmentRequests: 3450,
      fullSetFulfillmentRequests: 450,
      electronicFulfillmentRequests: 2600,
    },
    {
      id: "fw-3",
      alternateJobName: "FW3 — Shareholder Letter (Retail)",
      sentDate: "05/02/2026",
      positions: 904,
      pdfUrl: `${base}/fw3-second-reminder-retail.pdf`,
      fulfillmentRequests: 4045,
      fullSetFulfillmentRequests: 345,
      electronicFulfillmentRequests: 2500,
    },
  ];
};

const formatNumber = (num: number | null | undefined): string =>
  num === null || num === undefined ? "0" : num.toLocaleString("en-US");

const AdditionalMailingSummaryCard: React.FC<
  AdditionalMailingSummaryCardProps
> = ({ ticker, jobs }) => {
  const [activeJob, setActiveJob] = useState<FollowUpJob | null>(null);
  const resolvedJobs = jobs ?? buildMockFollowUpJobs(ticker || "WEN");

  if (resolvedJobs.length === 0) {
    return (
      <Card variant="outlined" elevation={0}>
        <CardContent>
          <Typography variant="body3" color="text.secondary">
            No follow-up mailings for this event.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card variant="outlined" elevation={0}>
        <CardHeader
          title="Additional Mailing Summary"
          titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
        />
        <CardContent sx={{ "&:last-child": { p: 0 } }}>
          <TableContainer sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                    Job Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    Sent
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Positions
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                  >
                    Full Set / Electronic
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resolvedJobs.map((job) => (
                  <TableRow
                    onClick={() => setActiveJob(job)}
                    key={job.id}
                    hover
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ fontWeight: 500, width: 50 }}>
                      {job.pdfUrl ? (
                        <DocumentThumbnail filePath={job.pdfUrl} />
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {job.alternateJobName}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {job.sentDate ?? "—"}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontVariantNumeric: "tabularNums" }}
                    >
                      {formatNumber(job.positions)}
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="column" alignItems="end" spacing={1}>
                        <Tooltip
                          title={
                            job.fullSetFulfillmentRequests
                              ? `${job.fullSetFulfillmentRequests} full set fulfillment request${
                                  job.fullSetFulfillmentRequests === 1
                                    ? ""
                                    : "s"
                                }`
                              : "No full set fulfillment requests"
                          }
                        >
                          <Chip
                            size="small"
                            label={`Full Set: ${formatNumber(job.fullSetFulfillmentRequests)}`}
                            color={
                              job.fullSetFulfillmentRequests
                                ? "primary"
                                : "default"
                            }
                            variant={"outlined"}
                            sx={{ px: 1 }}
                          />
                        </Tooltip>
                        <Tooltip
                          title={
                            job.electronicFulfillmentRequests
                              ? `${job.electronicFulfillmentRequests} electronic fulfillment request${
                                  job.electronicFulfillmentRequests === 1
                                    ? ""
                                    : "s"
                                }`
                              : "No electronic fulfillment requests"
                          }
                        >
                          <Chip
                            size="small"
                            label={`Electronic: ${formatNumber(job.electronicFulfillmentRequests)}`}
                            color={
                              job.electronicFulfillmentRequests
                                ? "default"
                                : "default"
                            }
                            variant={"outlined"}
                            sx={{ px: 1 }}
                          />
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {resolvedJobs.length} follow-up mailing
              {resolvedJobs.length === 1 ? "" : "s"} for this event
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Read-only PDF preview of the mailed document. Empty signatureAreas → view-only;
          activity buttons hidden since a mailing has no comments/history. */}
      <DocumentViewer
        open={Boolean(activeJob)}
        onClose={() => setActiveJob(null)}
        fileUrl={activeJob?.pdfUrl}
        title={activeJob?.alternateJobName}
        signatureAreas={[]}
        hideActivityButtons
        showDownloadButton
      />
    </>
  );
};

export default AdditionalMailingSummaryCard;
