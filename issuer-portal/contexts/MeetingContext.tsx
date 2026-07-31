"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { components } from "@/types/api";
import type { KeyDate, Position, Task } from "@/types/api-exports";

import buildApiClient from "@/domain-models/apiClient";
import { asArray, asNumber, asRecord, asString } from "@/utils/typeUtils";

type Meeting = components["schemas"]["Meeting"];

interface MeetingContextType {
  currentMeeting: Meeting | null;
  meetings: Meeting[];
  tasks: Task[];
  positions: Position[];
  keyDates: KeyDate[];
  isLoading: boolean;
  tasksLoading: boolean;
  positionsLoading: boolean;
  error: string | null;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  refreshMeetings: (ticker?: string) => Promise<void>;
  refreshMeetingData: () => Promise<{
    tasks: Task[];
    positions: Position[];
  } | null>; // Refresh tasks and positions for current meeting
  getMeetingById: (id: string) => Meeting | undefined;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

// Derive the list of key dates from a meeting. Pure helper kept at module scope
// so the provider component stays focused and readable.
function extractKeyDates(currentMeeting: Meeting | null): KeyDate[] {
  if (!currentMeeting) {
    return [];
  }

  const extractedKeyDates: KeyDate[] = [];

  if (currentMeeting.preFilingDate) {
    extractedKeyDates.push({
      id: "pre-filing-date",
      title: "Pre Filing Date",
      date: currentMeeting.preFilingDate,
      phaseNumber: 1,
    });
  }

  if (currentMeeting.filingDate) {
    extractedKeyDates.push({
      id: "filing-date",
      title: "Filing Date",
      date: currentMeeting.filingDate,
      phaseNumber: 1,
    });
  }

  if (currentMeeting.brokerSearchDate) {
    extractedKeyDates.push({
      id: "broker-search-date",
      title: "Broker Search Date",
      date: currentMeeting.brokerSearchDate,
      phaseNumber: 2,
    });
  }

  if (currentMeeting.recordDate) {
    extractedKeyDates.push({
      id: "record-date",
      title: "Record Date",
      date: currentMeeting.recordDate,
      phaseNumber: 3,
    });
  }

  if (currentMeeting.mailingDate) {
    extractedKeyDates.push({
      id: "mailing-date",
      title: "Mailing Date",
      date: currentMeeting.mailingDate,
      phaseNumber: 4,
    });
  }

  if (currentMeeting.meetingDate) {
    extractedKeyDates.push({
      id: "meeting-date",
      title: "Meeting Date",
      date: currentMeeting.meetingDate,
      phaseNumber: 7,
    });
  }

  return extractedKeyDates;
}

// Normalize a raw meetings API record into a typed Meeting object.
function normalizeMeetingRecord(record: Record<string, unknown>): Meeting {
  return {
    id: asString(record.id) || "",
    title: asString(record.title) || "",
    ticker: asString(record.ticker) || "",
    cusip: asString(record.cusip) || undefined,
    meetingType: asString(record.meetingType) || undefined,
    meetingYear:
      typeof record.meetingYear === "number" ? record.meetingYear : undefined,
    status: asString(record.status) as Meeting["status"],
    meetingDate: asString(record.meetingDate) || undefined,
    recordDate: asString(record.recordDate) || undefined,
    cutoffDate: asString(record.cutoffDate) || undefined,
    currentPhase: asString(record.currentPhase) || undefined,
    overallCompletion:
      typeof record.overallCompletion === "number"
        ? record.overallCompletion
        : undefined,
    preFilingDate: asString(record.preFilingDate) || undefined,
    filingDate: asString(record.filingDate) || undefined,
    brokerSearchDate: asString(record.brokerSearchDate) || undefined,
    mailingDate: asString(record.mailingDate) || undefined,
    distributionType: asString(record.distributionType) || undefined,
    transferAgent: asString(record.transferAgent) || undefined,
    transferAgentConfirmed:
      typeof record.transferAgentConfirmed === "boolean"
        ? record.transferAgentConfirmed
        : null,
    employeeStockPlans: asString(record.employeeStockPlans) || undefined,
    planAdministrator: asString(record.planAdministrator) || undefined,
    planAdministratorContact:
      asString(record.planAdministratorContact) || undefined,
    planAdministratorContactEmail:
      asString(record.planAdministratorContactEmail) || undefined,
    solicitor: asString(record.solicitor) || undefined,
    solicitorEmail: asString(record.solicitorEmail) || undefined,
    inspector: asString(record.inspector) || undefined,
    ivrDialInNumber: asString(record.ivrDialInNumber) || undefined,
    mailingStatus: asString(record.mailingStatus) || undefined,
    quorumRequirement:
      asNumber(record.quorumRequirement) ??
      asNumber(record.quorum_requirement) ??
      undefined,
    clientId: asString(record.clientId) || undefined,
    createdAt: asString(record.createdAt) || undefined,
    updatedAt: asString(record.updatedAt) || undefined,
  };
}

// Normalize a raw positions API record into a typed Position object.
function normalizePositionRecord(record: Record<string, unknown>): Position {
  return {
    id: asString(record.id) || "",
    meetingId: asString(record.meetingId) || asString(record.meeting_id) || "",
    cusip: asString(record.cusip) || undefined,
    accountType:
      asString(record.accountType) ||
      asString(record.account_type) ||
      undefined,
    setKey: asString(record.setKey) || asString(record.set_key) || undefined,
    name: asString(record.name) || undefined,
    accountNumber:
      asString(record.accountNumber) ||
      asString(record.account_number) ||
      undefined,
    controlNumber:
      asString(record.controlNumber) ||
      asString(record.control_number) ||
      undefined,
    voteStatus: (asString(record.voteStatus) ||
      asString(record.vote_status)) as Position["voteStatus"],
    shares: typeof record.shares === "number" ? record.shares : undefined,
    sharesVoted:
      typeof record.sharesVoted === "number"
        ? record.sharesVoted
        : typeof record.shares_voted === "number"
          ? record.shares_voted
          : undefined,
    source: record.source as Position["source"],
    createdAt:
      asString(record.createdAt) || asString(record.created_at) || undefined,
    updatedAt:
      asString(record.updatedAt) || asString(record.updated_at) || undefined,
  };
}

interface MeetingProviderProps {
  readonly children: React.ReactNode;
  readonly initialMeeting?: Meeting | null;
}

// All provider state, data fetching, and effects live in this custom hook so the
// MeetingProvider component itself stays small and focused on rendering.
function useMeetingContextValue(
  initialMeeting: Meeting | null
): MeetingContextType {
  const pathname = usePathname();
  const router = useRouter();
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(
    initialMeeting
  );
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(!initialMeeting); // Start loading if no initial data
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep local state for tasks to maintain compatibility
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Derive key dates from the current meeting during render (no effect chain).
  const keyDates: KeyDate[] = useMemo(
    () => extractKeyDates(currentMeeting),
    [currentMeeting]
  );

  // Extract ticker from URL
  const getTickerFromURL = useCallback((): string | undefined => {
    const tickerMatch = /^\/([A-Za-z]{2,5})\//.exec(pathname);
    return tickerMatch?.[1];
  }, [pathname]);

  // Extract meeting ID from URL
  const getMeetingIdFromURL = useCallback((): string | undefined => {
    const meetingMatch = /\/(?:past-)?meeting\/([^/]+)/.exec(pathname);
    return meetingMatch?.[1];
  }, [pathname]);

  const redirectToMeetingTicker = useCallback(
    (meeting: Meeting): boolean => {
      const urlTicker = getTickerFromURL();
      const meetingTicker = meeting.ticker;

      if (!urlTicker || !meetingTicker) return false;
      if (urlTicker.toUpperCase() === meetingTicker.toUpperCase()) return false;

      router.replace(pathname.replace(/^\/[^/]+/, `/${meetingTicker}`));
      return true;
    },
    [getTickerFromURL, pathname, router]
  );

  const refreshMeetings = useCallback(
    async (ticker?: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const targetTicker = ticker || getTickerFromURL();
        if (!targetTicker) {
          setError("No ticker found in URL");
          return;
        }

        const apiClient = await buildApiClient();
        const { data, error } = await apiClient.GET("/meetings", {
          params: { query: { ticker: targetTicker } },
        });

        if (error) {
          setError("Failed to fetch meetings");
          return;
        }

        // The API returns { meetings: Meeting[], pagination: ... }
        const responseData = asRecord(data);
        const meetingsData = responseData ? asArray(responseData.meetings) : [];
        const normalizedMeetings: Meeting[] = [];

        for (const item of meetingsData) {
          const record = asRecord(item);
          if (!record) continue;

          normalizedMeetings.push(normalizeMeetingRecord(record));
        }

        setMeetings(normalizedMeetings);

        // Set current meeting if we don't have one or if URL suggests a different one
        const meetingIdFromURL = getMeetingIdFromURL();
        if (meetingIdFromURL) {
          const targetMeeting = normalizedMeetings.find(
            (m) => m.id === meetingIdFromURL
          );
          if (
            targetMeeting &&
            (!currentMeeting || currentMeeting.id !== targetMeeting.id)
          ) {
            if (redirectToMeetingTicker(targetMeeting)) {
              return;
            }
            setCurrentMeeting(targetMeeting);
          }
        } else if (!currentMeeting && normalizedMeetings.length > 0) {
          // Fallback to first meeting if no URL context
          setCurrentMeeting(normalizedMeetings[0]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch meetings"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      getTickerFromURL,
      getMeetingIdFromURL,
      currentMeeting,
      redirectToMeetingTicker,
    ]
  );

  const getMeetingById = useCallback(
    (id: string): Meeting | undefined => {
      return meetings.find((meeting) => meeting.id === id);
    },
    [meetings]
  );

  // Fetch tasks and positions for the current meeting
  const refreshMeetingData = useCallback(async () => {
    if (!currentMeeting?.id) return null;

    try {
      // Fetch meeting, tasks, and positions in parallel
      setTasksLoading(true);
      setPositionsLoading(true);

      const apiClient = await buildApiClient();
      const [meetingResult, tasksResult, positionsResult] = await Promise.all([
        apiClient.GET("/meetings/{meetingId}", {
          params: { path: { meetingId: currentMeeting.id } },
        }),
        apiClient.GET("/meetings/{meetingId}/tasks", {
          params: { path: { meetingId: currentMeeting.id } },
        }),
        apiClient.GET("/positions", {
          params: { query: { meetingId: currentMeeting.id, limit: 50000 } },
        }),
      ]);

      // Update the meeting object with fresh data from the server
      const typedMeetingResult = meetingResult as {
        error?: unknown;
        data?: unknown;
      };
      if (!typedMeetingResult.error && typedMeetingResult.data) {
        const updatedMeeting = typedMeetingResult.data as Meeting;
        setCurrentMeeting(updatedMeeting);

        // Also update the meeting in the meetings array to keep everything in sync
        setMeetings((prevMeetings) =>
          prevMeetings.map((m) =>
            m.id === updatedMeeting.id ? updatedMeeting : m
          )
        );
      }

      // Handle tasks
      let taskData: Task[] = [];
      if (tasksResult.error) {
        // Error handling in place
      } else {
        taskData = tasksResult.data || [];
        setTasks(taskData);
      }

      // Handle positions
      const positionData: Position[] = [];
      if (!positionsResult.error) {
        const positionsResponse = asRecord(positionsResult.data);
        const rawPositions = positionsResponse
          ? asArray(positionsResponse.positions)
          : asArray(positionsResult.data);
        for (const item of rawPositions) {
          const record = asRecord(item);
          if (!record) continue;

          positionData.push(normalizePositionRecord(record));
        }
      }
      setPositions(positionData);

      return {
        tasks: taskData,
        positions: positionData,
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh meeting data"
      );
      return null;
    } finally {
      setTasksLoading(false);
      setPositionsLoading(false);
    }
  }, [currentMeeting?.id]);

  // Auto-fetch meetings when component mounts or ticker changes.
  // When the ticker changes, clear the previous client's meetings immediately so
  // no consumer (e.g. EventTabs) renders the prior client's data during the switch.
  const loadedTickerRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const ticker = getTickerFromURL();
    if (ticker) {
      if (
        loadedTickerRef.current &&
        loadedTickerRef.current.toUpperCase() !== ticker.toUpperCase()
      ) {
        setMeetings([]);
        setCurrentMeeting(null);
      }
      loadedTickerRef.current = ticker;
      void refreshMeetings(ticker);
    }
  }, [refreshMeetings, getTickerFromURL]);

  // Auto-set current meeting when URL changes
  useEffect(() => {
    // Guard against overlapping re-runs resolving out of order and writing
    // stale state after the async fetch below.
    let ignore = false;
    const meetingIdFromURL = getMeetingIdFromURL();
    if (meetingIdFromURL && meetings.length > 0) {
      const targetMeeting = meetings.find((m) => m.id === meetingIdFromURL);
      // Only update if we found a target meeting and it's different from current
      if (targetMeeting) {
        if (redirectToMeetingTicker(targetMeeting)) {
          return;
        }
        setCurrentMeeting((prev) => {
          // Only update if different to avoid unnecessary re-renders
          if (!prev || prev.id !== targetMeeting.id) {
            return targetMeeting;
          }
          return prev;
        });
      } else {
        // Meeting not in active list - fetch it from API (likely a past meeting)
        const fetchPastMeeting = async () => {
          try {
            const api = await buildApiClient();
            const { data } = await api.GET("/meetings/{meetingId}", {
              params: { path: { meetingId: meetingIdFromURL } },
            });
            if (!ignore) {
              if (data) {
                const meetingData = data as Meeting;
                if (redirectToMeetingTicker(meetingData)) {
                  return;
                }
                setCurrentMeeting((prev) => {
                  if (!prev || prev.id !== meetingData.id) {
                    return meetingData;
                  }
                  return prev;
                });
              }
            }
          } catch (error) {
            if (!ignore) {
              console.error("Error fetching past meeting:", error);
            }
          }
        };
        void fetchPastMeeting();
      }
    }
    return () => {
      ignore = true;
    };
  }, [meetings, getMeetingIdFromURL, redirectToMeetingTicker]);

  // Fetch meeting data when current meeting changes
  useEffect(() => {
    if (currentMeeting?.id) {
      void refreshMeetingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMeeting?.id]);

  const contextValue: MeetingContextType = useMemo(
    () => ({
      currentMeeting,
      meetings,
      tasks,
      positions,
      keyDates,
      isLoading,
      tasksLoading,
      positionsLoading,
      error,
      setCurrentMeeting,
      refreshMeetings,
      refreshMeetingData,
      getMeetingById,
    }),
    [
      currentMeeting,
      meetings,
      tasks,
      positions,
      keyDates,
      isLoading,
      tasksLoading,
      positionsLoading,
      error,
      refreshMeetings,
      refreshMeetingData,
      getMeetingById,
    ]
  );

  return contextValue;
}

export const MeetingProvider = ({
  children,
  initialMeeting = null,
}: MeetingProviderProps) => {
  const contextValue = useMeetingContextValue(initialMeeting);

  return (
    <MeetingContext.Provider value={contextValue}>
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error("useMeeting must be used within a MeetingProvider");
  }
  return context;
};

// Non-throwing variant for optional consumers (e.g. EventTabs, which renders on
// pages outside a MeetingProvider). Calls the hook unconditionally per the Rules
// of Hooks and returns undefined when no provider is present, so callers get the
// full context type rather than a narrowed stand-in object.
export const useMeetingSafe = (): MeetingContextType | undefined =>
  useContext(MeetingContext);

export default MeetingContext;
