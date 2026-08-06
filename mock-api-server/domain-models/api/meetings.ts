import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { syncTabulationReportTotalShares } from "@/domain-models/api/tabulationReports";
import { supabase } from "@/utils/supabase/client";
import {
  asArray,
  asLiteral,
  asRecord,
  getNumber,
  getString,
} from "@/utils/typeUtils";

// Use generated types from OpenAPI schema
type Meeting = components["schemas"]["Meeting"];
type CreateMeetingRequest = components["schemas"]["CreateMeetingRequest"];
type UpdateMeetingRequest = components["schemas"]["UpdateMeetingRequest"];
type Phase = components["schemas"]["Phase"];

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

// `utils/supabase/database.types.ts` and `types/api.ts` are excluded from
// ESLint's typed-linting program, so the linter's own type resolution for
// their fields here falls back to an error type that reads as `any` —
// `tsc --noEmit` has no issue with any of this. `client` below is also a
// genuine 3-member union on purpose: this raw shape can arrive as a
// Supabase row, an already-transformed API client, or a bare string id.
/* eslint-disable @typescript-eslint/no-redundant-type-constituents, sonarjs/max-union-size */
type MeetingRow = Database["public"]["Tables"]["meeting"]["Row"] & {
  cutoff_date?: string | null;
};
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type MeetingUpdate = Database["public"]["Tables"]["meeting"]["Update"];
type MeetingRowWithRelations = Omit<MeetingRow, "client"> & {
  client?: ClientRow | Meeting["client"] | string | null;
};
interface MeetingRowOutcome {
  data: MeetingRow | null;
  error: { message: string; code?: string } | null;
}
/* eslint-enable @typescript-eslint/no-redundant-type-constituents, sonarjs/max-union-size */

// Helper function to convert null to undefined
const nullToUndefined = <T>(value: T | null): T | undefined =>
  value === null ? undefined : value;

const MEETING_STATUSES = ["ACTIVE", "COMPLETE", "ADJOURNED"] as const;

const CLIENT_FEATURES = [
  "documents",
  "mailing",
  "tabulation",
  "reports",
  "fileTransfer",
  "agenda",
  "nobo",
] as const;
type ClientFeature = (typeof CLIENT_FEATURES)[number];
const isClientFeature = (value: unknown): value is ClientFeature =>
  (CLIENT_FEATURES as readonly unknown[]).includes(value);

const DEFAULT_CLIENT_FEATURES: ClientFeature[] = [
  "documents",
  "mailing",
  "tabulation",
  "reports",
  "fileTransfer",
  "agenda",
];

/** Reads the first key present on `obj` whose value is a boolean. */
const getBoolean = (
  object: Record<string, unknown>,
  keys: string[]
): boolean | null => {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return null;
};

/** Reads the first key present on `obj` whose value is a feature array. */
const getFeatureArray = (
  object: Record<string, unknown>,
  keys: string[]
): ClientFeature[] | null => {
  for (const key of keys) {
    const value = object[key];
    if (Array.isArray(value)) {
      return value.filter(isClientFeature);
    }
  }
  return null;
};

/**
 * Transform raw Supabase client row (snake_case) to the camelCase OpenAPI
 * shape. The `clients` secondary query returns snake_case keys; this
 * ensures the API response always matches the `Clients` schema regardless
 * of how the data arrived. `enabledFeatures` accepts either key style and
 * is narrowed to the feature-flag union — which now includes `"nobo"` for
 * Engage-enabled clients (002-tabulation-enhancements) — and defaults to
 * every feature except `"nobo"` when neither key holds an array.
 */
