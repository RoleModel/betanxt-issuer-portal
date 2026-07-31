"use client";

import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
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
import useSWR from "swr";

import DocumentStackIcon from "@rolemodel/betanxt-design-system/components/icons/brand/DocumentStackIcon";

import DocumentThumbnail from "@/components/Documents/DocumentThumbnail";
import EmptyState from "@/components/EmptyState";
import DocumentViewer from "@/components/Documents/DocumentViewer";
import FileUploadDialog, {
  type FileUploadDialogField,
} from "@/components/FileUpload/FileUploadDialog";
import type { components } from "@/domain-models/generated-schema";
import buildApiClient from "@/domain-models/apiClient";

type Document = components["schemas"]["Document"];

const ADDITIONAL_MAILING_DOCUMENT_TYPE = "additional-mailing";

const additionalMailingFields: readonly FileUploadDialogField[] = [
  { id: "jobName", label: "Job Name", required: true },
  { id: "positions", label: "Positions", required: true, type: "number" },
  { id: "fullSet", label: "Full Set", required: true, type: "number" },
  { id: "electronic", label: "Electronic", required: true, type: "number" },
];

interface AdditionalMailingMetadata {
  readonly jobName: string;
  readonly positions: number;
  readonly fullSet: number;
  readonly electronic: number;
}

const hasNonEmptyString = (value: string | null | undefined): value is string =>
  value !== null && value !== undefined && value.length > 0;

const toNonNegativeNumber = (value: string): number | null => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
};

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

const fileToDataUri = async (file: File): Promise<string> =>
  await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error(`Unable to read ${file.name}`));
      }
    };
    reader.onerror = () => {
      reject(new Error(`Unable to read ${file.name}`));
    };
    reader.readAsDataURL(file);
  });

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
  readonly meetingId?: string;
  readonly jobs?: FollowUpJob[];
  readonly loading?: boolean;
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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFields, setUploadFields] = useState<Record<string, string>>({
    jobName: "",
    positions: "",
    fullSet: "",
    electronic: "",
  });
  const { data: uploadedDocuments, mutate: mutateUploadedDocuments } = useSWR<
    Document[]
  >(
    hasNonEmptyString(meetingId)
      ? `/meetings/${meetingId}/documents?type=${ADDITIONAL_MAILING_DOCUMENT_TYPE}`
      : null,
    async () => {
      if (!hasNonEmptyString(meetingId)) return [];

      const apiClient = await buildApiClient();
      const { data, error } = await apiClient.GET(
        "/meetings/{meetingId}/documents",
        {
          params: {
            path: { meetingId },
            query: { type: ADDITIONAL_MAILING_DOCUMENT_TYPE },
          },
        }
      );

      if (error) throw new Error("Unable to load additional mailing documents");

      return data ?? [];
    },
    { revalidateOnFocus: false }
  );
  const persistedJobs = (uploadedDocuments ?? [])
    .map(toFollowUpJob)
    .filter((job): job is FollowUpJob => job !== null);
  // Only genuinely uploaded additional mailings are listed. Previously a mock
  // fallback was appended unconditionally, so this table could never be empty.
  const resolvedJobs = [...persistedJobs, ...(jobs ?? [])];

  const handleUploadFieldChange = (fieldId: string, value: string) => {
    setUploadFields((currentFields) => ({
      ...currentFields,
      [fieldId]: value,
    }));
  };

  const handleUpload = async (files: File[]): Promise<void> => {
    if (!hasNonEmptyString(meetingId)) {
      throw new Error("A meeting is required to upload an additional mailing");
    }

    const jobName = uploadFields.jobName.trim();
    const positions = toNonNegativeNumber(uploadFields.positions);
    const fullSet = toNonNegativeNumber(uploadFields.fullSet);
    const electronic = toNonNegativeNumber(uploadFields.electronic);
    const file = files.at(0);

    if (!hasNonEmptyString(jobName)) throw new Error("Enter a job name");
    if (positions === null || fullSet === null || electronic === null) {
      throw new Error("Enter zero or a positive whole number for each count");
    }
    if (file === undefined) throw new Error("Select a PDF to upload");

    const metadata: AdditionalMailingMetadata = {
      jobName,
      positions,
      fullSet,
      electronic,
    };
    const apiClient = await buildApiClient();
    const { data, error } = await apiClient.POST(
      "/meetings/{meetingId}/documents",
      {
        params: { path: { meetingId } },
        body: {
          title: jobName,
          description: JSON.stringify(metadata),
          type: ADDITIONAL_MAILING_DOCUMENT_TYPE,
          file: await fileToDataUri(file),
        },
      }
    );

    if (error || data === undefined) {
      throw new Error("Unable to upload the additional mailing PDF");
    }

    const uploadedJob = toFollowUpJob(data);
    if (uploadedJob === null) {
      throw new Error("The uploaded document did not include a PDF preview");
    }

    await mutateUploadedDocuments(
      (currentDocuments) => [data, ...(currentDocuments ?? [])],
      { revalidate: false }
    );
    setUploadFields({
      jobName: "",
      positions: "",
      fullSet: "",
      electronic: "",
    });
    setActiveJob(uploadedJob);
  };

  return (
    <>
      <Card variant="outlined" elevation={0}>
        <CardHeader
          title="Additional Mailing Summary"
          titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
          action={
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setUploadDialogOpen(true);
              }}
              disabled={!hasNonEmptyString(meetingId)}
            >
              Upload
            </Button>
          }
        />
        <CardContent sx={{ "&:last-child": { p: 0 } }}>
          {resolvedJobs.length === 0 ? (
            <EmptyState
              title="No additional mailings"
              description="Additional mailings will appear here once they are uploaded for this event."
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
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
        }}
        onUpload={handleUpload}
        acceptedFileTypes={[".pdf"]}
        dialogTitle="Upload Additional Mailing"
        fields={additionalMailingFields}
        fieldValues={uploadFields}
        maxFiles={1}
        meetingId={meetingId}
        multiple={false}
        onFieldChange={handleUploadFieldChange}
        showDescription={false}
      />
    </>
  );
};

export default AdditionalMailingSummaryCard;
