"use client";

import { WebOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import React from "react";

import type { components } from "@/domain-models/generated-schema";

import RevisionRequestDialog from "@/components/Documents/RevisionRequestDialog";
import StatusChip from "@/components/ui/StatusChip";
import { useClient } from "@/contexts/ClientContext";
import { useMeeting } from "@/contexts/MeetingContext";
import buildApiClient from "@/domain-models/apiClient";

type Document = components["schemas"]["Document"];

const DocumentViewer = dynamic(
  async () => await import("@/components/Documents/DocumentViewer"),
  {
    ssr: false,
  }
);

interface HostingSiteRevision {
  id: string;
  revision_request: string;
  requested_by?: string;
  requested_at?: string;
  resolved?: boolean;
  resolution_notes?: string;
}

interface HostingSiteComment {
  id: string;
  comment: string;
  user_id?: string;
  user_name?: string;
  created_at?: string;
}

interface HostingSiteStatusData {
  id?: string;
  meeting_id: string;
  client_id?: string;
  status: "Incomplete" | "Pending Review" | "Revision Requested" | "Approved";
  site_url?: string | null;
  test_control_number?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;
  hosting_site_revisions?: HostingSiteRevision[];
  hosting_site_comments?: HostingSiteComment[];
}

const DocumentSiteCard = () => {
  const { currentMeeting } = useMeeting();
  const { currentClient } = useClient();
  const { data: session } = useSession();

  const [hostingSiteStatus, setHostingSiteStatus] =
    React.useState<HostingSiteStatusData | null>(null);
  const [revisionDialogOpen, setRevisionDialogOpen] = React.useState(false);
  const [hostingSiteViewerOpen, setHostingSiteViewerOpen] =
    React.useState(false);

  // Fetch hosting site status on mount
  React.useEffect(() => {
    let ignore = false;

    const fetchHostingSiteStatus = async () => {
      if (!currentMeeting?.id) return;

      try {
        // Query documents table for hosting site document
        const apiClient = await buildApiClient();
        const response = (await apiClient.GET(
          "/meetings/{meetingId}/documents",
          {
            params: { path: { meetingId: currentMeeting.id } },
          }
        )) as { data?: Document[]; error?: unknown };

        if (!ignore) {
          if (!response.error && response.data) {
            // Filter for HOSTING_SITE documents
            const documents = response.data;
            const hostingDocs = documents.filter(
              (d) => d.type === "HOSTING_SITE" || d.type === "hosting_site"
            );
            if (hostingDocs && hostingDocs.length > 0) {
              const doc = hostingDocs[0];
              const mappedStatus: HostingSiteStatusData["status"] =
                doc.status === "APPROVED"
                  ? "Approved"
                  : doc.status === "IN_PROGRESS" ||
                      doc.status === "AWAITING_REVIEW"
                    ? "Pending Review"
                    : "Incomplete";

              setHostingSiteStatus({
                id: doc.id,
                meeting_id: doc.meetingId ?? "",
                status: mappedStatus,
                site_url: doc.filePath || null,
                approved_by: null,
                approved_at: null,
                created_at: doc.createdAt,
                updated_at: doc.updatedAt,
                test_control_number: "123456782",
              });
            } else {
              // No hosting site document exists yet
              setHostingSiteStatus({
                meeting_id: currentMeeting.id,
                status: "Incomplete",
                test_control_number: "123456782",
              });
            }
          }
        }
      } catch (error) {
        if (ignore) return;
        console.error("Failed to fetch hosting site status", error);
        setHostingSiteStatus({
          meeting_id: currentMeeting.id,
          status: "Incomplete",
          test_control_number: "123456782",
        });
      }
    };

    void fetchHostingSiteStatus();

    return () => {
      ignore = true;
    };
  }, [currentMeeting?.id, currentClient?.id]);

  const updateHostingSiteStatus = async (
    status: HostingSiteStatusData["status"],
    additionalData?: Partial<HostingSiteStatusData>
  ) => {
    if (!currentMeeting?.id) return;

    try {
      // If we have an existing document ID, update it
      if (hostingSiteStatus?.id) {
        const response = await fetch(`/api/documents/${hostingSiteStatus.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            approved_by: additionalData?.approved_by,
            approved_at: additionalData?.approved_at,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setHostingSiteStatus({
            ...hostingSiteStatus,
            status,
            ...additionalData,
          });
          return data;
        }
      } else {
        // Create a new hosting site document
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meeting_id: currentMeeting.id,
            title: "Document Hosting Site",
            description: "Shareholder document hosting site status",
            type: "HOSTING_SITE",
            file_path: "",
            file_type: "website",
            status,
            approved_by: additionalData?.approved_by,
            approved_at: additionalData?.approved_at,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setHostingSiteStatus({
            id: data.id,
            meeting_id: data.meeting_id || data.meetingId,
            status: data.status,
            site_url: data.file_path || data.filePath,
            approved_by: data.approved_by || data.approvedBy,
            approved_at: data.approved_at || data.approvedAt,
            created_at: data.created_at || data.createdAt,
            updated_at: data.updated_at || data.updatedAt,
            test_control_number: "123456782",
          });
          return data;
        }
      }
    } catch (error) {
      console.error("Failed to persist hosting site status", error);
      throw error;
    }
  };

  const handleViewHostingSite = () => {
    // Check if we have a valid URL before opening the viewer
    if (!viewerUrl) {
      // Show an alert or notification that the site is not available
      alert(
        "Document hosting site is not available. Please ensure the client branding ID is configured."
      );
      return;
    }
    setHostingSiteViewerOpen(true);
  };

  const handleHostingSiteViewerClose = () => {
    setHostingSiteViewerOpen(false);
  };

  const handleRevisionRequest = () => {
    setRevisionDialogOpen(true);
  };

  const handleRevisionSubmit = async (
    revisionRequest: string
  ): Promise<void> => {
    if (!currentMeeting?.id || !hostingSiteStatus?.id) {
      // Create the document first if it doesn't exist
      if (!hostingSiteStatus?.id) {
        await updateHostingSiteStatus("Revision Requested");
      }
      return;
    }

    try {
      // Submit revision request as a comment on the document
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: hostingSiteStatus.id,
          comment: `REVISION REQUEST: ${revisionRequest}`,
          first_name: session?.user?.name?.split(" ")[0] || "Unknown",
          last_name:
            session?.user?.name?.split(" ").slice(1).join(" ") || "User",
        }),
      });

      if (response.ok) {
        // Update status to indicate revision was requested
        await updateHostingSiteStatus("Revision Requested");
        setRevisionDialogOpen(false);
      } else {
        throw new Error("Failed to submit revision request");
      }
    } catch (error) {
      console.error("Failed to submit hosting site revision request", error);
      throw error;
    }
  };

  const handleApproveSite = async (): Promise<void> => {
    try {
      await updateHostingSiteStatus("Approved", {
        approved_by:
          session?.user?.email ?? session?.user?.name ?? "Unknown User",
        approved_at: new Date().toISOString(),
      });
      setHostingSiteViewerOpen(false);
    } catch (err) {
      console.error("Failed to approve hosting site", err);
    }
  };

  const derivedYear = (
    currentMeeting?.meetingYear ??
    (currentMeeting?.meetingDate
      ? new Date(currentMeeting.meetingDate).getFullYear()
      : new Date().getFullYear())
  ).toString();
  const viewerUrl =
    currentClient?.branding_id && derivedYear
      ? `https://www.proxydocs.com/branding/${currentClient.branding_id}/2025/issuer/`
      : undefined;

  return (
    <>
      <Card sx={{ height: "auto" }}>
        <CardContent>
          <Box
            sx={{
              p: 3,
              backgroundColor: "background.default",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              gap: 2,
            }}
          >
            <WebOutlined sx={{ fontSize: 40 }} />
            <Typography variant="h3" component="p">
              Document Hosting Site
            </Typography>
            <Typography variant="body3" color="text.secondary">
              Verify all shareholder facing sites, you will use the test control
              number (123456782) to enter the voting site. Once approved, sites
              will be made active in conjunction with the filing mailing date.
            </Typography>
            <StatusChip status={hostingSiteStatus?.status ?? "Incomplete"} />
          </Box>
        </CardContent>
        <CardActions>
          <Button
            variant="outlined"
            onClick={handleViewHostingSite}
            sx={{ textTransform: "none" }}
          >
            View Site
          </Button>
          <Button variant="outlined" onClick={handleRevisionRequest}>
            Request Revision
          </Button>
        </CardActions>
      </Card>

      <DocumentViewer
        open={hostingSiteViewerOpen}
        onClose={handleHostingSiteViewerClose}
        fileUrl={viewerUrl ?? ""}
        title="Document Hosting Site"
        isWebsiteView={true}
        onApproveSite={handleApproveSite}
        onRequestRevision={handleRevisionRequest}
      />

      <RevisionRequestDialog
        open={revisionDialogOpen}
        onClose={() => {
          setRevisionDialogOpen(false);
        }}
        onSubmit={handleRevisionSubmit}
        title="Request Site Revision"
        description="Please describe the revisions needed for the document hosting site."
      />
    </>
  );
};

export default DocumentSiteCard;