const transformClientSummary = (raw: unknown): Meeting["client"] => {
  const c = asRecord(raw);
  if (c === null) {
    return undefined;
  }

  return {
    id: getString(c, ["id"]) ?? undefined,
    ticker: getString(c, ["ticker"]) ?? undefined,
    companyName: getString(c, ["companyName", "company_name"]) ?? undefined,
    shortName: getString(c, ["shortName", "short_name"]) ?? undefined,
    industry: getString(c, ["industry"]),
    description: getString(c, ["description"]),
    website: getString(c, ["website"]),
    primaryContact: getString(c, ["primaryContact", "primary_contact"]),
    primaryContactEmail: getString(c, [
      "primaryContactEmail",
      "primary_contact_email",
    ]),
    isActive: getBoolean(c, ["isActive", "is_active"]) ?? true,
    brandingId: getNumber(c, ["brandingId", "branding_id"]),
    enabledFeatures:
      getFeatureArray(c, ["enabledFeatures", "enabled_features"]) ??
      DEFAULT_CLIENT_FEATURES,
    createdAt: getString(c, ["createdAt"]) ?? undefined,
    updatedAt: getString(c, ["updatedAt"]) ?? undefined,
  };
};

// See the note above MeetingRow about the ignored-schema type-resolution gap.
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
const parseTabulationDistribution = (
  raw: unknown
): components["schemas"]["TabulationDistribution"] | undefined => {
  /* eslint-enable @typescript-eslint/no-redundant-type-constituents */
  const d = asRecord(raw);
  if (d === null) {
    return undefined;
  }
  return {
    enabled: getBoolean(d, ["enabled"]) ?? false,
    startOffsetDays: getNumber(d, ["startOffsetDays"]) ?? 15,
    recipients: asArray<string>(d.recipients),
    lastSentAt: getString(d, ["lastSentAt"]),
    nextScheduledAt: getString(d, ["nextScheduledAt"]),
  };
};

// Transform snake_case database fields to camelCase API fields
const transformMeeting = (
  databaseMeeting: MeetingRowWithRelations
): Meeting => ({
  id: nullToUndefined(databaseMeeting.id),
  title: nullToUndefined(databaseMeeting.title),
  cusip: nullToUndefined(databaseMeeting.cusip),
  ticker: nullToUndefined(databaseMeeting.ticker),
  setKey: nullToUndefined(databaseMeeting.set_key),
  preFilingDate: nullToUndefined(databaseMeeting.pre_filing_date),
  filingDate: nullToUndefined(databaseMeeting.filing_date),
  brokerSearchDate: nullToUndefined(databaseMeeting.broker_search_date),
  recordDate: nullToUndefined(databaseMeeting.record_date),
  mailingDate: nullToUndefined(databaseMeeting.mailing_date),
  meetingDate: nullToUndefined(databaseMeeting.meeting_date),
  cutoffDate: nullToUndefined(databaseMeeting.cutoff_date),
  meetingType: nullToUndefined(databaseMeeting.meeting_type),
  meetingYear: nullToUndefined(databaseMeeting.meeting_year),
  status: asLiteral(databaseMeeting.status, MEETING_STATUSES),
  currentPhase: nullToUndefined(databaseMeeting.current_phase),
  overallCompletion: nullToUndefined(databaseMeeting.overall_completion),
  distributionType: nullToUndefined(databaseMeeting.distribution_type),
  transferAgent: nullToUndefined(databaseMeeting.transfer_agent),
  transferAgentConfirmed: databaseMeeting.transfer_agent_confirmed,
  employeeStockPlans: nullToUndefined(databaseMeeting.employee_stock_plans),
  planAdministrator: nullToUndefined(databaseMeeting.plan_administrator),
  planAdministratorContact: nullToUndefined(
    databaseMeeting.plan_administrator_contact
  ),
  planAdministratorContactEmail: nullToUndefined(
    databaseMeeting.plan_administrator_contact_email
  ),
  solicitor: nullToUndefined(databaseMeeting.solicitor),
  solicitorEmail: nullToUndefined(databaseMeeting.solicitor_email),
  inspector: nullToUndefined(databaseMeeting.inspector),
  ivrDialInNumber: nullToUndefined(databaseMeeting.ivr_dial_in_number),
  totalSharesOutstanding: nullToUndefined(
    databaseMeeting.total_shares_outstanding
  ),
  quorumRequirement: nullToUndefined(databaseMeeting.quorum_requirement),
  brokerNonVote: nullToUndefined(databaseMeeting.broker_non_vote),
  mailingStatus: nullToUndefined(databaseMeeting.mailing_status),
  tabulationDistribution: parseTabulationDistribution(
    databaseMeeting.tabulation_distribution
  ),
  clientId: nullToUndefined(databaseMeeting.client_id),
  createdAt: nullToUndefined(databaseMeeting.created_at),
  updatedAt: nullToUndefined(databaseMeeting.updated_at),
  client: transformClientSummary(databaseMeeting.client),
});

