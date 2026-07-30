"use client";

import { FileUploadOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import BNFileUpload from "@/components/FileUpload/BNFileUpload";
import SkeletonTable from "@/components/ui/SkeletonTable";
import StatusChip from "@/components/ui/StatusChip";
import { useDocuments } from "@/contexts/DocumentContext";

import { AddDocumentDialog } from "./AddDocumentDialog";
import { ExportButton } from "./ExportButton";

type DigitalShareholderMeeting =
  components["schemas"]["DigitalShareholderMeeting"];

interface DSMParticipantsProps {
  meetingId: string;
}

interface ParticipantWithRole extends DigitalShareholderMeeting {
  role: string;
  documentName?: string;
  documentStatus?: string;
  documentUrl?: string;
}

export const DSMParticipants = ({ meetingId }: DSMParticipantsProps) => {
  const { dsmDocuments, refreshDocuments } = useDocuments();
  const [participants, setParticipants] = useState<ParticipantWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] =
    useState<ParticipantWithRole | null>(null);
  const [addDocumentDialogOpen, setAddDocumentDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const fetchParticipants = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const API_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
      const response = await fetch(
        `${API_URL}/meetings/${meetingId}/digital-shareholder-meeting`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch participants");
      }

      const data = (await response.json()) as DigitalShareholderMeeting[];

      console.log("[DSMParticipants] Fetched participants:", data);
      console.log(
        "[DSMParticipants] DSM documents from context:",
        dsmDocuments.length,
        dsmDocuments
      );

      // Transform data to include role information
      const participantsWithRoles: ParticipantWithRole[] = data.map(
        (participant) => {
          const role = participant.registrantType ?? "Shareholder";

          // Find participant-specific documents (documents should be linked to participant ID)
          const participantDocuments = dsmDocuments.filter((doc) => {
            console.log(
              `[DSMParticipants] Checking doc.participantId: "${doc.participantId}" === participant.id: "${participant.id}"`
            );
            // Only match documents that have a participantId and it matches this participant
            return doc.participantId && doc.participantId === participant.id;
          });

          const hasDocuments = participantDocuments.length > 0;
          const firstDocument = participantDocuments[0];

          return {
            ...participant,
            role,
            documentName: hasDocuments
              ? firstDocument?.title?.replace(/\.[^/.]+$/, "") // Clean title without extension
              : undefined,
            documentStatus: firstDocument?.status || undefined, // Use actual document status from API
            documentUrl: firstDocument?.filePath || undefined,
          };
        }
      );

      setParticipants(participantsWithRoles);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load participants"
      );
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, dsmDocuments]);

  useEffect(() => {
    void fetchParticipants();
  }, [fetchParticipants]);

  // Listen for attendees upload event
  useEffect(() => {
    const handleAttendeesUploaded = () => {
      console.log(
        "[DSMParticipants] Attendees uploaded event received, refreshing..."
      );
      void fetchParticipants();
    };

    window.addEventListener("dsmAttendeesUploaded", handleAttendeesUploaded);

    return () => {
      window.removeEventListener(
        "dsmAttendeesUploaded",
        handleAttendeesUploaded
      );
    };
  }, [fetchParticipants]);

  const handleAddDocument = (participant: ParticipantWithRole) => {
    console.log(
      "[DSMParticipants] Adding document for participant:",
      participant.id,
      participant.firstName,
      participant.lastName
    );
    setSelectedParticipant(participant);
    setAddDocumentDialogOpen(true);
  };

  const handleDocumentAdded = async () => {
    if (selectedParticipant) {
      console.log(
        "[DSMParticipants] Document added for participant:",
        selectedParticipant
      );

      // Refresh documents from DocumentContext to get latest status
      await refreshDocuments(meetingId);

      // fetchParticipants will automatically run due to dsmDocuments dependency
    }
  };

  const handleCloseDialog = () => {
    setAddDocumentDialogOpen(false);
    setSelectedParticipant(null);
  };

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadClose = () => {
    setUploadDialogOpen(false);
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("meetingId", meetingId);
        formData.append("documentType", "digital-shareholder-meeting");
        formData.append("title", file.name.replace(/\.[^/.]+$/, "")); // Use original filename as title

        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
        const response = await fetch(
          `${apiBaseUrl}/documents/types/digital-shareholder-meeting/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${await response.text()}`);
        }
      }

      // Refresh documents via DocumentContext
      await refreshDocuments(meetingId);

      setUploadDialogOpen(false);

      // Dispatch event to notify other components (like DocumentsSection)
      window.dispatchEvent(
        new CustomEvent("documentsUploaded", {
          detail: { meetingId },
        })
      );

      // fetchParticipants will automatically run due to dsmDocuments dependency
    } catch (error) {
      console.error("Upload failed:", error);
      alert(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const getAttendanceStatus = (participant: ParticipantWithRole) => {
    const minutesAttended = participant.minutesAttendedMeeting ?? 0;
    if (minutesAttended > 0) {
      return { label: `${minutesAttended} min`, color: "success" as const };
    }
    return { label: "Registered", color: "default" as const };
  };

  const actualAttendees = participants.filter(
    (p) => (p.minutesAttendedMeeting ?? 0) > 0
  ).length;

  if (isLoading) {
    return <SkeletonTable rows={5} columns={5} />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Meeting Participants" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Meeting Participants"
        subheader={`${participants.length} registered • ${actualAttendees} attended`}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<FileUploadOutlined />}
              onClick={handleUploadClick}
            >
              Add Participants
            </Button>
            <ExportButton
              attendees={participants}
              sectionName="DSM Participants"
              disabled={participants.length === 0}
            />
          </Stack>
        }
      />
      <CardContent>
        {/* Participants Table */}
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Attendance</TableCell>
                <TableCell>Document Status</TableCell>
                <TableCell align="right">Document</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((participant, index) => {
                const attendanceStatus = getAttendanceStatus(participant);

                return (
                  <TableRow
                    key={
                      participant.id ||
                      `participant-${participant.emailAddress}-${index}`
                    }
                    hover
                  >
                    <TableCell>
                      <Typography variant="body3" fontWeight="medium">
                        {participant.firstName} {participant.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Link href={`mailto:${participant.emailAddress}`}>
                        {participant.emailAddress}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={attendanceStatus.label}
                        color={attendanceStatus.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={participant.documentStatus || null}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {participant.documentName ? (
                        <Typography variant="dataCell">
                          {participant.documentName}
                        </Typography>
                      ) : (
                        <Button
                          variant="text"
                          onClick={() => handleAddDocument(participant)}
                          sx={{
                            textTransform: "none",
                            minWidth: "auto",
                            px: 1,
                          }}
                        >
                          Add Document
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {participants.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">
              No participants registered yet
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Add Document Dialog */}
      <AddDocumentDialog
        open={addDocumentDialogOpen}
        onClose={handleCloseDialog}
        participantName={
          selectedParticipant
            ? `${selectedParticipant.firstName} ${selectedParticipant.lastName}`
            : ""
        }
        meetingId={meetingId}
        participantId={selectedParticipant?.id ?? ""}
        onDocumentAdded={handleDocumentAdded}
      />

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleUploadClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Participant Documents</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <BNFileUpload
              maxFiles={10}
              acceptedFileTypes={[
                ".pdf",
                ".doc",
                ".docx",
                ".xls",
                ".xlsx",
                ".csv",
              ]}
              onUpload={handleFileUpload}
              multiple={true}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
