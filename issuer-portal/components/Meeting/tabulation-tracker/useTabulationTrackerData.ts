"use client";

import { useEffect, useMemo, useState } from "react";

import type { components } from "@/domain-models/generated-schema";
import { useMeeting } from "@/contexts/MeetingContext";
import buildApiClient from "@/domain-models/apiClient";
import { asArray, asRecord } from "@/utils/typeUtils";

type ApiClient = Awaited<ReturnType<typeof buildApiClient>>;
type Meeting = components["schemas"]["Meeting"];
type Position = components["schemas"]["Position"];
type TabulationReport = components["schemas"]["TabulationReport"];

interface TabulationData {
  meeting_id: string;
  meeting_title: string;
  meeting_date: string;
  total_positions: number;
  positions_voted: number;
  total_shares: string;
  shares_voted: string;
  shares_unvoted: string;
  vote_percentage: string;
  web_votes: number;
  paper_votes: number;
  phone_votes: number;
  status: string;
}

interface HistoricalTabulationPoint {
  meetingId: string;
  yearLabel: string;
  votedShares: number;
  unvotedShares: number;
  isCurrentMeeting: boolean;
}

export interface TabulationTrackerProperties {
  readonly meetingId?: string;
  readonly phase?: string;
}

interface MeetingSummarySource {
  id?: string | null;
  title?: string | null;
  meetingDate?: string | null;
  status?: string | null;
}

const hasText = (value?: string | null): value is string =>
  typeof value === "string" && value.length > 0;

export const isSpecialMeeting = (meetingType?: string | null): boolean => {
  if (!hasText(meetingType)) {
    return false;
  }
  return meetingType.toLowerCase().includes("special");
};

const createEmptySummary = (meeting: MeetingSummarySource): TabulationData => ({
  meeting_id: meeting.id ?? "",
  meeting_title: meeting.title ?? "",
  meeting_date: meeting.meetingDate ?? "",
  total_positions: 0,
  positions_voted: 0,
  total_shares: "0",
  shares_voted: "0",
  shares_unvoted: "0",
  vote_percentage: "0.00",
  web_votes: 0,
  paper_votes: 0,
  phone_votes: 0,
  status: meeting.status ?? "",
});

interface VoteCounts {
  totalPositions: number;
  votedPositions: number;
  totalShares: number;
  votedShares: number;
  webVotes: number;
  paperVotes: number;
  phoneVotes: number;
}

const buildTabulationData = (
  meeting: MeetingSummarySource,
  counts: VoteCounts
): TabulationData => {
  const { totalShares, votedShares } = counts;
  const votePercentage =
    totalShares > 0 ? (votedShares / totalShares) * 100 : 0;

  return {
    meeting_id: meeting.id ?? "",
    meeting_title: meeting.title ?? "",
    meeting_date: meeting.meetingDate ?? "",
    total_positions: counts.totalPositions,
    positions_voted: counts.votedPositions,
    total_shares: totalShares.toString(),
    shares_voted: votedShares.toString(),
    shares_unvoted: Math.max(totalShares - votedShares, 0).toString(),
    vote_percentage: votePercentage.toFixed(2),
    web_votes: counts.webVotes,
    paper_votes: counts.paperVotes,
    phone_votes: counts.phoneVotes,
    status: meeting.status ?? "",
  };
};

const buildSummaryFromReport = (
  meeting: MeetingSummarySource,
  report: TabulationReport
): TabulationData => {
  const { positionsVoted, nonDtcVoteStatus } = report;

  return buildTabulationData(meeting, {
    totalPositions:
      (positionsVoted?.voted ?? 0) + (positionsVoted?.unvoted ?? 0),
    votedPositions: positionsVoted?.voted ?? 0,
    totalShares: positionsVoted?.totalShares ?? 0,
    votedShares: positionsVoted?.votedShares ?? 0,
    webVotes: nonDtcVoteStatus?.webShareholders ?? 0,
    paperVotes: nonDtcVoteStatus?.printShareholders ?? 0,
    phoneVotes: nonDtcVoteStatus?.ivrShareholders ?? 0,
  });
};

const buildSummaryFromPositions = (
  meeting: MeetingSummarySource,
  positions: Position[]
): TabulationData => {
  const votedPositionList = positions.filter(
    (position) => position.voteStatus === "Voted"
  );
  const votedShares = votedPositionList.reduce(
    (sum, position) => sum + (position.sharesVoted ?? position.shares ?? 0),
    0
  );

  return buildTabulationData(meeting, {
    totalPositions: positions.length,
    votedPositions: votedPositionList.length,
    totalShares: positions.reduce(
      (sum, position) => sum + (position.shares ?? 0),
      0
    ),
    votedShares,
    webVotes: positions.filter((position) => position.source === "WEB").length,
    paperVotes: positions.filter((position) => position.source === "PRINT")
      .length,
    phoneVotes: positions.filter((position) => position.source === "IVR")
      .length,
  });
};

