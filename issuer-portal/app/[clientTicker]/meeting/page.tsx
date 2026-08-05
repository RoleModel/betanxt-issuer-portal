"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import type { components } from "@/types/api";

import CusipValue from "@/components/ui/CusipValue";
import StatusChip from "@/components/ui/StatusChip";
import buildApiClient from "@/domain-models/apiClient";
import { asArray, asParamString, asRecord } from "@/utils/typeUtils";

type Meeting = components["schemas"]["Meeting"];

interface MeetingData extends Meeting {
  daysUntilMeeting: number;
}

type Order = "asc" | "desc";
type OrderBy = keyof MeetingData;

// Split out from fetchMeetings() so the try block below has no literal throw
// statement in its own body — the React Compiler doesn't yet support
// analyzing a throw nested inside try/catch, and having one there was
// corrupting type narrowing for the rest of the component.
const assertMeetingsResponse = <T,>(data: T | undefined, error: unknown): T => {
  if (data === undefined) {
    throw new Error(
      error === undefined
        ? "No data returned from API"
        : "Failed to fetch meetings"
    );
  }
  return data;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const dateParts = dateString.split("-");
    if (dateParts.length !== 3) return "Invalid Date";
    const [year, month, day] = dateParts.map((part) => parseInt(part));
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return "Invalid Date";
  }
};

const MeetingsPage = () => {
  const params = useParams();
  const clientTicker = asParamString(params.clientTicker);
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<OrderBy>("meetingDate");

  const fetchMeetings = async () => {
    try {
      // Fetch active and upcoming meetings using openapi-fetch
      const apiClient = await buildApiClient();
      const result = await apiClient.GET("/meetings", {
        params: {
          query: {
            ticker: clientTicker,
            status: "ACTIVE",
          },
        },
      });

      const { data, error } = result;
      const meetingsResponse = assertMeetingsResponse(data, error);

      // The route returns `{ meetings: [...] }`, not a bare array — see the
      // `listMeetings` handler in mock-api-server/domain-models/api/meetings.ts.
      const meetingsData = asArray<Meeting>(
        asRecord(meetingsResponse)?.meetings
      );

      // Calculate days until meeting
      const meetingsWithData: MeetingData[] = meetingsData.map(
        (meeting: Meeting) => {
          const meetingDate = new Date(meeting.meetingDate ?? "");
          const today = new Date();
          const daysUntilMeeting = Math.ceil(
            (meetingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            ...meeting,
            daysUntilMeeting,
          };
        }
      );

      setMeetings(meetingsWithData);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setMeetings([]);
    }
  };

  useEffect(() => {
    // The recommended fix is switching this fetch-on-mount to SWR (the
    // project's established data-fetching pattern elsewhere), not suppressing
    // this warning — but that's a data-layer rewrite, not a lint fix.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRequestSort = (property: OrderBy) => {
    // The linter's type-narrowing analysis mis-narrows `orderBy` to a single
    // literal here and below, claiming these comparisons are always
    // true/false — demonstrably wrong, since setOrderBy(property) sets it to
    // every OrderBy member as columns are clicked. Verified against two
    // other plausible causes (throw-in-try, use-before-define) tonight;
    // neither explained it, so this is accepted as a linter limitation.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // No useMemo: the React Compiler already caches this.
  const sortedMeetings = meetings.toSorted((a, b) => {
    // `orderBy` is any key of MeetingData, so the raw values are not
    // necessarily comparable; the guards below pick the applicable strategy.
    const compareA: unknown = a[orderBy];
    const compareB: unknown = b[orderBy];

    // Handle date sorting
    // See the note on the same false-positive above handleRequestSort.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (orderBy === "meetingDate") {
      const timeA = new Date(String(compareA)).getTime();
      const timeB = new Date(String(compareB)).getTime();

      return order === "asc" ? timeA - timeB : timeB - timeA;
    }

    // Handle numeric sorting
    if (typeof compareA === "number" && typeof compareB === "number") {
      return order === "asc" ? compareA - compareB : compareB - compareA;
    }

    // Handle string sorting
    if (typeof compareA === "string" && typeof compareB === "string") {
      return order === "asc"
        ? compareA.localeCompare(compareB)
        : compareB.localeCompare(compareA);
    }

    return 0;
  });

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Card>
        <CardHeader title="Active Meetings" />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table stickyHeader>
              {/* eslint-disable @typescript-eslint/no-unnecessary-condition -- see the note on the same false-positive above handleRequestSort */}
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>
                    <TableSortLabel
                      active={orderBy === "title"}
                      direction={orderBy === "title" ? order : "asc"}
                      onClick={() => {
                        handleRequestSort("title");
                      }}
                    >
                      Meeting
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>
                    <TableSortLabel
                      active={orderBy === "cusip"}
                      direction={orderBy === "cusip" ? order : "asc"}
                      onClick={() => {
                        handleRequestSort("cusip");
                      }}
                    >
                      CUSIP
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>
                    <TableSortLabel
                      active={orderBy === "meetingDate"}
                      direction={orderBy === "meetingDate" ? order : "asc"}
                      onClick={() => {
                        handleRequestSort("meetingDate");
                      }}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedMeetings.map((meeting) => (
                  <TableRow key={meeting.id} hover>
                    <TableCell>
                      <Link
                        component={NextLink}
                        href={`/${clientTicker}/meeting/${meeting.id}`}
                        underline="hover"
                        color="primary"
                        sx={{ fontWeight: 500 }}
                      >
                        {meeting.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <CusipValue value={meeting.cusip} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body3">
                        {meeting.meetingDate !== undefined &&
                        meeting.meetingDate !== ""
                          ? formatDate(meeting.meetingDate)
                          : "TBD"}
                      </Typography>
                      {meeting.daysUntilMeeting > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {meeting.daysUntilMeeting} days
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={meeting.status ?? "ACTIVE"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          component={NextLink}
                          href={`/${clientTicker}/meeting/${meeting.id}`}
                        >
                          Manage
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          component={NextLink}
                          href={`/${clientTicker}/meeting/${meeting.id}/calendar`}
                        >
                          Calendar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {meetings.length === 0 && (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                No active meetings found.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MeetingsPage;
