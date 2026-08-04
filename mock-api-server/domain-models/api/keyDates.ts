import { getMeetingById } from "./meetings";
import { listPhasesByMeetingId } from "./phases";

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

/** A single dated milestone shown on a meeting's key-dates surfaces. */
export interface KeyDate {
  /** Stable id derived from the source record and the date's role. */
  id: string;
  /** Human-readable label, e.g. "Record Date". */
  title: string;
  /** ISO date string; never null in practice since undated entries are dropped. */
  date: string | null;
  /** 1-based phase this date belongs to, used to group the timeline. */
  phaseNumber: number;
}

/** Meeting-level dates and the phase each one belongs to. */
const meetingKeyDateFields = [
  {
    field: "preFilingDate",
    idSuffix: "prefiling",
    phaseNumber: 1,
    title: "Pre-Filing Date",
  },
  {
    field: "filingDate",
    idSuffix: "filing",
    phaseNumber: 1,
    title: "Filing Date",
  },
  {
    field: "brokerSearchDate",
    idSuffix: "brokersearch",
    phaseNumber: 3,
    title: "Broker Search Date",
  },
  {
    field: "recordDate",
    idSuffix: "record",
    phaseNumber: 4,
    title: "Record Date",
  },
  {
    field: "mailingDate",
    idSuffix: "mailing",
    phaseNumber: 6,
    title: "Mailing Date",
  },
  {
    field: "meetingDate",
    idSuffix: "meeting",
    phaseNumber: 8,
    title: "Meeting Date",
  },
] as const;

/** Phase-level key dates, keyed by their property on `phase.keyDates`. */
const phaseKeyDateFields = [
  { field: "startDate", idSuffix: "start", title: "Start Date" },
  { field: "endDate", idSuffix: "end", title: "End Date" },
  { field: "dueDate", idSuffix: "due", title: "Due Date" },
  { field: "completionDate", idSuffix: "completion", title: "Completion Date" },
] as const;

/**
 * Narrows an unknown field to a usable date string, filtering out the nulls
 * and empty strings that unpopulated date columns produce.
 *
 * @param value - Candidate date value from a meeting or phase record
 * @returns True when the value is a non-empty string
 */
const hasDate = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/**
 * Collects every key date for a meeting: the meeting's own milestone dates
 * plus the start/end/due/completion dates recorded on each phase.
 *
 * Reads through the Supabase-backed domain models directly. An earlier version
 * called back into this service over HTTP via a client pointed at PostgREST,
 * which rejected the OpenAPI-style paths with PGRST125 and made every meeting
 * look like it had no key dates.
 *
 * @param meetingId - The meeting whose key dates are wanted
 * @returns Every populated key date, or a 404/500 error if the meeting or its phases cannot be read
 */
export async function listKeyDatesForMeeting(
  meetingId: string
): Promise<ApiResponse<KeyDate[]>> {
  const { data: meeting, error: meetingError } =
    await getMeetingById(meetingId);

  if (meetingError || meeting === undefined) {
    return {
      error: {
        message: meetingError?.message ?? "Failed to fetch meeting",
        statusCode: meetingError?.statusCode ?? 404,
      },
    };
  }

  const { data: phases, error: phasesError } =
    await listPhasesByMeetingId(meetingId);

  if (phasesError) {
    return {
      error: {
        message: phasesError.message,
        statusCode: phasesError.statusCode ?? 500,
      },
    };
  }

  const result: KeyDate[] = [];

  for (const { field, idSuffix, phaseNumber, title } of meetingKeyDateFields) {
    const date = meeting[field];
    if (hasDate(date)) {
      result.push({
        date,
        id: `${meeting.id}-${idSuffix}`,
        phaseNumber,
        title,
      });
    }
  }

  const meetingPhases = phases ?? [];

  for (const phase of meetingPhases) {
    const phaseNumber = phase.orderIndex ?? 0;
    const keyDates: Record<string, unknown> = phase.keyDates ?? {};

    for (const { field, idSuffix, title } of phaseKeyDateFields) {
      const date = keyDates[field];
      if (hasDate(date)) {
        result.push({
          date,
          id: `${phase.id}-${idSuffix}`,
          phaseNumber,
          title,
        });
      }
    }
  }

  return { data: result };
}
