import type { Database } from "@/utils/supabase/database.types";

export type DigitalShareholderMeetingRow =
  Database["public"]["Tables"]["digital_shareholder_meeting"]["Row"];
export type DigitalShareholderMeetingInsert =
  Database["public"]["Tables"]["digital_shareholder_meeting"]["Insert"];
export type DigitalShareholderMeetingUpdate =
  Database["public"]["Tables"]["digital_shareholder_meeting"]["Update"];
type RegistrantType = NonNullable<
  DigitalShareholderMeetingRow["registrant_type"]
>;

const registrantTypes = new Set<RegistrantType>([
  "Guest",
  "Other",
  "Proxy",
  "Shareholder",
]);

function toRegistrantType(value: string | undefined): RegistrantType {
  return value !== undefined && registrantTypes.has(value as RegistrantType)
    ? (value as RegistrantType)
    : "Shareholder";
}

function serializeRegistrationQuestions(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

// API response type
export interface DigitalShareholderMeetingResponse {
  id: string;
  meetingId: string;
  registrantType: string | null;
  firstName: string | null;
  lastName: string | null;
  emailAddress: string | null;
  registrationQuestions: unknown;
  minutesAttendedMeeting: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// API request type
export interface DigitalShareholderMeetingRequest {
  registrantType?: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  registrationQuestions?: unknown;
  minutesAttendedMeeting?: number;
}

// Transform database row (snake_case) to API response (camelCase)
export function transformDigitalShareholderMeetingRow(
  row: DigitalShareholderMeetingRow
): DigitalShareholderMeetingResponse {
  return {
    id: row.id ?? "",
    meetingId: row.meeting_id ?? "",
    registrantType: row.registrant_type,
    firstName: row.first_name,
    lastName: row.last_name,
    emailAddress: row.email_address,
    registrationQuestions: row.registration_questions,
    minutesAttendedMeeting: row.minutes_attended_meeting,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Transform API request (camelCase) to database insert (snake_case)
export function transformToDigitalShareholderMeetingInsert(
  data: DigitalShareholderMeetingRequest,
  meetingId: string
): DigitalShareholderMeetingInsert {
  return {
    meeting_id: meetingId,
    registrant_type: toRegistrantType(data.registrantType),
    first_name: data.firstName,
    last_name: data.lastName,
    email_address: data.emailAddress,
    registration_questions: serializeRegistrationQuestions(
      data.registrationQuestions
    ),
    minutes_attended_meeting: data.minutesAttendedMeeting || null,
  };
}

// Transform API request (camelCase) to database update (snake_case)
export function transformToDigitalShareholderMeetingUpdate(
  data: Partial<DigitalShareholderMeetingRequest>
): DigitalShareholderMeetingUpdate {
  const update: DigitalShareholderMeetingUpdate = {};

  if (data.registrantType !== undefined) {
    update.registrant_type = toRegistrantType(data.registrantType);
  }
  if (data.firstName !== undefined) {
    update.first_name = data.firstName;
  }
  if (data.lastName !== undefined) {
    update.last_name = data.lastName;
  }
  if (data.emailAddress !== undefined) {
    update.email_address = data.emailAddress;
  }
  if (data.registrationQuestions !== undefined) {
    update.registration_questions = serializeRegistrationQuestions(
      data.registrationQuestions
    );
  }
  if (data.minutesAttendedMeeting !== undefined) {
    update.minutes_attended_meeting = data.minutesAttendedMeeting;
  }

  return update;
}