interface MeetingListFilters {
  clientId?: string;
  status?: components["schemas"]["MeetingStatus"];
  meetingYear?: number;
  cusip?: string;
  ticker?: string;
}

type MeetingQuery = ReturnType<typeof buildBaseMeetingQuery>;

const buildBaseMeetingQuery = () =>
  supabase
    .from("meeting")
    .select("*", { count: "exact" })
    .order("meeting_date", { ascending: false })
    .order("id", { ascending: true });

const applyMeetingFilters = (
  initialQuery: MeetingQuery,
  filters: MeetingListFilters | undefined
): MeetingQuery => {
  let query = initialQuery;
  if (filters?.clientId !== undefined) {
    query = query.eq("client_id", filters.clientId);
  }
  if (filters?.status !== undefined) {
    query = query.eq("status", filters.status);
  }
  if (filters?.ticker !== undefined) {
    query = query.eq("ticker", filters.ticker);
  }
  if (filters?.cusip !== undefined) {
    query = query.eq("cusip", filters.cusip);
  }
  if (filters?.meetingYear !== undefined) {
    const startDate = `${filters.meetingYear}-01-01`;
    const endDate = `${filters.meetingYear}-12-31`;
    query = query.gte("meeting_date", startDate).lte("meeting_date", endDate);
  }
  return query;
};

// Fetches client rows for all unique client_ids and attaches them manually.
// A direct FK join is not available because the schema has no FK constraints.
const buildClientMap = async (
  rows: MeetingRow[]
): Promise<Map<string, ClientRow>> => {
  const uniqueClientIds = [
    ...new Set(
      rows
        .map((row) => row.client_id)
        .filter((clientId): clientId is string => typeof clientId === "string")
    ),
  ];
  const clientMap = new Map<string, ClientRow>();
  if (uniqueClientIds.length === 0) {
    return clientMap;
  }

  const { data: clientsData } = await supabase
    .from("clients")
    .select("*")
    .in("id", uniqueClientIds);

  const clients = clientsData ?? [];
  for (const client of clients) {
    if (client.id !== null) {
      clientMap.set(client.id, client);
    }
  }
  return clientMap;
};

export const listMeetings = async (
  page?: number,
  limit?: number,
  filters?: MeetingListFilters
): Promise<
  ApiResponse<{
    meetings?: Meeting[];
    pagination?: components["schemas"]["Pagination"];
  }>
> => {
  // Explicit, stable ordering is required for range-based pagination to be
  // deterministic. Without it, PostgREST range queries can return inconsistent
  // row counts (notably an exact page size of 100 collapsing to a single row).
  let query = applyMeetingFilters(buildBaseMeetingQuery(), filters);

  // PostgREST returns empty results when range length is exactly 250.
  const safeLimit =
    limit === undefined ? undefined : Math.min(Math.max(limit, 1), 249);
  if (page !== undefined && safeLimit !== undefined) {
    const from = (page - 1) * safeLimit;
    const to = from + safeLimit - 1;
    query = query.range(from, to);
  }

  let outcome: Awaited<typeof query>;
  try {
    outcome = await query;
  } catch (caughtError) {
    return {
      error: {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
        message: Error.isError(caughtError)
          ? caughtError.message
          : "Failed to fetch meetings",
      },
    };
  }

  if (outcome.error !== null) {
    return {
      error: { message: outcome.error.message ?? "Failed to fetch meetings" },
    };
  }

  const rows = outcome.data ?? [];
  const clientMap = await buildClientMap(rows);

  const meetings = rows.map((row) => {
    const client =
      row.client_id === null ? undefined : clientMap.get(row.client_id);
    return transformMeeting({ ...row, client: client ?? null });
  });

  return {
    data: {
      meetings,
      pagination: {
        page: page ?? 1,
        limit: safeLimit ?? limit ?? meetings.length,
        // Use the exact count from Supabase so pagination loops fetch all pages correctly
        total: outcome.count ?? meetings.length,
      },
    },
  };
};

