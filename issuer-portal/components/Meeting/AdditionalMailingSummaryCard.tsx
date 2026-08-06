/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
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
import DocumentStackIcon from "@rolemodel/betanxt-design-system/components/icons/brand/DocumentStackIcon";
import React, { useState } from "react";
import useSWR from "swr";

import type { components } from "@/domain-models/generated-schema";

import DocumentThumbnail from "@/components/Documents/DocumentThumbnail";
import DocumentViewer from "@/components/Documents/DocumentViewer";
import EmptyState from "@/components/EmptyState";
import buildApiClient from "@/domain-models/apiClient";

type Document = components["schemas"]["Document"];

/**
 * A single follow-up ("FW") mailing job for an event. Most events have 1-3 of
 * these; a few can have ~15, so this renders as a scrollable table.
 */
interface FollowUpJob {
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

const AdditionalMailingDocumentType = "additional-mailing";

interface AdditionalMailingMetadata {
  readonly jobName: string;
  readonly positions: number;
  readonly fullSet: number;
  readonly electronic: number;
}

const hasNonEmptyString = (value: string | null | undefined): value is string =>
  value !== null && value !== undefined && value.length > 0;

const parseAdditionalMailingMetadata = (
  description: string | null | undefined
): AdditionalMailingMetadata | null => {
  if (!hasNonEmptyString(description)) return null;

  try {
    const parsed: unknown = JSON.parse(description);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    const metadata = parsed as Record<string, unknown>;
    const { electronic, fullSet, jobName, positions } = metadata;

    if (
      typeof jobName !== "string" ||
      typeof positions !== "number" ||
      typeof fullSet !== "number" ||
      typeof electronic !== "number"
    ) {
      return null;
    }

    return { jobName, positions, fullSet, electronic };
  } catch {
    return null;
  }
};

const toFollowUpJob = (document: Document): FollowUpJob | null => {
  const metadata = parseAdditionalMailingMetadata(document.description);
  const documentId = document.id;
  if (
    metadata === null ||
    !hasNonEmptyString(documentId) ||
    !hasNonEmptyString(document.filePath)
  ) {
    return null;
  }

  return {
    id: documentId,
    alternateJobName: metadata.jobName,
    sentDate: document.createdAt,
    positions: metadata.positions,
    pdfUrl: document.filePath,
    fullSetFulfillmentRequests: metadata.fullSet,
    electronicFulfillmentRequests: metadata.electronic,
  };
};

interface AdditionalMailingSummaryCardProps {
  readonly meetingId?: string;
  readonly jobs?: FollowUpJob[];
}

const formatNumber = (num: number | null | undefined): string =>
  num === null || num === undefined ? "0" : num.toLocaleString("en-US");

const formatSentDate = (date: string | undefined): string => {
  if (!hasNonEmptyString(date)) return "—";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
};

const AdditionalMailingSummaryCard: React.FC<
  AdditionalMailingSummaryCardProps
> = ({ meetingId, jobs }) => {
  const [activeJob, setActiveJob] = useState<FollowUpJob | null>(null);
  // Additional mailing jobs come straight from the database — the operations
  // team stores mailing materials there, so nothing is uploaded from this
  // screen.
  const { data: mailingDocuments } = useSWR<Document[]>(
    hasNonEmptyString(meetingId)
      ? `/meetings/${meetingId}/documents?type=${AdditionalMailingDocumentType}`
      : null,
    async () => {
      if (!hasNonEmptyString(meetingId)) return [];

      const apiClient = await buildApiClient();
      const { data, error } = await apiClient.GET(
        "/meetings/{meetingId}/documents",
        {
          params: {
            path: { meetingId },
            query: { type: AdditionalMailingDocumentType },
          },
        }
      );

      if (error) throw new Error("Unable to load additional mailing documents");

      return data ?? [];
    },
    { revalidateOnFocus: false }
  );
  const persistedJobs = (mailingDocuments ?? [])
    .map(toFollowUpJob)
    .filter((job): job is FollowUpJob => job !== null);
  const resolvedJobs = [...persistedJobs, ...(jobs ?? [])];

  return (
    <>
      <Card variant="outlined" elevation={0}>
        <CardHeader title="Additional Mailing Summary" />
        <CardContent sx={{ "&:last-child": { p: 0 } }}>
          {resolvedJobs.length === 0 ? (
            <EmptyState
              title="No additional mailings"
              description="Additional mailings will appear here once they are recorded for this event."
              minHeight="unset"
              icon={<DocumentStackIcon />}
            />
          ) : (
            <>
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
                        onClick={() => {
                          setActiveJob(job);
                        }}
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
                          {formatSentDate(job.sentDate)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontVariantNumeric: "tabularNums" }}
                        >
                          {formatNumber(job.positions)}
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="column"
                            alignItems="end"
                            spacing={1}
                          >
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
                                variant="outlined"
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
                                variant="outlined"
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Read-only PDF preview of the mailed document. Empty signatureAreas → view-only;
          activity buttons hidden since a mailing has no comments/history. */}
      <DocumentViewer
        open={Boolean(activeJob)}
        onClose={() => {
          setActiveJob(null);
        }}
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
