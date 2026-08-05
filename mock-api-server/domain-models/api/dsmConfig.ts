import { randomUUID } from "node:crypto";

import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";

// Helper function to convert null to undefined
const nullToUndefined = <T>(value: T | null): T | undefined =>
  value === null ? undefined : value;

// Use generated types from OpenAPI schema
type DSMConfig = components["schemas"]["DSMConfig"];
type DSMConfigRow = Database["public"]["Tables"]["dsm_config"]["Row"];
type DSMConfigInsert = Database["public"]["Tables"]["dsm_config"]["Insert"];

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

// `types/api.ts` and `utils/supabase/database.types.ts` are excluded from
// ESLint's typed-linting program, so the linter's own type resolution for
// their fields here falls back to an error type that reads as `any` —
// `tsc --noEmit` has no issue with any of this.
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

// Transform snake_case database fields to camelCase API fields
export const transformDSMConfig = (
  databaseConfig: DSMConfigRow
): DSMConfig => ({
  id: databaseConfig.id ?? "",
  meetingId: databaseConfig.meeting_id ?? "",
  liveQa: databaseConfig.live_qa || false,
  audioOnly: databaseConfig.audio_only || false,
  meetingRecording: databaseConfig.meeting_recording || false,
  staticSlideDocId: nullToUndefined(databaseConfig.static_slide_doc_id),
  displayDocsDocId: nullToUndefined(databaseConfig.display_docs_doc_id),
  isConfirmed: databaseConfig.is_confirmed || false,
  logisticsCallDate: nullToUndefined(databaseConfig.logistics_call_date),
  logisticsCallNotes: nullToUndefined(databaseConfig.logistics_call_notes),
  logisticsCallScheduled: databaseConfig.logistics_call_scheduled || false,
  dryRunDate: nullToUndefined(databaseConfig.dry_run_date),
  dryRunNotes: nullToUndefined(databaseConfig.dry_run_notes),
  dryRunScheduled: databaseConfig.dry_run_scheduled || false,
  dsmEnabled: databaseConfig.dsm_enabled ?? true,
  ioeEnabled: databaseConfig.ioe_enabled ?? true,
  dsmProducerName: nullToUndefined(databaseConfig.dsm_producer_name),
  dsmProducerEmail: nullToUndefined(databaseConfig.dsm_producer_email),
  inspectorName: nullToUndefined(databaseConfig.inspector_name),
  inspectorEmail: nullToUndefined(databaseConfig.inspector_email),
  speakerListDocId: nullToUndefined(databaseConfig.speaker_list_doc_id),
  guestLinkRegistrationDocId: nullToUndefined(
    databaseConfig.guest_link_registration_doc_id
  ),
  createdAt: nullToUndefined(databaseConfig.created_at),
  updatedAt: nullToUndefined(databaseConfig.updated_at),
});

// Transform camelCase API fields to snake_case database fields
export const transformToDSMConfigInsert = (
  config: Partial<DSMConfig>,
  meetingId: string
): DSMConfigInsert => ({
  id: config.id || randomUUID(),
  meeting_id: meetingId,
  live_qa: config.liveQa,
  audio_only: config.audioOnly,
  meeting_recording: config.meetingRecording,
  static_slide_doc_id: config.staticSlideDocId,
  display_docs_doc_id: config.displayDocsDocId,
  is_confirmed: config.isConfirmed,
  logistics_call_date: config.logisticsCallDate,
  logistics_call_notes: config.logisticsCallNotes,
  logistics_call_scheduled: config.logisticsCallScheduled,
  dry_run_date: config.dryRunDate,
  dry_run_notes: config.dryRunNotes,
  dry_run_scheduled: config.dryRunScheduled,
  dsm_enabled: config.dsmEnabled,
  ioe_enabled: config.ioeEnabled,
  dsm_producer_name: config.dsmProducerName,
  dsm_producer_email: config.dsmProducerEmail,
  inspector_name: config.inspectorName,
  inspector_email: config.inspectorEmail,
  speaker_list_doc_id: config.speakerListDocId,
  guest_link_registration_doc_id: config.guestLinkRegistrationDocId,
});
/* eslint-enable @typescript-eslint/strict-boolean-expressions */

// PGRST116 = no rows returned
const noRowsErrorCode = "PGRST116";

// See the note above transformDSMConfig about the ignored-schema
// type-resolution gap affecting `Database` row fields.
/* eslint-disable @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-redundant-type-constituents */
export const getDSMConfig = async (
  meetingId: string
): Promise<ApiResponse<DSMConfig>> => {
  let outcome: {
    data: DSMConfigRow | null;
    error: { message: string; code?: string } | null;
  };
  try {
    outcome = await supabase
      .from("dsm_config")
      .select("*")
      .eq("meeting_id", meetingId)
      .single();
  } catch (caughtError) {
    return {
      error: {
        message: Error.isError(caughtError)
          ? caughtError.message
          : "Failed to fetch DSM config",
      },
    };
  }

  if (outcome.error !== null && outcome.error.code !== noRowsErrorCode) {
    return { error: { message: outcome.error.message } };
  }

  if (outcome.data === null) {
    // Return default config if none exists
    return {
      data: {
        meetingId,
        liveQa: false,
        audioOnly: false,
        meetingRecording: false,
        isConfirmed: false,
      } as DSMConfig,
    };
  }

  return { data: transformDSMConfig(outcome.data) };
};
/* eslint-enable @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-redundant-type-constituents */

// Runs a Supabase operation with the try/catch isolated to this one spot, so
// callers can branch on the outcome without nesting a conditional inside
// their own try block (unicorn/try-complexity flags any branch inside try).
type QueryOutcome<T> = { ok: true; data: T } | { ok: false; message: string };

const runQuery = async <T>(
  operation: () => Promise<{
    data: T | null;
    error: { message: string } | null;
  }>,
  fallbackMessage: string
): Promise<QueryOutcome<T>> => {
  let outcome: { data: T | null; error: { message: string } | null };
  try {
    outcome = await operation();
  } catch (caughtError) {
    return {
      ok: false,
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
      message: Error.isError(caughtError)
        ? caughtError.message
        : fallbackMessage,
    };
  }

  if (outcome.error !== null) {
    return { ok: false, message: outcome.error.message };
  }
  if (outcome.data === null) {
    return { ok: false, message: fallbackMessage };
  }
  return { ok: true, data: outcome.data };
};

export const createOrUpdateDSMConfig = async (
  meetingId: string,
  config: Partial<DSMConfig>
): Promise<ApiResponse<DSMConfig>> => {
  const databaseRecord = transformToDSMConfigInsert(config, meetingId);

  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("dsm_config")
      .upsert(databaseRecord, { onConflict: "meeting_id" })
      .select()
      .single();
    return { data, error };
  }, "Failed to save DSM config");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformDSMConfig(result.data) };
};

export const updateDSMConfig = async (
  meetingId: string,
  config: Partial<DSMConfig>
): Promise<ApiResponse<DSMConfig>> => {
  const databaseRecord = transformToDSMConfigInsert(config, meetingId);

  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("dsm_config")
      .update(databaseRecord)
      .eq("meeting_id", meetingId)
      .select()
      .single();
    return { data, error };
  }, "Failed to update DSM config");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformDSMConfig(result.data) };
};