const isBlank = (value: string | undefined): boolean =>
  value === undefined || value === "";

const isMissingRequiredCreateFields = (
  meetingData: CreateMeetingRequest
): boolean =>
  isBlank(meetingData.id) ||
  isBlank(meetingData.clientId) ||
  isBlank(meetingData.meetingType);

export const createMeeting = async (
  meetingData: CreateMeetingRequest
): Promise<ApiResponse<Meeting>> => {
  if (isMissingRequiredCreateFields(meetingData)) {
    return {
      error: {
        message:
          "Missing required fields: id, clientId, and meetingType are required",
        statusCode: 400,
      },
    };
  }

  const databaseInsert: Record<string, unknown> = {
    id: meetingData.id,
    title: meetingData.title,
    cusip: meetingData.cusip,
    ticker: meetingData.ticker,
    set_key: meetingData.setKey,
    meeting_date: meetingData.meetingDate,
    record_date: meetingData.recordDate,
    mailing_date: meetingData.mailingDate,
    cutoff_date: meetingData.cutoffDate ?? null,
    meeting_type: meetingData.meetingType,
    meeting_year: meetingData.meetingYear,
    distribution_type: meetingData.distributionType,
    transfer_agent: meetingData.transferAgent,
    total_shares_outstanding: meetingData.totalSharesOutstanding,
    quorum_requirement: meetingData.quorumRequirement,
    client_id: meetingData.clientId,
    status: "ACTIVE",
    current_phase: "Phase 1",
    overall_completion: 0,
  };
  if (meetingData.solicitor !== undefined) {
    databaseInsert.solicitor = meetingData.solicitor;
  }
  if (meetingData.solicitorEmail !== undefined) {
    databaseInsert.solicitor_email = meetingData.solicitorEmail;
  }
  if (meetingData.transferAgent !== undefined) {
    databaseInsert.transfer_agent = meetingData.transferAgent;
  }
  if (meetingData.employeeStockPlans !== undefined) {
    databaseInsert.employee_stock_plans = meetingData.employeeStockPlans;
  }
  if (meetingData.ivrDialInNumber !== undefined) {
    databaseInsert.ivr_dial_in_number = meetingData.ivrDialInNumber;
  }

  let outcome: MeetingRowOutcome;
  try {
    outcome = await supabase
      .from("meeting")
      .insert(databaseInsert)
      .select()
      .single();
  } catch (caughtError) {
    return {
      error: {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
        message: Error.isError(caughtError)
          ? caughtError.message
          : "Failed to create meeting",
      },
    };
  }

  if (outcome.error !== null) {
    return {
      error: { message: outcome.error.message, statusCode: 400 },
    };
  }
  if (outcome.data === null) {
    return {
      error: { message: "Failed to create meeting", statusCode: 400 },
    };
  }

  return { data: transformMeeting(outcome.data) };
};

export const getMeetingById = async (
  id: string
): Promise<ApiResponse<Meeting>> => {
  let outcome: MeetingRowOutcome;
  try {
    outcome = await supabase.from("meeting").select("*").eq("id", id).single();
  } catch (caughtError) {
    return {
      error: {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
        message: Error.isError(caughtError)
          ? caughtError.message
          : "Failed to fetch meeting",
      },
    };
  }

  if (outcome.error !== null) {
    if (outcome.error.code === "PGRST116") {
      return { error: { message: "Meeting not found", statusCode: 404 } };
    }
    return {
      error: { message: outcome.error.message },
    };
  }
  if (outcome.data === null) {
    return { error: { message: "Meeting not found", statusCode: 404 } };
  }

  return { data: transformMeeting(outcome.data) };
};