const fetchMeetingSummary = async (
  apiClient: ApiClient,
  meeting: MeetingSummarySource
): Promise<TabulationData> => {
  if (!hasText(meeting.id)) {
    return createEmptySummary(meeting);
  }

  const tabulationResult = asRecord(
    await apiClient.GET("/meetings/{meetingId}/tabulation-report", {
      params: {
        path: { meetingId: meeting.id },
      },
    })
  );
  const tabulationReport = asRecord(tabulationResult?.data);

  if (tabulationResult?.error === undefined && tabulationReport !== null) {
    return buildSummaryFromReport(
      meeting,
      tabulationReport as TabulationReport
    );
  }

  // listPositions wraps its array as `{ positions: [...] }` at runtime, even
  // though the OpenAPI spec for this endpoint (incorrectly) documents a bare
  // array — see mock-api-server/domain-models/api/positions.ts.
  const positionsResult = await apiClient.GET("/positions", {
    params: { query: { meetingId: meeting.id } },
  });
  const positions = asArray<Position>(
    asRecord(positionsResult.data)?.positions
  );

  if (positionsResult.error === undefined && positions.length > 0) {
    return buildSummaryFromPositions(meeting, positions);
  }

  return createEmptySummary(meeting);
};

const parseMeetingYearInfo = (
  meetingId: string
): { baseId: string; currentYear: number } | null => {
  const idParts = meetingId.split("-");

  if (idParts.length < 4) {
    return null;
  }

  const finalIdPart = idParts.at(-1) ?? "";
  if (finalIdPart.length === 0) {
    return null;
  }
  const currentYear = Number(finalIdPart);

  if (Number.isNaN(currentYear)) {
    return null;
  }

  return {
    baseId: idParts.slice(0, -1).join("-"),
    currentYear,
  };
};

const sortMeetingsBySeriesOrder = (
  firstMeeting: Meeting,
  secondMeeting: Meeting
): number => {
  const firstYear = firstMeeting.meetingYear ?? 0;
  const secondYear = secondMeeting.meetingYear ?? 0;

  if (firstYear !== secondYear) {
    return firstYear - secondYear;
  }

  const firstDate = hasText(firstMeeting.meetingDate)
    ? new Date(firstMeeting.meetingDate)
    : null;
  const secondDate = hasText(secondMeeting.meetingDate)
    ? new Date(secondMeeting.meetingDate)
    : null;

  return (firstDate?.getTime() ?? 0) - (secondDate?.getTime() ?? 0);
};

const toLocalMidnight = (dateString: string): Date | null => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

interface ComparableMeetingContext {
  meetingType: string;
  cusip?: string | null;
}

const isComparableMeeting = (
  meeting: Meeting,
  context: ComparableMeetingContext,
  currentMeetingId?: string
): boolean => {
  if (!hasText(meeting.id) || meeting.meetingType !== context.meetingType) {
    return false;
  }

  const isCusipMatches =
    !hasText(context.cusip) || meeting.cusip === context.cusip;
  const isIncluded =
    meeting.id === currentMeetingId || meeting.status === "COMPLETE";

  return isCusipMatches && isIncluded;
};

interface HistoricalMeetingSource {
  ticker: string;
  meetingType: string;
  cusip?: string | null;
}

// No try/catch here on purpose: the caller's try/catch handles failures, and
// keeping this function throw-free-of-its-own-try keeps unicorn/try-complexity
// happy without hiding the branching logic behind a disable comment.
const fetchComparableMeetings = async (
  apiClient: ApiClient,
  currentMeeting: HistoricalMeetingSource,
  currentMeetingId?: string
): Promise<HistoricalTabulationPoint[]> => {
  const { data, error } = await apiClient.GET("/meetings", {
    params: {
      query: {
        ticker: currentMeeting.ticker,
        limit: 200,
      },
    },
  });

  if (error !== undefined) {
    throw new Error("Failed to fetch comparable meetings");
  }

  // The route returns `{ meetings: [...] }`, not a bare array.
  const rawMeetings = asArray<Meeting>(asRecord(data)?.meetings);
  const comparableMeetings = rawMeetings
    .filter((meeting) =>
      isComparableMeeting(meeting, currentMeeting, currentMeetingId)
    )
    .toSorted(sortMeetingsBySeriesOrder);

  // Promise.all's op_mini gap is not a real concern for this app; there is no op_mini target in this project's browserslist.
  // eslint-disable-next-line compat/compat
  const settledHistoricalData = await Promise.all(
    comparableMeetings.map(
      async (comparableMeeting): Promise<HistoricalTabulationPoint | null> => {
        if (!hasText(comparableMeeting.id)) {
          return null;
        }

        const summary = await fetchMeetingSummary(apiClient, comparableMeeting);

        return {
          meetingId: summary.meeting_id,
          yearLabel:
            comparableMeeting.meetingYear?.toString() ??
            parseMeetingYearInfo(summary.meeting_id)?.currentYear.toString() ??
            "Unknown",
          votedShares: Number(summary.shares_voted),
          unvotedShares: Number(summary.shares_unvoted),
          isCurrentMeeting: comparableMeeting.id === currentMeetingId,
        };
      }
    )
  );

  return settledHistoricalData.filter(
    (point): point is HistoricalTabulationPoint => point !== null
  );
};

