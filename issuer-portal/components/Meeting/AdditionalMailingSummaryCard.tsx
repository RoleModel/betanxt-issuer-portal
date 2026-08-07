/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
"use client";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Badge,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
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
import { useParams } from "next/navigation";
import React, { useState } from "react";
import useSWR from "swr";

import type { components } from "@/domain-models/generated-schema";

import DocumentThumbnail from "@/components/Documents/DocumentThumbnail";
import DocumentViewer from "@/components/Documents/DocumentViewer";
import EmptyState from "@/components/EmptyState";
import buildApiClient from "@/domain-models/apiClient";

type Document = components["schemas"]["Document"];

/** One document inside a follow-up mailing job. */
interface JobDocument {
  readonly id: string;
  readonly label: string;
  readonly fileUrl: string;
}

/**
 * A single follow-up ("FW") mailing job for an event. Most events have 1-3 of
 * these; a few can have ~15, so this renders as a scrollable table. A job can
 * mail more than one document — a supplement usually rides with a notice or
 * card — so each row carries its full document list and expands when there is
 * more than one.
 */
interface FollowUpJob {
  id: string;
  /** Alternate job name shown to the issuer */
  alternateJobName: string;
  /** Date the follow-up job was sent */
  sentDate?: string;
  /** Number of positions included in this follow-up job */
  positions?: number;
  /** Every document mailed in this job, in mailing order */
  documents: readonly JobDocument[];
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

/**
 * Groups the meeting's stored additional-mailing documents into jobs. The
 * operations team stores one row per document; documents sharing a job name
 * belong to the same mailing job and become one expandable row.
 */
const toFollowUpJobs = (documents: readonly Document[]): FollowUpJob[] => {
  const jobsByName = new Map<string, FollowUpJob>();

  for (const document of documents) {
    const metadata = parseAdditionalMailingMetadata(document.description);
    const documentId = document.id;
    if (
      metadata === null ||
      !hasNonEmptyString(documentId) ||
      !hasNonEmptyString(document.filePath)
    ) {
      continue;
    }

    const jobDocument: JobDocument = {
      id: documentId,
      label: hasNonEmptyString(document.title)
        ? document.title
        : metadata.jobName,
      fileUrl: document.filePath,
    };

    const existing = jobsByName.get(metadata.jobName);
    if (existing) {
      existing.documents = [...existing.documents, jobDocument];
      continue;
    }

    jobsByName.set(metadata.jobName, {
      id: documentId,
      alternateJobName: metadata.jobName,
      sentDate: document.createdAt,
      positions: metadata.positions,
      documents: [jobDocument],
      fullSetFulfillmentRequests: metadata.fullSet,
      electronicFulfillmentRequests: metadata.electronic,
    });
  }

  return [...jobsByName.values()];
};

/**
 * Demo follow-up jobs built from the client's generated mailing PDFs, shown
 * when the database holds no additional mailings for the meeting. FW2 mails
 * two documents — the supplement rides with the notice — so the multi-document
 * row UX is always visible somewhere.
 */
const buildDemoJobs = (ticker: string): FollowUpJob[] => {
  if (ticker.length === 0) return [];

  const base = `/mock-mailings/${ticker}`;
  return [
    {
      id: "demo-fw1",
      alternateJobName: "FW1 — Proxy Card (Reminder, Unvoted)",
      sentDate: "2026-04-14",
      positions: 4820,
      documents: [
        {
          id: "demo-fw1-card",
          label: "Proxy Card Reminder",
          fileUrl: `${base}/fw1-reminder-unvoted.pdf`,
        },
      ],
      fullSetFulfillmentRequests: 3,
      electronicFulfillmentRequests: 1,
    },
    {
      id: "demo-fw2",
      alternateJobName: "FW2 — Supplemental Proxy Material",
      sentDate: "2026-04-24",
      positions: 12960,
      documents: [
        {
          id: "demo-fw2-supplement",
          label: "Supplemental Materials",
          fileUrl: `${base}/fw2-supplemental-proxy.pdf`,
        },
        {
          id: "demo-fw2-notice",
          label: "Notice of Internet Availability",
          fileUrl: `${base}/naa.pdf`,
        },
      ],
      fullSetFulfillmentRequests: 6,
      electronicFulfillmentRequests: 4,
    },
    {
      id: "demo-fw3",
      alternateJobName: "FW3 — Shareholder Letter (Retail)",
      sentDate: "2026-05-04",
      positions: 2140,
      documents: [
        {
          id: "demo-fw3-letter",
          label: "Shareholder Letter",
          fileUrl: `${base}/fw3-second-reminder-retail.pdf`,
        },
      ],
      fullSetFulfillmentRequests: 0,
      electronicFulfillmentRequests: 2,
    },
  ];
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

interface ActiveDocument {
  readonly title: string;
  readonly fileUrl: string;
}

const AdditionalMailingSummaryCard: React.FC<
  AdditionalMailingSummaryCardProps
> = ({ meetingId, jobs }) => {
  const params = useParams<{ clientTicker?: string }>();
  const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(
    null
  );
  const [expandedJobIds, setExpandedJobIds] = useState<readonly string[]>([]);

  const ticker =
    typeof params.clientTicker === "string"
      ? params.clientTicker.toUpperCase()
      : "";

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
  const persistedJobs = toFollowUpJobs(mailingDocuments ?? []);
  const providedJobs = [...persistedJobs, ...(jobs ?? [])];
  const resolvedJobs =
    providedJobs.length > 0 ? providedJobs : buildDemoJobs(ticker);

  const toggleExpanded = (jobId: string) => {
    setExpandedJobIds((current) =>
      current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId]
    );
  };

  const openDocument = (job: FollowUpJob, jobDocument: JobDocument) => {
    setActiveDocument({
      title: `${job.alternateJobName} — ${jobDocument.label}`,
      fileUrl: jobDocument.fileUrl,
    });
  };

  const handleRowClick = (job: FollowUpJob) => {
    const [firstDocument] = job.documents;
    if (job.documents.length > 1) {
      toggleExpanded(job.id);
    } else if (firstDocument !== undefined) {
      openDocument(job, firstDocument);
    }
  };

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
                    {resolvedJobs.map((job) => {
                      const expanded = expandedJobIds.includes(job.id);
                      const [firstDocument] = job.documents;
                      const extraCount = job.documents.length - 1;

                      return (
                        <React.Fragment key={job.id}>
                          <TableRow
                            onClick={() => {
                              handleRowClick(job);
                            }}
                            hover
                            sx={{ cursor: "pointer" }}
                          >
                            <TableCell sx={{ fontWeight: 500, width: 50 }}>
                              {firstDocument ? (
                                <Badge
                                  badgeContent={
                                    extraCount > 0 ? `+${extraCount}` : null
                                  }
                                  color="primary"
                                  overlap="rectangular"
                                >
                                  <DocumentThumbnail
                                    filePath={firstDocument.fileUrl}
                                  />
                                </Badge>
                              ) : (
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  —
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                              >
                                <span>{job.alternateJobName}</span>
                                {job.documents.length > 1 && (
                                  <IconButton
                                    aria-expanded={expanded}
                                    aria-label={`${expanded ? "Hide" : "Show"} the ${job.documents.length} documents in ${job.alternateJobName}`}
                                    size="small"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleExpanded(job.id);
                                    }}
                                  >
                                    {expanded ? (
                                      <KeyboardArrowUpIcon fontSize="small" />
                                    ) : (
                                      <KeyboardArrowDownIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                )}
                              </Stack>
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
                                          job.electronicFulfillmentRequests ===
                                          1
                                            ? ""
                                            : "s"
                                        }`
                                      : "No electronic fulfillment requests"
                                  }
                                >
                                  <Chip
                                    size="small"
                                    label={`Electronic: ${formatNumber(job.electronicFulfillmentRequests)}`}
                                    color="default"
                                    variant="outlined"
                                    sx={{ px: 1 }}
                                  />
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>

                          {/* Expanded detail row — one labelled thumbnail per
                              document in the job, like the tabulation table's
                              expandable rows. */}
                          {expanded ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                sx={{
                                  backgroundColor: "background.default",
                                  py: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 2,
                                    pl: 1,
                                  }}
                                >
                                  {job.documents.map((jobDocument) => (
                                    <Box
                                      key={jobDocument.id}
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 0.5,
                                        width: 108,
                                        textAlign: "center",
                                        fontSize: (theme) =>
                                          theme.typography.caption.fontSize,
                                        color: "text.secondary",
                                      }}
                                    >
                                      <DocumentThumbnail
                                        filePath={jobDocument.fileUrl}
                                        width={60}
                                        onClick={() => {
                                          openDocument(job, jobDocument);
                                        }}
                                      />
                                      {jobDocument.label}
                                    </Box>
                                  ))}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
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
        open={Boolean(activeDocument)}
        onClose={() => {
          setActiveDocument(null);
        }}
        fileUrl={activeDocument?.fileUrl}
        title={activeDocument?.title}
        signatureAreas={[]}
        hideActivityButtons
        showDownloadButton
      />
    </>
  );
};

export default AdditionalMailingSummaryCard;
