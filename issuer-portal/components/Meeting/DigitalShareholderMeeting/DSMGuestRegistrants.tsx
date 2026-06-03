"use client";

import { Email, Search, Upload } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";

import type { components } from "@/domain-models/generated-schema";

import FileUploadDialog from "@/components/FileUpload/FileUploadDialog";
import PreviewDialog, { createTextRenderer } from "@/components/FileUpload/PreviewDialog";

import { ExportButton } from "./ExportButton";

type DigitalShareholderMeeting = components["schemas"]["DigitalShareholderMeeting"];
type ExcelRow = Record<string, string | number | boolean | Date | undefined>;

interface ParsedGuest {
  firstName: string;
  lastName: string;
  emailAddress: string;
  title?: string;
  department?: string;
}

interface DSMGuestRegistrantsProps {
  meetingId: string;
}

export function DSMGuestRegistrants({ meetingId }: DSMGuestRegistrantsProps) {
  const [guests, setGuests] = useState<DigitalShareholderMeeting[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<DigitalShareholderMeeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedGuest[] | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    try {
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
      const response = await fetch(`${API_URL}/meetings/${meetingId}/digital-shareholder-meeting`);
      if (!response.ok) {
        throw new Error("Failed to fetch guest registrants");
      }

      const data = (await response.json()) as DigitalShareholderMeeting[];

      // Filter for guests only
      const guestRegistrants = data.filter((participant) => participant.registrantType === "Guest");

      setGuests(guestRegistrants);
      setFilteredGuests(guestRegistrants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load guest registrants");
    }
  }, [meetingId]);

  useEffect(() => {
    void fetchGuests();
  }, [fetchGuests]);

  // Filter guests based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGuests(guests);
      return;
    }

    const filtered = guests.filter((guest) => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.toLowerCase();
      const email = (guest.emailAddress ?? "").toLowerCase();

      return fullName.includes(searchLower) || email.includes(searchLower);
    });

    setFilteredGuests(filtered);
  }, [guests, searchTerm]);

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const parseFile = async (file: File): Promise<ParsedGuest[]> => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Failed to read file data"));
            return;
          }

          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(firstSheet);

          const mappedData = jsonData
            .map((row: ExcelRow) => {
              const firstName = row["First Name"] ?? "";
              const lastName = row["Last Name"] ?? "";
              const emailAddress = row["Email Address"] ?? "";
              const title = row.Title ?? "";
              const department = row.Department ?? "";

              if (!firstName || !lastName || !emailAddress) {
                return null;
              }

              const parsedGuest: ParsedGuest = {
                firstName: String(firstName),
                lastName: String(lastName),
                emailAddress: String(emailAddress),
              };

              if (title) parsedGuest.title = String(title);
              if (department) parsedGuest.department = String(department);

              return parsedGuest;
            })
            .filter((item): item is ParsedGuest => item !== null);

          resolve(mappedData);
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (!meetingId || files.length === 0) return;

      setUploadError(null);

      try {
        const file = files[0];
        const parsedData = await parseFile(file);

        if (parsedData.length === 0) {
          throw new Error("No valid data found in file");
        }

        // Show preview dialog
        setPreviewData(parsedData);
        setPreviewDialogOpen(true);
        setUploadDialogOpen(false);
      } catch (error) {
        console.error("Upload error:", error);
        setUploadError(error instanceof Error ? error.message : "Failed to upload file");
      }
    },
    [meetingId],
  );

  const handleConfirmUpload = useCallback(async () => {
    if (!previewData) return;

    try {
      // Map guest data to expected format
      const mappedData = previewData.map((guest) => ({
        registrantType: "Guest",
        firstName: guest.firstName,
        lastName: guest.lastName,
        emailAddress: guest.emailAddress,
        registrationQuestions: `${guest.title ?? ""} - ${guest.department ?? ""}`.trim(),
        minutesAttendedMeeting: 0,
      }));

      // Add guests via API (assuming same endpoint as main page)
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
      const response = await fetch(`${API_URL}/meetings/${meetingId}/digital-shareholder-meeting`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mappedData),
      });

      if (!response.ok) {
        throw new Error("Failed to add guests");
      }

      setPreviewDialogOpen(false);
      setPreviewData(null);

      // Refresh the guests list
      void fetchGuests();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to upload guests");
    }
  }, [previewData, meetingId, fetchGuests]);

  const handleCancelPreview = useCallback(() => {
    setPreviewDialogOpen(false);
    setPreviewData(null);
    setUploadDialogOpen(true);
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader title="Guest Registrants" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Guest Registrants"
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Upload />} onClick={handleUploadClick}>
              Add Guests
            </Button>
            <ExportButton
              attendees={guests}
              sectionName="Guest Registrants"
              disabled={guests.length === 0}
            />
          </Stack>
        }
      />
      <CardContent>
        {/* Search */}
        {guests.length > 0 && (
          <Box sx={{ p: 2 }}>
            <TextField
              size="small"
              placeholder="Search guests"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        )}

        {/* Upload Error */}
        {uploadError && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert severity="error" onClose={() => setUploadError(null)}>
              {uploadError}
            </Alert>
          </Box>
        )}

        {/* Guests Table */}
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            {guests.length > 0 && (
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Registered</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {filteredGuests.map((guest) => {
                return (
                  <TableRow key={guest.id} hover>
                    <TableCell>
                      {guest.firstName} {guest.lastName}
                    </TableCell>
                    <TableCell>{guest.emailAddress}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {guest.createdAt
                          ? new Date(guest.createdAt).toLocaleDateString()
                          : "Unknown"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {guest.emailAddress && (
                        <Tooltip title="Send Email">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const subject = encodeURIComponent(
                                "Regarding Your Meeting Registration",
                              );
                              const body = encodeURIComponent(
                                `Dear ${guest.firstName} ${guest.lastName},\n\nThank you for registering for our shareholder meeting.\n\nBest regards`,
                              );
                              window.open(
                                `mailto:${guest.emailAddress}?subject=${subject}&body=${body}`,
                                "_blank",
                              );
                            }}
                          >
                            <Email fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Show empty row when no guests at all */}
              {guests.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    sx={{ textAlign: "center", py: 4, color: "text.disabled" }}
                  >
                    No guests have been added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredGuests.length === 0 && guests.length > 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">No guests match your search criteria</Typography>
          </Box>
        )}
      </CardContent>

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
          setUploadError(null);
        }}
        onUpload={handleFileUpload}
        meetingId={meetingId}
        documentType="digital-shareholder-meeting"
      />

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewDialogOpen}
        onClose={handleCancelPreview}
        onConfirm={handleConfirmUpload}
        data={previewData}
        title="Confirm Guest Upload"
        columns={[
          {
            key: "firstName",
            label: "Name",
            render: (_, row) => createTextRenderer()(`${row.firstName} ${row.lastName}`),
          },
          {
            key: "emailAddress",
            label: "Email",
            render: createTextRenderer(),
          },
          {
            key: "title",
            label: "Title",
            render: createTextRenderer(),
          },
          {
            key: "department",
            label: "Department",
            render: createTextRenderer(),
          },
        ]}
      />
    </Card>
  );
}
