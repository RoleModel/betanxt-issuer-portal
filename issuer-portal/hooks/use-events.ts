/* eslint-disable compat/compat */
"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import useSWR from "swr";

import type { EventRow } from "@/utils/eventData";

import { buildApiClient } from "@/domain-models/apiClient";
import { clientsSWRConfig } from "@/lib/swr-config";
import { getBrandConfigByTicker } from "@/utils/brandConfig";
import { parseLocalDate } from "@/utils/dateUtils";
import { asNumber, asRecord, asString } from "@/utils/typeUtils";

type ApiClient = Awaited<ReturnType<typeof buildApiClient>>;

const pageSize = 100;

/** Returns the first candidate that parses as a non-empty string. */
const firstString = (...values: unknown[]): string | null =>
  values.map((value) => asString(value)).find((value) => value !== null) ?? null;

// Supabase join returns snake_case; handle both forms.
const extractClientCompanyName = (client: unknown): string | null => {
  const record = asRecord(client);
  return record === null
    ? null
    : firstString(record.companyName, record.company_name, record.shortName, record.short_name);
};

const formatMeetingDate = (date: string | null): string | null =>
  date === null
    ? null
    : parseLocalDate(date).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

const deriveEventType = (meetingType: string): EventRow["eventType"] =>
  meetingType.toLowerCase().includes("annual") ? "Annual Meeting" : "Special Meeting";

const deriveMeetingStatus = (status: string | null): EventRow["meetingStatus"] =>
  status === "ACTIVE" ? "ACTIVE" : "COMPLETE";

const statusFromReviewRecord = (
  reviewRecord: Record<string, unknown>,
): "PENDING_REVIEW" | "VERIFIED" =>
  asString(reviewRecord.status) === "VERIFIED" ? "VERIFIED" : "PENDING_REVIEW";

const deriveReportStatus = (
  reviewRecord: Record<string, unknown> | null,
): EventRow["reportStatus"] =>
  reviewRecord === null ? null : statusFromReviewRecord(reviewRecord);

const deriveExchange = (
  meeting: Record<string, unknown>,
  clientRecord: Record<string, unknown> | null,
): string | null =>
  firstString(meeting.exchange, clientRecord?.exchange, clientRecord?.listingExchange);

const meetingToEventRow = (meeting: Record<string, unknown>): EventRow[] => {
  const id = asString(meeting.id);
  const ticker = asString(meeting.ticker);
  const meetingDate = asString(meeting.meetingDate);
  const meetingType = asString(meeting.meetingType);

  if (id === null || ticker === null || meetingDate === null || meetingType === null) {
    return [];
  }

  const eventDate = formatMeetingDate(meetingDate);
  if (eventDate === null) {
    return [];
  }

  const clientRecord = asRecord(meeting.client);
  const reviewRecord = asRecord(meeting.tabulationReview);

  // Prefer joined client object → brand config lookup → ticker as last resort
  const companyName =
    extractClientCompanyName(meeting.client) ??
    getBrandConfigByTicker(ticker)?.companyName ??
    ticker;

  return [
    {
      brokerSearchDate: formatMeetingDate(
        asString(meeting.brokerSearchDate ?? meeting.broker_search_date),
      ),
      clientTicker: ticker,
      cusip: asString(meeting.cusip) ?? "",
      event: companyName,
      eventDate,
      eventType: deriveEventType(meetingType),
      exchange: deriveExchange(meeting, clientRecord),
      id,
      mailingDate: formatMeetingDate(asString(meeting.mailingDate ?? meeting.mailing_date)),
      mailingStatus: asString(meeting.mailingStatus),
      meetingId: id,
      meetingStatus: deriveMeetingStatus(asString(meeting.status)),
      quorumRequirement: asNumber(meeting.quorumRequirement ?? meeting.quorum_requirement),
      recordDate: formatMeetingDate(asString(meeting.recordDate ?? meeting.record_date)),
      reportStatus: deriveReportStatus(reviewRecord),
      setKey: asString(meeting.setKey ?? meeting.set_key),
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

const ticketsFromClientList = (clientTickers: string[] | undefined): string[] | undefined =>
  clientTickers !== undefined && clientTickers.length > 0 ? clientTickers : undefined;

const ticketsFromIssuer = (issuerTicker: string | null | undefined): string[] | undefined =>
  issuerTicker === null || issuerTicker === undefined ? undefined : [issuerTicker];

interface UseEventsResult {
  events: EventRow[];
  loading: boolean;
  error: string | null;
  /** Revalidate the events list from the server */
  revalidate: () => Promise<EventRow[] | undefined>;
}

export const useEvents = (): UseEventsResult => {
  const { data: session } = useSession();
  const isBypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  const userType = session?.user?.type;
  const isUnrestrictedRole = userType === "CSM" || userType === "ADMIN";

  // CSM / ADMIN fetch all meetings; page-level filters apply for CSM.
  // ISSUER / PARENT_CLIENT / SOLICITOR are scoped to their ticker allow-list.
  const sessionTickers = session?.user?.clientTickers;
  const issuerTicker = session?.user?.client_ticker;
  const allowedTickers = useMemo<string[] | undefined>(
    () =>
      isUnrestrictedRole
        ? undefined
        : (ticketsFromClientList(sessionTickers) ?? ticketsFromIssuer(issuerTicker)),
    [isUnrestrictedRole, sessionTickers, issuerTicker],
  );

  const eventsFetcher = async (): Promise<EventRow[]> => {
    if (!isBypassAuth && !session) {
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

    return [firstMeetings, ...remainingPages].flat().flatMap((meeting) => {
      const record = asRecord(meeting);
      return record === null ? [] : meetingToEventRow(record);
    });
  };

  const {
    data: rawData,
    error,
    isLoading,
    mutate,
  } = useSWR(session || isBypassAuth ? ["/events-list", session?.user?.id] : null, eventsFetcher, {
    ...clientsSWRConfig,
    dedupingInterval: 120_000,
  });

  // Filter is applied outside the fetcher so it is always reactive to the current session.
  // This prevents stale cached data (fetched before clientTickers was hydrated) from leaking
  // through to restricted users.
  const events = useMemo(() => {
    if (!rawData) {
      return [];
    }
    if (!allowedTickers) {
      return rawData;
    }
    const allowedTickerSet = new Set<string>(allowedTickers);
    return rawData.filter((row) => allowedTickerSet.has(row.clientTicker));
  }, [rawData, allowedTickers]);

  return {
    error: Error.isError(error) ? error.message : null,
    events,
    loading: isLoading,
    revalidate: mutate,
  };
};
