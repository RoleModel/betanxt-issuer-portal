"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import FileUploadDialog from "@/components/FileUpload/FileUploadDialog";
import SROnlyTableCaption from "@/components/ui/SROnlyTableCaption";
import { useMeeting } from "@/contexts/MeetingContext";
import buildApiClient from "@/domain-models/apiClient";
import { useDocuments } from "@/hooks/useDocuments";

interface MeetingAccessItem {
  label: string;
  type: "toggle" | "contact" | "upload";
  value?: boolean;
  contact?: {
    name: string;
    email: string;
  };
  fileFormat?: string;
  fileDescription?: string;
}

interface MeetingRolesCardProps {
  className?: string;
  meetingId?: string;
}

const MeetingRolesCard: React.FC<MeetingRolesCardProps> = ({
  className,
  meetingId,
}) => {
  const [dsm, setDsm] = useState(true);
  const [ioe, setIoe] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<string>("");
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({}); // label -> documentId
  const [isEditMode, setIsEditMode] = useState(false);
  const [_isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { uploadDSMDocument, getDocumentsByMeeting } = useDocuments();
  const { currentMeeting } = useMeeting();

  // Mock data matching the Figma design
  const accessItems: MeetingAccessItem[] = [
    {
      label: "DSM",
      type: "toggle",
      value: dsm,
    },
    {
      label: "DSM Producer",
      type: "contact",
      contact: {
        name: "Tim Burton",
        email: "tim.burton@betanxt.com",
      },
    },
    {
      label: "IOE",
      type: "toggle",
      value: ioe,
    },
    {
      label: "Inspector",
      type: "contact",
      contact: {
        name: "Marsha Waters",
        email: "marsh.waters@betanxt.com",
      },
    },
    {
      label: "Speaker List",
      type: "upload",
      fileFormat: ".xls",
      fileDescription: "(First name, last name, email)",
    },
    {
      label: "Guest Link Registration",
      type: "upload",
      fileFormat: ".xls",
      fileDescription: "(First name, last name, email)",
    },
  ];

  const handleToggle = (label: string, newValue: boolean) => {
    if (label === "DSM") {
      setDsm(newValue);
    } else if (label === "IOE") {
      setIoe(newValue);
    }
  };

  const handleUpload = (label: string) => {
    setUploadType(label);
    setUploadDialogOpen(true);
  };

  // Load DSM config and existing uploaded documents on mount
  useEffect(() => {
    const loadData = async () => {
      const activeMeetingId = meetingId || currentMeeting?.id;
      if (!activeMeetingId) return;

      try {
        setIsLoading(true);

        // Fetch DSM config
        const apiClient = await buildApiClient();
        const { data: dsmData, error: dsmError } = await apiClient.GET(
          "/meetings/{meetingId}/dsm-config",
          {
            params: { path: { meetingId: activeMeetingId } },
          }
        );

        if (!dsmError && dsmData) {
          setDsm((dsmData as { dsmEnabled?: boolean }).dsmEnabled ?? true);
          setIoe((dsmData as { ioeEnabled?: boolean }).ioeEnabled ?? true);
          setIsConfirmed(
            (dsmData as { isConfirmed?: boolean }).isConfirmed || false
          );

          if ((dsmData as { isConfirmed?: boolean }).isConfirmed) {
            setIsEditMode(false);
          } else {
            setIsEditMode(true);
          }
        }

        // Load uploaded documents
        const docs = await getDocumentsByMeeting(activeMeetingId);
        const uploaded: Record<string, string> = {};

        docs.forEach((doc) => {
          if (doc.title === "Speaker List") {
            uploaded["Speaker List"] = doc.id ?? "";
          } else if (doc.title === "Guest Link Registration") {
            uploaded["Guest Link Registration"] = doc.id ?? "";
          }
        });

        setUploadedDocs(uploaded);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsEditMode(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [meetingId, currentMeeting?.id, getDocumentsByMeeting]);

  const handleUploadComplete = async (files: File[]) => {
    const activeMeetingId = meetingId || currentMeeting?.id;
    if (!activeMeetingId || files.length === 0) return;

    try {
      const file = files[0];
      const result = await uploadDSMDocument(activeMeetingId, uploadType, file);

      if (result?.id) {
        setUploadedDocs((prev) => ({
          ...prev,
          [uploadType]: result.id ?? "",
        }));
      }

      setUploadDialogOpen(false);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleDelete = (label: string) => {
    // TODO: Implement delete functionality when needed
    setUploadedDocs((prev) => {
      const updated = { ...prev };
      delete updated[label];
      return updated;
    });
  };

  const handleConfirm = async () => {
    const activeMeetingId = meetingId || currentMeeting?.id;
    if (!activeMeetingId) return;

    try {
      setIsLoading(true);
      const apiClient = await buildApiClient();

      const config = {
        meetingId: activeMeetingId,
        dsmEnabled: dsm,
        ioeEnabled: ioe,
        dsmProducerName: "Tim Burton",
        dsmProducerEmail: "tim.burton@betanxt.com",
        inspectorName: "Marsha Waters",
        inspectorEmail: "marsh.waters@betanxt.com",
        speakerListDocId: uploadedDocs["Speaker List"] || undefined,
        guestLinkRegistrationDocId:
          uploadedDocs["Guest Link Registration"] || undefined,
        isConfirmed: true,
        liveQa: true,
        audioOnly: false,
        meetingRecording: true,
        logisticsCallScheduled: false,
        dryRunScheduled: false,
      };

      const { data, error } = await apiClient.POST(
        "/meetings/{meetingId}/dsm-config",
        {
          params: { path: { meetingId: activeMeetingId } },
          body: config,
        }
      );

      if (!error && data) {
        setIsConfirmed(true);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = async () => {
    const activeMeetingId = meetingId || currentMeeting?.id;
    if (!activeMeetingId) return;

    try {
      const apiClient = await buildApiClient();
      const { data } = await apiClient.GET("/meetings/{meetingId}/dsm-config", {
        params: { path: { meetingId: activeMeetingId } },
      });

      if (data) {
        setDsm((data as { dsmEnabled?: boolean }).dsmEnabled ?? true);
        setIoe((data as { ioeEnabled?: boolean }).ioeEnabled ?? true);
      }
    } catch (error) {
      console.error("Error reloading config:", error);
    }

    setIsEditMode(false);
  };

  return (
    <Card className={className}>
      <CardHeader title="Meeting Roles, Contacts & Access" />
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Table>
          <SROnlyTableCaption>
            Meeting roles, contacts, and file uploads for access management.
          </SROnlyTableCaption>
          <TableHead
            aria-hidden="false"
            sx={{ visibility: "hidden", display: "none" }}
          >
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Value/Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accessItems.map((item, index) => (
              <TableRow
                key={index}
                sx={{
                  "&:not(:last-child)": {
                    borderBottom: "1px solid rgba(31,30,28,0.12)",
                  },
                }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body3">{item.label}</Typography>
                    {item.fileDescription && (
                      <Typography variant="caption" color="text.secondary">
                        {item.fileFormat} {item.fileDescription}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {item.type === "toggle" && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      {isEditMode ? (
                        <>
                          <Switch
                            checked={item.value || false}
                            onChange={(e) =>
                              handleToggle(item.label, e.target.checked)
                            }
                            size="small"
                          />
                          <Typography variant="body3">Yes</Typography>
                        </>
                      ) : (
                        <Typography variant="body3">
                          {item.value ? "Yes" : "No"}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {item.type === "contact" && item.contact && (
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body3" sx={{ fontWeight: "medium" }}>
                        {item.contact.name}
                      </Typography>
                      <Typography
                        variant="body3"
                        color="primary"
                        sx={{ textDecoration: "underline", cursor: "pointer" }}
                      >
                        {item.contact.email}
                      </Typography>
                    </Box>
                  )}

                  {item.type === "upload" && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      {uploadedDocs[item.label] && (
                        <CheckCircleIcon
                          color="success"
                          sx={{ fontSize: 20 }}
                        />
                      )}
                      <Button
                        variant="text"
                        onClick={() =>
                          uploadedDocs[item.label]
                            ? handleDelete(item.label)
                            : handleUpload(item.label)
                        }
                        disabled={!isEditMode}
                      >
                        {uploadedDocs[item.label] ? "Delete" : "Upload"}
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end", gap: 1 }}>
        {isEditMode ? (
          <>
            {_isConfirmed && (
              <Button
                variant="text"
                sx={{ textTransform: "none" }}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="outlined"
              sx={{ textTransform: "none" }}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              Confirm
            </Button>
          </>
        ) : (
          <Button
            variant="outlined"
            sx={{ textTransform: "none" }}
            onClick={handleEdit}
          >
            Edit
          </Button>
        )}
      </CardActions>

      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUploadComplete}
        meetingId={meetingId}
        documentType={uploadType}
      />
    </Card>
  );
};

export default MeetingRolesCard;
