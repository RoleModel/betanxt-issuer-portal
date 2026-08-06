"use client";

import { Box, Container, LinearProgress } from "@mui/material";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import PastMeetingsTable, {
  type Order,
  type PastMeetingData,
} from "@/components/Meeting/PastMeetingsTable";
import buildApiClient, {
  type ApiClientReturnType,
} from "@/domain-models/apiClient";
import { generateSeededEventParticipationPercent } from "@/utils/eventParticipation";
import { asRecord, asString } from "@/utils/typeUtils";

type Meeting = components["schemas"]["Meeting"];
type OrderBy = keyof PastMeetingData;

type ParticipationMetrics = Pick<
  PastMeetingData,
  "participationPercent" | "totalVotes" | "votingShares"
>;

const getDefaultMetrics = (meetingId: string): ParticipationMetrics => ({
  participationPercent: generateSeededEventParticipationPercent(meetingId),
  totalVotes: 0,
  votingShares: 0,
});

const parseNumericValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const getMeetingId = (meeting: Meeting): string => {
  if (typeof meeting.id === "string" && meeting.id.length > 0) {
    return meeting.id;
  }

  const meetingRecord = asRecord(meeting);
  if (meetingRecord === null) return "";

  return (
    asString(meetingRecord.meetingId) ??
    asString(meetingRecord.meeting_id) ??
    asString(meetingRecord.id) ??
    ""
  );
};

const getTotalSharesOutstanding = (meeting: Meeting): number => {
  const directValue = parseNumericValue(meeting.totalSharesOutstanding);
  if (directValue > 0) return directValue;

  const meetingRecord = asRecord(meeting);
  if (meetingRecord === null) return 0;

  const camelCaseValue = parseNumericValue(
    meetingRecord.totalSharesOutstanding
  );
  if (camelCaseValue > 0) return camelCaseValue;

  return parseNumericValue(meetingRecord.total_shares_outstanding);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    // Parse as local date to avoid timezone issues
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

interface MeetingsApiResponse {
  meetings?: Meeting[];
  pagination?: components["schemas"]["Pagination"];
}

const PastMeetingsPage = () => {
  const pathname = usePathname();
  const [, clientTicker] = pathname.split("/");
  const [meetings, setMeetings] = useState<PastMeetingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("meetingDate");

  useEffect(() => {
    let cancelled = false;

    const loadPastMeetings = async (): Promise<void> => {
      if (!clientTicker) {
        setMeetings([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Use openapi-fetch to fetch meetings
      const apiClient = await buildApiClient();
      const meetingsResponse = (await apiClient.GET("/meetings", {
        params: {
          query: {
            ticker: clientTicker.toUpperCase(),
            status: "COMPLETE",
          },
        },
      })) as ApiClientReturnType<MeetingsApiResponse>;

      if (cancelled) return;

      if (meetingsResponse.error !== undefined) {
        console.error("Error fetching past meetings:", meetingsResponse.error);
        setMeetings([]);
        setLoading(false);
        return;
      }

      // Meetings array from the paginated response — already filtered by API.
      const typedData = meetingsResponse.data;
      const completedMeetings: Meeting[] = Array.isArray(typedData.meetings)
        ? typedData.meetings
        : [];

      const meetingsWithParticipation: PastMeetingData[] =
        completedMeetings.map((meeting: Meeting): PastMeetingData => {
          const meetingId = getMeetingId(meeting);
          const metrics = getDefaultMetrics(meetingId);
          const totalSharesOutstanding = getTotalSharesOutstanding(meeting);

          return {
            ...meeting,
            ...metrics,
            votingShares:
              totalSharesOutstanding > 0
                ? Math.round(
                    (totalSharesOutstanding * metrics.participationPercent) /
                      100
                  )
                : metrics.votingShares,
          };
        });

      setMeetings(meetingsWithParticipation);
      setLoading(false);
    };

    void loadPastMeetings().catch((error: unknown) => {
      if (cancelled) return;
      console.error("Error fetching past meetings:", error);
      setMeetings([]);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [clientTicker]);

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedMeetings = meetings.toSorted((a, b) => {
    const rawA = a[orderBy];
    const rawB = b[orderBy];

    // Date sorting
    if (orderBy === "meetingDate") {
      const timeA = new Date(String(rawA)).getTime();
      const timeB = new Date(String(rawB)).getTime();
      return order === "asc" ? timeA - timeB : timeB - timeA;
    }

    // Numeric sorting
    if (typeof rawA === "number" && typeof rawB === "number") {
      return order === "asc" ? rawA - rawB : rawB - rawA;
    }

    // String sorting
    if (typeof rawA === "string" && typeof rawB === "string") {
      return order === "asc"
        ? rawA.localeCompare(rawB)
        : rawB.localeCompare(rawA);
    }

    return 0;
  });

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, flexGrow: 1, flex: 1 }}>
      <Container maxWidth="xl">
        <PastMeetingsTable
          clientTicker={clientTicker}
          order={order}
          orderBy={orderBy}
          onRequestSort={handleRequestSort}
          meetings={sortedMeetings}
          loading={loading}
          formatDate={formatDate}
        />
      </Container>
    </Box>
  );
};

export default PastMeetingsPage;