export const useTabulationTrackerData = ({
  meetingId,
}: TabulationTrackerProperties) => {
  const { currentMeeting } = useMeeting();
  const [data, setData] = useState<TabulationData | null>(null);
  const [historicalData, setHistoricalData] = useState<
    HistoricalTabulationPoint[]
  >([]);
  const currentMeetingId = meetingId ?? currentMeeting?.id;
  const voteCutoffDate = useMemo(() => {
    const explicitCutoff = currentMeeting?.cutoffDate;
    if (
      explicitCutoff !== undefined &&
      explicitCutoff !== null &&
      explicitCutoff.length > 0
    ) {
      return toLocalMidnight(explicitCutoff);
    }

    const meetingDate = currentMeeting?.meetingDate;
    if (meetingDate === undefined || meetingDate.length === 0) {
      return null;
    }

    const localMeetingDate = toLocalMidnight(meetingDate);
    if (localMeetingDate === null) {
      return null;
    }
    const calculatedCutoff = new Date(localMeetingDate);
    calculatedCutoff.setDate(calculatedCutoff.getDate() - 2);
    return calculatedCutoff;
  }, [currentMeeting?.cutoffDate, currentMeeting?.meetingDate]);

  useEffect(() => {
    let isIgnore = false;
    const fetchCurrentTabulation = async () => {
      if (!hasText(currentMeetingId)) {
        setData(null);
        return;
      }

      const summarySource: MeetingSummarySource = {
        id: currentMeetingId,
        title: currentMeeting?.title,
        meetingDate: currentMeeting?.meetingDate,
        status: currentMeeting?.status,
      };

      let summary: TabulationData;
      try {
        const apiClient = await buildApiClient();
        summary = await fetchMeetingSummary(apiClient, summarySource);
      } catch (error) {
        console.error("Error fetching tabulation data:", error);
        summary = createEmptySummary(summarySource);
      }

      if (!isIgnore) {
        setData(summary);
      }
    };

    void fetchCurrentTabulation();
    return () => {
      isIgnore = true;
    };
  }, [
    currentMeeting?.meetingDate,
    currentMeeting?.status,
    currentMeeting?.title,
    currentMeeting?.totalSharesOutstanding,
    currentMeetingId,
  ]);

  useEffect(() => {
    let isIgnore = false;
    const fetchHistoricalTabulation = async () => {
      if (!hasText(currentMeetingId)) {
        setHistoricalData([]);
        return;
      }

      if (
        !hasText(currentMeeting?.ticker) ||
        !hasText(currentMeeting.meetingType)
      ) {
        setHistoricalData([]);
        return;
      }

      const { ticker, meetingType, cusip } = currentMeeting;

      if (isSpecialMeeting(meetingType)) {
        setHistoricalData([]);
        return;
      }

      let nextHistoricalData: HistoricalTabulationPoint[];
      try {
        const apiClient = await buildApiClient();
        nextHistoricalData = await fetchComparableMeetings(
          apiClient,
          { ticker, meetingType, cusip },
          currentMeetingId
        );
      } catch (error) {
        console.error("Error fetching previous year data:", error);
        nextHistoricalData = [];
      }

      if (!isIgnore) {
        setHistoricalData(nextHistoricalData);
      }
    };

    void fetchHistoricalTabulation();
    return () => {
      isIgnore = true;
    };
  }, [
    currentMeeting?.cusip,
    currentMeeting?.meetingType,
    currentMeeting?.ticker,
    currentMeetingId,
  ]);

  return {
    currentMeeting,
    currentMeetingId,
    data,
    historicalData,
    voteCutoffDate,
  };
};
