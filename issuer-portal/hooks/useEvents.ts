/* eslint-disable @typescript-eslint/consistent-return */
/* eslint-disable consistent-return */
/* eslint-disable compat/compat */
/* eslint-disable no-plusplus */
/* eslint-disable sonarjs/no-inconsistent-returns */
/* eslint-disable unicorn/no-declarations-before-early-exit */
/* eslint-disable func-style */
"use client";

import { useSession } from "next-auth/react";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import type { EventRow } from "@/utils/eventData";
import buildApiClient from "@/domain-models/apiClient";
import { clientsSWRConfig } from "@/lib/swr-config";
import { getBrandConfigByTicker } from "@/utils/brandConfig";
import { parseLocalDate } from "@/utils/dateUtils";
import { asBoolean, asNumber, asRecord, asString } from "@/utils/typeUtils";

function extractClientCompanyName(client: unknown): string | null {
  const record = asRecord(client);
  if (!record) {
    return null;
  }
  // Supabase join returns snake_case; handle both forms
  return (
    asString(record.companyName) ??
    asString(record.company_name) ??
    asString(record.shortName) ??
    asString(record.short_name) ??
    null
  );
}

function formatMeetingDate(date: string | null): string | null {
  if (date === null) {
    return null;
  }

  return parseLocalDate(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function meetingToEventRow(meeting: Record<string, unknown>): EventRow | null {
  const id = asString(meeting.id);
  const ticker = asString(meeting.ticker);
  const meetingDate = asString(meeting.meetingDate);
  const meetingType = asString(meeting.meetingType);
  const status = asString(meeting.status);
  const cusip = asString(meeting.cusip) ?? "";

  if (!id || !ticker || !meetingDate || !meetingType) {
    return null;
  }

  // Prefer joined client object → brand config lookup → ticker as last resort
  const companyName =
    extractClientCompanyName(meeting.client) ??
    getBrandConfigByTicker(ticker)?.companyName ??
    ticker;

  const eventDate = formatMeetingDate(meetingDate);
  if (eventDate === null) {
    return null;
  }

  const isAnnual = meetingType.toLowerCase().includes("annual");
  const eventType: "Annual Meeting" | "Special Meeting" = isAnnual
    ? "Annual Meeting"
    : "Special Meeting";

  const meetingStatus: "ACTIVE" | "COMPLETE" =
    status === "ACTIVE" ? "ACTIVE" : "COMPLETE";

  const mailingStatus = asString(meeting.mailingStatus) ?? null;
  const clientRecord = asRecord(meeting.client);
  const exchange =
    asString(meeting.exchange) ??
    asString(clientRecord?.exchange) ??
    asString(clientRecord?.listingExchange) ??
    null;
  const brokerSearchDate = formatMeetingDate(
    asString(meeting.brokerSearchDate ?? meeting.broker_search_date)
  );
  const recordDate = formatMeetingDate(
    asString(meeting.recordDate ?? meeting.record_date)
  );
  const mailingDate = formatMeetingDate(
    asString(meeting.mailingDate ?? meeting.mailing_date)
  );
  const quorumRequirement = asNumber(
    meeting.quorumRequirement ?? meeting.quorum_requirement
  );
  const isTabulationReleased = asBoolean(
    meeting.tabulationReleased ?? meeting.tabulation_released
  );

  return {
    id,
    event: companyName,
    cusip,
    setKey: asString(meeting.setKey ?? meeting.set_key) ?? null,
    eventDate,
    brokerSearchDate,
    recordDate,
    mailingDate,
    eventType,
    meetingId: id,
    clientTicker: ticker,
    meetingStatus,
    mailingStatus,
    exchange,
    quorumRequirement,
    tabulationReleased: isTabulationReleased,
  };
}

interface UseEventsResult {
  events: EventRow[];
  loading: boolean;
  error: string | null;
  /** Revalidate the events list from the server */
  revalidate: () => Promise<EventRow[] | undefined>;
  /**
   * Patch the cached rows so a tabulation release shows immediately, without
   * waiting on the (multi-page) refetch that follows it.
   */
  applyTabulationReleased: (
    meetingIds: readonly string[],
    released: boolean
  ) => void;
}

interface EventsPage {
  readonly events: EventRow[];
  readonly totalCount: number;
}

const EVENTS_PAGE_SIZE = 100;

export function useEvents(): UseEventsResult {
  const { data: session } = useSession();
  const isBypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  const userType = session?.user?.type;
  const isUnrestrictedRole = userType === "CSM" || userType === "ADMIN";

  // CSM / ADMIN fetch all meetings; page-level filters apply for CSM.
  // ISSUER / PARENT_CLIENT / SOLICITOR are scoped to their ticker allow-list.
  const allowedTickers = useMemo(() => {
    if (isUnrestrictedRole) {
      return;
    }

    const sessionTickers = session?.user.clientTickers;
    if (sessionTickers && sessionTickers.length > 0) {
      return sessionTickers;
    }

    const issuerTicker = session?.user.client_ticker;
    if (issuerTicker) {
      return [issuerTicker];
    }
  }, [
    isUnrestrictedRole,
    session?.user.clientTickers,
    session?.user.client_ticker,
  ]);

  const eventsFetcher = async (): Promise<EventRow[]> => {
    if (!isBypassAuth && !session) {
      return [];
    }

    const api = await buildApiClient();
    const fetchEventsPage = async (
      page: number
    ): Promise<EventsPage | null> => {
      const { data, error } = await api.GET("/meetings", {
        params: { query: { page, limit: EVENTS_PAGE_SIZE } },
      });

      if (error || !data) {
        return null;
      }

      const dataRecord = asRecord(data);
      if (!dataRecord) {
        return null;
      }

      const meetings = Array.isArray(dataRecord.meetings)
        ? dataRecord.meetings
        : [];
      const events: EventRow[] = [];

      for (const meeting of meetings) {
        const record = asRecord(meeting);
        if (!record) {
          continue;
        }
        const row = meetingToEventRow(record);
        if (!row) {
          continue;
        }
        events.push(row);
      }

      const paginationRecord = asRecord(dataRecord.pagination);
      const totalCount =
        typeof paginationRecord?.total === "number"
          ? paginationRecord.total
          : events.length;

      return { events, totalCount };
    };

    // The deployed mock API returns an empty page for oversized limits. Keep
    // requests at the API's reliable 100-row page size, but load the remaining
    // pages concurrently once the first response gives us the total.
    const firstPage = await fetchEventsPage(1);
    if (!firstPage) {
      return [];
    }

    const pageCount = Math.max(
      1,
      Math.ceil(firstPage.totalCount / EVENTS_PAGE_SIZE)
    );
    const additionalPageNumbers: number[] = [];

    for (let page = 2; page <= pageCount; page++) {
      additionalPageNumbers.push(page);
    }

    const additionalPages = await Promise.all(
      additionalPageNumbers.map(async (page) => await fetchEventsPage(page))
    );
    const allEvents = [...firstPage.events];

    for (const additionalPage of additionalPages) {
      if (!additionalPage) {
        continue;
      }
      for (const event of additionalPage.events) {
        allEvents.push(event);
      }
    }

    return allEvents;
  };

  const {
    data: rawData,
    error,
    isLoading,
    mutate,
  } = useSWR(
    session || isBypassAuth ? ["/events-list", session?.user?.id] : null,
    eventsFetcher,
    {
      ...clientsSWRConfig,
      dedupingInterval: 120_000,
    }
  );

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

  const applyTabulationReleased = useCallback(
    (meetingIds: readonly string[], released: boolean) => {
      const targets = new Set<string>(meetingIds);
      if (targets.size === 0) {
        return;
      }

      void mutate(
        (current: EventRow[] | undefined) =>
          current?.map((row) =>
            targets.has(row.meetingId)
              ? { ...row, tabulationReleased: released }
              : row
          ),
        { revalidate: false }
      );
    },
    [mutate]
  );

  return {
    events,
    loading: isLoading,
    error: Error.isError(error) ? error.message : null,
    revalidate: mutate,
    applyTabulationReleased,
  };
}