// Each entry copies one optional field across only when present. Splitting
// these into individual closures (instead of one long if-chain) keeps this
// function's own cyclomatic/cognitive complexity near the for-loop alone;
// each closure's complexity is trivial (one guard) in isolation.
const buildMeetingUpdateAssigners = (
  meetingData: UpdateMeetingRequest,
  databaseUpdate: MeetingUpdate
): (() => void)[] => [
  () => {
    if (meetingData.title !== undefined) {
      databaseUpdate.title = meetingData.title;
    }
  },
  () => {
    if (meetingData.cusip !== undefined) {
      databaseUpdate.cusip = meetingData.cusip;
    }
  },
  () => {
    if (meetingData.setKey !== undefined) {
      databaseUpdate.set_key = meetingData.setKey;
    }
  },
  () => {
    if (meetingData.brokerSearchDate !== undefined) {
      databaseUpdate.broker_search_date = meetingData.brokerSearchDate;
    }
  },
  () => {
    if (meetingData.recordDate !== undefined) {
      databaseUpdate.record_date = meetingData.recordDate;
    }
  },
  () => {
    if (meetingData.mailingDate !== undefined) {
      databaseUpdate.mailing_date = meetingData.mailingDate;
    }
  },
  () => {
    if (meetingData.meetingDate !== undefined) {
      databaseUpdate.meeting_date = meetingData.meetingDate;
    }
  },
  () => {
    if (meetingData.cutoffDate !== undefined) {
      databaseUpdate.cutoff_date = meetingData.cutoffDate;
    }
  },
  () => {
    if (meetingData.meetingType !== undefined) {
      databaseUpdate.meeting_type = meetingData.meetingType;
    }
  },
  () => {
    if (meetingData.status !== undefined) {
      databaseUpdate.status = meetingData.status;
    }
  },
  () => {
    if (meetingData.currentPhase !== undefined) {
      databaseUpdate.current_phase = meetingData.currentPhase;
    }
  },
  () => {
    if (meetingData.overallCompletion !== undefined) {
      databaseUpdate.overall_completion = meetingData.overallCompletion;
    }
  },
  () => {
    if (meetingData.distributionType !== undefined) {
      databaseUpdate.distribution_type = meetingData.distributionType;
    }
  },
  () => {
    if (meetingData.transferAgent !== undefined) {
      databaseUpdate.transfer_agent = meetingData.transferAgent;
    }
  },
  () => {
    if (meetingData.employeeStockPlans !== undefined) {
      databaseUpdate.employee_stock_plans = meetingData.employeeStockPlans;
    }
  },
  () => {
    if (meetingData.planAdministrator !== undefined) {
      databaseUpdate.plan_administrator = meetingData.planAdministrator;
    }
  },
  () => {
    if (meetingData.planAdministratorContact !== undefined) {
      databaseUpdate.plan_administrator_contact =
        meetingData.planAdministratorContact;
    }
  },
  () => {
    if (meetingData.planAdministratorContactEmail !== undefined) {
      databaseUpdate.plan_administrator_contact_email =
        meetingData.planAdministratorContactEmail;
    }
  },
  () => {
    if (meetingData.solicitor !== undefined) {
      databaseUpdate.solicitor = meetingData.solicitor;
    }
  },
  () => {
    if (meetingData.solicitorEmail !== undefined) {
      databaseUpdate.solicitor_email = meetingData.solicitorEmail;
    }
  },
  () => {
    if (meetingData.ivrDialInNumber !== undefined) {
      databaseUpdate.ivr_dial_in_number = meetingData.ivrDialInNumber;
    }
  },
  () => {
    if (meetingData.totalSharesOutstanding !== undefined) {
      databaseUpdate.total_shares_outstanding =
        meetingData.totalSharesOutstanding;
    }
  },
  () => {
    if (meetingData.quorumRequirement !== undefined) {
      databaseUpdate.quorum_requirement = meetingData.quorumRequirement;
    }
  },
  () => {
    if (meetingData.brokerNonVote !== undefined) {
      databaseUpdate.broker_non_vote = meetingData.brokerNonVote;
    }
  },
  () => {
    if (meetingData.mailingStatus !== undefined) {
      databaseUpdate.mailing_status = meetingData.mailingStatus;
    }
  },
  () => {
    if (meetingData.tabulationDistribution !== undefined) {
      databaseUpdate.tabulation_distribution =
        meetingData.tabulationDistribution === null
          ? null
          : JSON.stringify(meetingData.tabulationDistribution);
    }
  },
];

