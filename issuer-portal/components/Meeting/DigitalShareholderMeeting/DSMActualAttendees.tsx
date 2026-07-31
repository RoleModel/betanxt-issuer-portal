"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
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

import { ExportButton } from "../ExportButton";

type DigitalShareholderMeeting =
  components["schemas"]["DigitalShareholderMeeting"];

interface DSMActualAttendeesProps {
  readonly meetingId: string;
}

export const DSMActualAttendees = ({ meetingId }: DSMActualAttendeesProps) => {
  const [attendees, setAttendees] = useState<DigitalShareholderMeeting[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchActualAttendees = useCallback(async () => {
    try {
      setError(null);

      const API_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
      const response = await fetch(
        `${API_URL}/meetings/${meetingId}/digital-shareholder-meeting`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch actual attendees");
      }

      const data = (await response.json()) as DigitalShareholderMeeting[];

      // Filter for attendees who actually attended the meeting
      const actualAttendees = data.filter(
        (participant) => (participant.minutesAttendedMeeting ?? 0) > 0
      );

      setAttendees(actualAttendees);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load actual attendees"
      );
    }
  }, [meetingId]);

  useEffect(() => {
    void fetchActualAttendees();
  }, [fetchActualAttendees]);

  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardHeader title="Actual Attendees" />
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (attendees.length === 0) {
    return null; // Don't show the card if no one has attended yet
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardHeader
          title="Actual Attendees"
          subheader={`${attendees.length} attended`}
          action={
            <ExportButton
              attendees={attendees}
              sectionName="Actual Attendees"
              disabled={attendees.length === 0}
            />
          }
        />
        <CardContent>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Time Attended</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendees.map((attendee) => {
                  const minutesAttended = attendee.minutesAttendedMeeting ?? 0;
                  const role = attendee.registrantType ?? "Participant";

                  return (
                    <TableRow key={attendee.id} hover>
                      <TableCell>
                        <Typography variant="body3" fontWeight="medium">
                          {attendee.firstName} {attendee.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body3" color="text.secondary">
                          {attendee.emailAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={role}
                          size="small"
                          color={role === "Guest" ? "default" : "primary"}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${minutesAttended} min`}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
