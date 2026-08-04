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
import { asRecord } from "@/utils/typeUtils";
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
  readonly className?: string;
  readonly meetingId?: string;
}

interface DsmConfigFlags {
  readonly dsmEnabled: boolean;
  readonly ioeEnabled: boolean;
  readonly isConfirmed: boolean;
}

/**
 * Reads the boolean flags off a dsm-config response.
 *
 * The generated client types this payload loosely, so validate it once here
 * rather than asserting a shape at each read site.
 */
const readDsmConfigFlags = (payload: unknown): DsmConfigFlags => {
  const record = asRecord(payload);
  const asBoolean = (value: unknown, fallback: boolean): boolean =>
    typeof value === "boolean" ? value : fallback;

  return {
    dsmEnabled: asBoolean(record?.dsmEnabled, true),
    ioeEnabled: asBoolean(record?.ioeEnabled, true),
    isConfirmed: asBoolean(record?.isConfirmed, false),
  };
};

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
  const [isConfirmed, setIsConfirmed] = useState(false);
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

  /**
   * The meeting this card is operating on: the explicit prop when present,
   * otherwise whatever meeting the context is pointing at. An empty prop falls
   * through to the context, matching the original `||` behaviour. Derived
   * during render so the effect below can depend on the resolved id directly.
   */
  const activeMeetingId =
    meetingId !== undefined && meetingId.length > 0
      ? meetingId
      : currentMeeting?.id;

  // Load DSM config and existing uploaded documents on mount
  useEffect(() => {
    // Guard against stale writes when the effect re-runs before completion
    let ignore = false;

    const loadData = async () => {
      if (activeMeetingId === undefined || activeMeetingId.length === 0) {
        return;
      }

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

        if (ignore) {
          return;
        }

        if (!dsmError && dsmData) {
          const flags = readDsmConfigFlags(dsmData);

          setDsm(flags.dsmEnabled);
          setIoe(flags.ioeEnabled);
          setIsConfirmed(flags.isConfirmed);
          // An unconfirmed config opens straight into edit mode.
          setIsEditMode(!flags.isConfirmed);
        }

        // Load uploaded documents
        const docs = await getDocumentsByMeeting(activeMeetingId);

        if (!ignore) {
          const uploaded: Record<string, string> = {};

          docs.forEach((doc) => {
            if (doc.title === "Speaker List") {
              uploaded["Speaker List"] = doc.id ?? "";
            } else if (doc.title === "Guest Link Registration") {
              uploaded["Guest Link Registration"] = doc.id ?? "";
            }
          });

          setUploadedDocs(uploaded);
          setIsLoading(false);
        }
      } catch (error) {
        if (ignore) {
          return;
        }
        console.error("Error loading data:", error);
        setIsEditMode(true);
        setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      ignore = true;
    };
  }, [activeMeetingId, getDocumentsByMeeting]);

  const handleUploadComplete = async (files: File[]) => {
    if (
      activeMeetingId === undefined ||
      activeMeetingId.length === 0 ||
      files.length === 0
    ) {
      return;
    }

    try {
      const [file] = files;
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
      // Rebuild without the key rather than `delete` on a computed property.
      return Object.fromEntries(
        Object.entries(prev).filter(([key]) => key !== label)
      );
    });
  };

  const handleConfirm = async () => {
    if (activeMeetingId === undefined || activeMeetingId.length === 0) {
      return;
    }

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
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving config:", error);
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = async () => {
    if (activeMeetingId === undefined || activeMeetingId.length === 0) {
      return;
    }

    try {
      const apiClient = await buildApiClient();
      const { data } = await apiClient.GET("/meetings/{meetingId}/dsm-config", {
        params: { path: { meetingId: activeMeetingId } },
      });

      if (data) {
        const flags = readDsmConfigFlags(data);

        setDsm(flags.dsmEnabled);
        setIoe(flags.ioeEnabled);
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
        <MeetingRolesTable
          items={accessItems}
          isEditMode={isEditMode}
          uploadedDocs={uploadedDocs}
          onToggle={handleToggle}
          onUpload={handleUpload}
          onDelete={handleDelete}
        />
      </CardContent>

      <MeetingRolesFooter
        isEditMode={isEditMode}
        isConfirmed={isConfirmed}
        isLoading={isLoading}
        onCancel={() => {
          void handleCancel();
        }}
        onConfirm={() => {
          void handleConfirm();
        }}
        onEdit={handleEdit}
      />

      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
        }}
        onUpload={handleUploadComplete}
        meetingId={meetingId}
        documentType={uploadType}
      />
    </Card>
  );
};

interface MeetingRolesTableProps {
  readonly items: MeetingAccessItem[];
  readonly isEditMode: boolean;
  readonly uploadedDocs: Record<string, string>;
  readonly onToggle: (label: string, newValue: boolean) => void;
  readonly onUpload: (label: string) => void;
  readonly onDelete: (label: string) => void;
}

const MeetingRolesTable: React.FC<MeetingRolesTableProps> = ({
  items,
  isEditMode,
  uploadedDocs,
  onToggle,
  onUpload,
  onDelete,
}) => (
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
      {items.map((item) => (
        <TableRow
          key={item.label}
          sx={{
            "&:not(:last-child)": {
              borderBottom: "1px solid rgba(31,30,28,0.12)",
            },
          }}
        >
          <TableCell>
            <Box>
              <Typography variant="body3">{item.label}</Typography>
              {item.fileDescription ? (
                <Typography variant="caption" color="text.secondary">
                  {item.fileFormat} {item.fileDescription}
                </Typography>
              ) : null}
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
                      checked={item.value ?? false}
                      onChange={(event) => {
                        onToggle(item.label, event.target.checked);
                      }}
                      size="small"
                      slotProps={{ input: { "aria-label": item.label } }}
                    />
                    {/* Track the switch rather than hardcoding "Yes", which
                        previously kept reading Yes after toggling off. */}
                    <Typography variant="body3">
                      {item.value === true ? "Yes" : "No"}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body3">
                    {item.value === true ? "Yes" : "No"}
                  </Typography>
                )}
              </Box>
            )}

            {item.type === "contact" && item.contact ? (
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
            ) : null}

            {item.type === "upload" && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {uploadedDocs[item.label] ? (
                  <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                ) : null}
                <Button
                  variant="text"
                  onClick={() => {
                    if (uploadedDocs[item.label]) {
                      onDelete(item.label);
                    } else {
                      onUpload(item.label);
                    }
                  }}
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
);

interface MeetingRolesFooterProps {
  readonly isEditMode: boolean;
  readonly isConfirmed: boolean;
  readonly isLoading: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly onEdit: () => void;
}

const MeetingRolesFooter: React.FC<MeetingRolesFooterProps> = ({
  isEditMode,
  isConfirmed,
  isLoading,
  onCancel,
  onConfirm,
  onEdit,
}) => (
  <CardActions sx={{ justifyContent: "flex-end", gap: 1 }}>
    {isEditMode ? (
      <>
        {isConfirmed ? (
          <Button
            variant="text"
            sx={{ textTransform: "none" }}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          variant="outlined"
          sx={{ textTransform: "none" }}
          onClick={onConfirm}
          disabled={isLoading}
        >
          Confirm
        </Button>
      </>
    ) : (
      <Button
        variant="outlined"
        sx={{ textTransform: "none" }}
        onClick={onEdit}
      >
        Edit
      </Button>
    )}
  </CardActions>
);

export default MeetingRolesCard;
