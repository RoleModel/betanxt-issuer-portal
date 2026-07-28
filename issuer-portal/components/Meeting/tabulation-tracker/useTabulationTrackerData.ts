"use client";

import { useEffect, useMemo, useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import { useMeeting } from "@/contexts/MeetingContext";
import buildApiClient from "@/domain-models/apiClient";

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

export interface TabulationTrackerProps {
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

const buildSummaryFromReport = (
  meeting: MeetingSummarySource,
  report: TabulationReport
): TabulationData => {
  const { positionsVoted } = report;
  const totalPositions =
    (positionsVoted?.voted ?? 0) + (positionsVoted?.unvoted ?? 0);
  const votedPositions = positionsVoted?.voted ?? 0;
  const totalShares = positionsVoted?.totalShares ?? 0;
  const votedShares = positionsVoted?.votedShares ?? 0;
  const votePercentage =
    totalShares > 0 ? (votedShares / totalShares) * 100 : 0;

  const nonDtc = report.nonDtcVoteStatus;

  return {
    meeting_id: meeting.id ?? "",
    meeting_title: meeting.title ?? "",
    meeting_date: meeting.meetingDate ?? "",
    total_positions: totalPositions,
    positions_voted: votedPositions,
    total_shares: totalShares.toString(),
    shares_voted: votedShares.toString(),
    shares_unvoted: Math.max(totalShares - votedShares, 0).toString(),
    vote_percentage: votePercentage.toFixed(2),
    web_votes: nonDtc?.webShareholders ?? 0,
    paper_votes: nonDtc?.printShareholders ?? 0,
    phone_votes: nonDtc?.ivrShareholders ?? 0,
    status: meeting.status ?? "",
  };
};

const buildSummaryFromPositions = (
  meeting: MeetingSummarySource,
  positions: Position[]
): TabulationData => {
  const totalPositions = positions.length;
  const votedPositions = positions.filter(
    (position) => position.voteStatus === "Voted"
  ).length;
  const totalShares = positions.reduce(
    (sum, position) => sum + (position.shares ?? 0),
    0
  );
  const votedShares = positions
    .filter((position) => position.voteStatus === "Voted")
    .reduce(
      (sum, position) => sum + (position.sharesVoted ?? position.shares ?? 0),
      0
    );
  const votePercentage =
    totalShares > 0 ? (votedShares / totalShares) * 100 : 0;

  return {
    meeting_id: meeting.id ?? "",
    meeting_title: meeting.title ?? "",
    meeting_date: meeting.meetingDate ?? "",
    total_positions: totalPositions,
    positions_voted: votedPositions,
    total_shares: totalShares.toString(),
    shares_voted: votedShares.toString(),
    shares_unvoted: Math.max(totalShares - votedShares, 0).toString(),
    vote_percentage: votePercentage.toFixed(2),
    web_votes: positions.filter((position) => position.source === "WEB").length,
    paper_votes: positions.filter((position) => position.source === "PRINT")
      .length,
    phone_votes: positions.filter((position) => position.source === "IVR")
      .length,
    status: meeting.status ?? "",
  };
};

const fetchMeetingSummary = async (
  apiClient: ApiClient,
  meeting: MeetingSummarySource
): Promise<TabulationData> => {
  if (!hasText(meeting.id)) {
    return createEmptySummary(meeting);
  }

  const tabulationResult = (await apiClient.GET(
    "/meetings/{meetingId}/tabulation-report",
    {
      params: {
        path: { meetingId: meeting.id },
      },
    }
  )) as { data?: TabulationReport; error?: unknown };

  if (
    tabulationResult.error === undefined &&
    tabulationResult.data !== undefined
  ) {
    return buildSummaryFromReport(meeting, tabulationResult.data);
  }

  const positionsResult = (await apiClient.GET("/positions", {
    params: { query: { meetingId: meeting.id } },
  })) as { data?: { positions?: Position[] }; error?: unknown };

  const positions = positionsResult.data?.positions;

  if (
    positionsResult.error === undefined &&
    positions !== undefined &&
    Array.isArray(positions)
  ) {
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
    ? new Date(firstMeeting.meetingDate).getTime()
    : 0;
  const secondDate = hasText(secondMeeting.meetingDate)
    ? new Date(secondMeeting.meetingDate).getTime()
    : 0;

  return firstDate - secondDate;
};

const toLocalMidnight = (dateString: string): Date | null => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

export const useTabulationTrackerData = ({
  meetingId,
}: TabulationTrackerProps) => {
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
    const fetchCurrentTabulation = async () => {
      if (!hasText(currentMeetingId)) {
        setData(null);
        return;
      }

      try {
        const apiClient = await buildApiClient();
        const summary = await fetchMeetingSummary(apiClient, {
          id: currentMeetingId,
          title: currentMeeting?.title,
          meetingDate: currentMeeting?.meetingDate,
          status: currentMeeting?.status,
        });

        setData(summary);
      } catch (error) {
        console.error("Error fetching tabulation data:", error);
        setData(
          createEmptySummary({
            id: currentMeetingId,
            title: currentMeeting?.title,
            meetingDate: currentMeeting?.meetingDate,
            status: currentMeeting?.status,
          })
        );
      }
    };

    void fetchCurrentTabulation();
  }, [
    currentMeeting?.meetingDate,
    currentMeeting?.status,
    currentMeeting?.title,
    currentMeeting?.totalSharesOutstanding,
    currentMeetingId,
  ]);

  useEffect(() => {
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

      if (isSpecialMeeting(currentMeeting.meetingType)) {
        setHistoricalData([]);
        return;
      }

      try {
        const apiClient = await buildApiClient();
        const comparableMeetingsResult = (await apiClient.GET("/meetings", {
          params: {
            query: {
              ticker: currentMeeting.ticker,
              limit: 200,
            },
          },
        })) as {
          data?: Meeting[] | { meetings?: Meeting[] };
          error?: unknown;
        };

        if (comparableMeetingsResult.error !== undefined) {
          throw new Error("Failed to fetch comparable meetings");
        }

        const rawMeetings = Array.isArray(comparableMeetingsResult.data)
          ? comparableMeetingsResult.data
          : (comparableMeetingsResult.data?.meetings ?? []);
        const comparableMeetings = rawMeetings
          .filter((meeting) => hasText(meeting.id))
          .filter(
            (meeting) => meeting.meetingType === currentMeeting.meetingType
          )
          .filter(
            (meeting) =>
              !hasText(currentMeeting.cusip) ||
              meeting.cusip === currentMeeting.cusip
          )
          .filter(
            (meeting) =>
              meeting.id === currentMeetingId || meeting.status === "COMPLETE"
          )
          .sort(sortMeetingsBySeriesOrder);

        const nextHistoricalData: HistoricalTabulationPoint[] = [];

        for (const comparableMeeting of comparableMeetings) {
          if (!hasText(comparableMeeting.id)) {
            continue;
          }

          const summary = await fetchMeetingSummary(
            apiClient,
            comparableMeeting
          );

          nextHistoricalData.push({
            meetingId: summary.meeting_id,
            yearLabel:
              comparableMeeting.meetingYear?.toString() ??
              parseMeetingYearInfo(
                summary.meeting_id
              )?.currentYear.toString() ??
              "Unknown",
            votedShares: Number(summary.shares_voted),
            unvotedShares: Number(summary.shares_unvoted),
            isCurrentMeeting: comparableMeeting.id === currentMeetingId,
          });
        }

        setHistoricalData(nextHistoricalData);
      } catch (error) {
        console.error("Error fetching previous year data:", error);
        setHistoricalData([]);
      }
    };

    void fetchHistoricalTabulation();
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
