/* eslint-disable compat/compat */
"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";

import type { components } from "@/domain-models/generated-schema";

import { buildApiClient } from "@/domain-models/apiClient";
import { clientsSWRConfig } from "@/lib/swr-config";
import { getBrandConfigByTicker } from "@/utils/brandConfig";
import { asNumber, asRecord, asString } from "@/utils/typeUtils";

type TabulationReview = components["schemas"]["TabulationReview"];
type ApiClient = Awaited<ReturnType<typeof buildApiClient>>;

export type ReviewCheckpoint = "FINAL_REPORT" | "FIRST_REPORT";

export interface ReviewQueueItem {
  brokerNonVote: number | null;
  checkpoint: ReviewCheckpoint;
  companyName: string;
  cusip: string;
  daysUntilMeeting: number;
  meetingDate: string;
  meetingId: string;
  meetingType: string;
  meetingTitle: string;
  quorumRequirement: number | null;
  review: TabulationReview | null;
  setKey: string | null;
  ticker: string;
  totalSharesOutstanding: number | null;
  verified: boolean;
}

interface UseTabulationReviewQueueResult {
  applyReview: (
    meetingId: string,
    review: TabulationReview,
  ) => Promise<ReviewQueueItem[] | undefined>;
  error: string | null;
  items: ReviewQueueItem[];
  loading: boolean;
  remaining: number;
  revalidate: () => Promise<ReviewQueueItem[] | undefined>;
  verifiedCount: number;
}

const pageSize = 100;
const millisecondsPerDay = 86_400_000;

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const meetingToQueueItems = (meeting: Record<string, unknown>): ReviewQueueItem[] => {
  const id = asString(meeting.id);
  const ticker = asString(meeting.ticker);
  const meetingDate = asString(meeting.meetingDate);
  const status = asString(meeting.status);

  if (id === null || ticker === null || meetingDate === null || status !== "ACTIVE") {
    return [];
  }

  const clientRecord = asRecord(meeting.client);
  const companyName =
    asString(clientRecord?.companyName) ??
    asString(clientRecord?.company_name) ??
    getBrandConfigByTicker(ticker)?.companyName ??
    ticker;

  const meetingDateValue = new Date(`${meetingDate}T00:00:00`);
  const meetingDateTime = meetingDateValue.getTime();
  const daysUntilMeeting = Number.isNaN(meetingDateTime)
    ? 0
    : Math.ceil((meetingDateTime - Date.now()) / millisecondsPerDay);

  // The final report is the business sign-off that gets filed with the
  // company; everything earlier in the window is QC'd as the "first report"
  // checkpoint for prototype purposes.
  const checkpoint: ReviewCheckpoint = daysUntilMeeting <= 2 ? "FINAL_REPORT" : "FIRST_REPORT";

  const reviewRecord = asRecord(meeting.tabulationReview);
  const review = reviewRecord === null ? null : (reviewRecord as TabulationReview);

  return [
    {
      brokerNonVote: asNumber(meeting.brokerNonVote ?? meeting.broker_non_vote),
      checkpoint,
      companyName,
      cusip: asString(meeting.cusip) ?? "",
      daysUntilMeeting,
      meetingDate,
      meetingId: id,
      meetingType: asString(meeting.meetingType ?? meeting.meeting_type) ?? "Annual Meeting",
      meetingTitle: asString(meeting.title) ?? "Meeting",
      quorumRequirement: toFiniteNumber(meeting.quorumRequirement ?? meeting.quorum_requirement),
      review,
      setKey: asString(meeting.setKey ?? meeting.set_key) ?? null,
      ticker,
      totalSharesOutstanding: toFiniteNumber(
        meeting.totalSharesOutstanding ?? meeting.total_shares_outstanding,
      ),
      verified: review?.status === "VERIFIED",
    },
  ];
};

const fetchMeetingsPage = async (api: ApiClient, page: number): Promise<unknown[]> => {
  const { data } = await api.GET("/meetings", {
    params: { query: { limit: pageSize, page } },
  });
  const record = asRecord(data);
  if (record === null) {
    return [];
  }
  return Array.isArray(record.meetings) ? record.meetings : [];
};

const readTotalCount = (data: unknown): number => {
  const record = asRecord(data);
  const pagination = asRecord(record?.pagination);
  return typeof pagination?.total === "number" ? pagination.total : 0;
};

/**
 * Fetches the CSM's tabulation review queue: every ACTIVE meeting, ordered
 * by how close its meeting date is, with the internal QC state carried on
 * `meeting.tabulationReview`. Prototype scope: every active meeting appears
 * in the queue until a CSM verifies its current report checkpoint.
 */
export const useTabulationReviewQueue = (): UseTabulationReviewQueueResult => {
  const { data: session } = useSession();
  const isBypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  const queueFetcher = async (): Promise<ReviewQueueItem[]> => {
    if (!isBypassAuth && session === null) {
      return [];
    }

    const api = await buildApiClient();

    // Read the first page directly so the total count can size the rest of
    // the fetch, then load the remaining pages in parallel.
    const firstPage = await api.GET("/meetings", {
      params: { query: { limit: pageSize, page: 1 } },
    });
    const firstRecord = asRecord(firstPage.data);
    if (firstRecord === null) {
      return [];
    }
    const firstMeetings = Array.isArray(firstRecord.meetings) ? firstRecord.meetings : [];
    const totalCount = readTotalCount(firstPage.data);
    const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
    const remainingPageNumbers: number[] = [];
    let nextPage = 2;
    while (nextPage <= pageCount) {
      remainingPageNumbers.push(nextPage);
      nextPage += 1;
    }
    const remainingPages = await Promise.all(
      remainingPageNumbers.map(async (page) => await fetchMeetingsPage(api, page)),
    );

    const items = [firstMeetings, ...remainingPages].flat().flatMap((meeting) => {
      const record = asRecord(meeting);
      return record === null ? [] : meetingToQueueItems(record);
    });

    // eslint-disable-next-line unicorn/no-array-sort -- tsconfig lib predates Array#toSorted
    return [...items].sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  };

  const {
    data: items,
    error,
    isLoading,
    mutate,
  } = useSWR(
    session !== null || isBypassAuth ? ["/tabulation-review-queue", session?.user.id] : null,
    queueFetcher,
    {
      ...clientsSWRConfig,
      dedupingInterval: 30_000,
    },
  );

  const resolvedItems = items ?? [];
  const verifiedCount = resolvedItems.filter((item) => item.verified).length;

  return {
    applyReview: async (meetingId, review) =>
      await mutate(
        (currentItems) =>
          currentItems?.map((item) =>
            item.meetingId === meetingId
              ? {
                  ...item,
                  review,
                  verified: review.status === "VERIFIED",
                }
              : item,
          ),
        { revalidate: true },
      ),
    error: Error.isError(error) ? error.message : null,
    items: resolvedItems,
    loading: isLoading,
    remaining: resolvedItems.length - verifiedCount,
    revalidate: mutate,
    verifiedCount,
  };
};