const buildMeetingUpdate = (
  meetingData: UpdateMeetingRequest
): MeetingUpdate => {
  const databaseUpdate: MeetingUpdate = {};
  for (const assign of buildMeetingUpdateAssigners(
    meetingData,
    databaseUpdate
  )) {
    assign();
  }
  return databaseUpdate;
};

export const updateMeeting = async (
  id: string,
  meetingData: UpdateMeetingRequest
): Promise<ApiResponse<Meeting>> => {
  const databaseUpdate = buildMeetingUpdate(meetingData);

  let outcome: MeetingRowOutcome;
  try {
    outcome = await supabase
      .from("meeting")
      .update(databaseUpdate)
      .eq("id", id)
      .select()
      .single();
  } catch (caughtError) {
    return {
      error: {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
        message: Error.isError(caughtError)
          ? caughtError.message
          : "Failed to update meeting",
      },
    };
  }

  if (outcome.error !== null) {
    return {
      error: { message: outcome.error.message },
    };
  }
  if (outcome.data === null) {
    return { error: { message: "Failed to update meeting" } };
  }

  const updated = transformMeeting(outcome.data);

  // Keep the tabulation report's total-share counts in sync when the CSM
  // edits totalSharesOutstanding so the dashboard reflects it immediately.
  if (
    meetingData.totalSharesOutstanding !== undefined &&
    meetingData.totalSharesOutstanding !== null
  ) {
    await syncTabulationReportTotalShares(
      id,
      Number(meetingData.totalSharesOutstanding)
    );
  }

  return { data: updated };
};

export const deleteMeeting = async (id: string): Promise<ApiResponse<void>> => {
  let outcome: { error: { message: string } | null };
  try {
    outcome = await supabase.from("meeting").delete().eq("id", id);
  } catch (caughtError) {
    return {
      error: {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
        message: Error.isError(caughtError)
          ? caughtError.message
          : "Failed to delete meeting",
      },
    };
  }

  if (outcome.error !== null) {
    return {
      error: { message: outcome.error.message },
    };
  }

  return {};
};

// Legacy functions for backwards compatibility - should be updated to use proper OpenAPI endpoints
export const getMeetingByIdAndTicker = async (
  id: string,
  // Accepted for call-site signature compatibility; ticker filtering happens
  // in the app layer via getMeetingById.
  // eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars
  _ticker: string
): Promise<ApiResponse<Meeting>> => await getMeetingById(id);

export const updateMeetingByIdAndTicker = async (
  id: string,
  _ticker: string,
  meetingData: UpdateMeetingRequest
): Promise<ApiResponse<Meeting>> =>
  // Use the standard updateMeeting - ticker validation should be handled in API layer
  await updateMeeting(id, meetingData);

export const deleteMeetingByIdAndTicker = async (
  id: string,
  // Accepted for call-site signature compatibility; ticker validation
  // should be handled in the API layer.
  // eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars
  _ticker: string
): Promise<ApiResponse<void>> => await deleteMeeting(id);

// Helper function for backward compatibility - delegates to phases API
export const getMeetingPhases = async (
  meetingId: string
): Promise<ApiResponse<Phase[]>> => {
  // Import here to avoid circular dependency. The chunkname directive must
  // stay inline immediately before the import specifier for webpack to read it.
  /* eslint-disable no-inline-comments */
  const { listPhases } = await import(
    /* webpackChunkName: "phases-api" */ "./phases"
  );
  /* eslint-enable no-inline-comments */
  return await listPhases(meetingId);
};
