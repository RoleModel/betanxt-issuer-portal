import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { syncTabulationReportTotalShares } from "@/domain-models/api/tabulationReports";
import { supabase } from "@/utils/supabase/client";

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

type MeetingRow = Database["public"]["Tables"]["meeting"]["Row"] & {
  cutoff_date?: string | null;
};
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type MeetingUpdate = Database["public"]["Tables"]["meeting"]["Update"];
type MeetingRowWithRelations = Omit<MeetingRow, "client"> & {
  client?: ClientRow | Meeting["client"] | string | null;
};

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

// Transform raw Supabase client row (snake_case) to the camelCase OpenAPI shape.
// The `clients` secondary query returns snake_case keys; this ensures the API
// response always matches the `Clients` schema regardless of how the data arrived.
// `enabledFeatures` accepts either key style and is narrowed to the feature-flag
// union, which now includes "nobo" for Engage-enabled clients
// (002-tabulation-enhancements); when neither key holds an array it defaults to
// every feature except "nobo".
function transformClientSummary(raw: unknown): Meeting["client"] {
  if (typeof raw !== "object" || raw === null) {
    return undefined;
  }
  const c = raw as Record<string, unknown>;
  const isActive = c.isActive ?? c.is_active;

  return {
    id: typeof c.id === "string" ? c.id : undefined,
    ticker: typeof c.ticker === "string" ? c.ticker : undefined,
    companyName:
      typeof c.companyName === "string"
        ? c.companyName
        : typeof c.company_name === "string"
          ? c.company_name
          : undefined,
    shortName:
      typeof c.shortName === "string"
        ? c.shortName
        : typeof c.short_name === "string"
          ? c.short_name
          : undefined,
    industry: typeof c.industry === "string" ? c.industry : null,
    description: typeof c.description === "string" ? c.description : null,
    website: typeof c.website === "string" ? c.website : null,
    primaryContact:
      typeof c.primaryContact === "string"
        ? c.primaryContact
        : typeof c.primary_contact === "string"
          ? c.primary_contact
          : null,
    primaryContactEmail:
      typeof c.primaryContactEmail === "string"
        ? c.primaryContactEmail
        : typeof c.primary_contact_email === "string"
          ? c.primary_contact_email
          : null,
    isActive: typeof isActive === "boolean" ? isActive : true,
    brandingId:
      typeof c.brandingId === "number"
        ? c.brandingId
        : typeof c.branding_id === "number"
          ? c.branding_id
          : null,
    enabledFeatures: Array.isArray(c.enabledFeatures)
      ? (c.enabledFeatures as (
          | "documents"
          | "mailing"
          | "tabulation"
          | "reports"
          | "fileTransfer"
          | "agenda"
          | "nobo"
        )[])
      : Array.isArray(c.enabled_features)
        ? (c.enabled_features as (
            | "documents"
            | "mailing"
            | "tabulation"
            | "reports"
            | "fileTransfer"
            | "agenda"
            | "nobo"
          )[])
        : [
            "documents",
            "mailing",
            "tabulation",
            "reports",
            "fileTransfer",
            "agenda",
          ],
    createdAt: typeof c.createdAt === "string" ? c.createdAt : undefined,
    updatedAt: typeof c.updatedAt === "string" ? c.updatedAt : undefined,
  };
}

// Transform snake_case database fields to camelCase API fields
function transformMeeting(databaseMeeting: MeetingRowWithRelations): Meeting {
  return {
    id: nullToUndefined(databaseMeeting.id),
    title: nullToUndefined(databaseMeeting.title),
    cusip: nullToUndefined(databaseMeeting.cusip),
    ticker: nullToUndefined(databaseMeeting.ticker),
    preFilingDate: nullToUndefined(databaseMeeting.pre_filing_date),
    filingDate: nullToUndefined(databaseMeeting.filing_date),
    brokerSearchDate: nullToUndefined(databaseMeeting.broker_search_date),
    recordDate: nullToUndefined(databaseMeeting.record_date),
    mailingDate: nullToUndefined(databaseMeeting.mailing_date),
    meetingDate: nullToUndefined(databaseMeeting.meeting_date),
    cutoffDate: nullToUndefined(databaseMeeting.cutoff_date),
    meetingType: nullToUndefined(databaseMeeting.meeting_type),
    meetingYear: nullToUndefined(databaseMeeting.meeting_year),
    status: nullToUndefined(databaseMeeting.status) as
      "ACTIVE" | "COMPLETE" | "ADJOURNED" | undefined,
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
  };
}

function parseTabulationDistribution(
  raw: Database["public"]["Tables"]["meeting"]["Row"]["tabulation_distribution"]
): components["schemas"]["TabulationDistribution"] | undefined {
  if (raw === null || raw === undefined) {
    return undefined;
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const d = raw as Record<string, unknown>;
  return {
    enabled: typeof d.enabled === "boolean" ? d.enabled : false,
    startOffsetDays:
      typeof d.startOffsetDays === "number" ? d.startOffsetDays : 15,
    recipients: Array.isArray(d.recipients) ? (d.recipients as string[]) : [],
    lastSentAt: typeof d.lastSentAt === "string" ? d.lastSentAt : null,
    nextScheduledAt:
      typeof d.nextScheduledAt === "string" ? d.nextScheduledAt : null,
  };
}

export async function listMeetings(
  page?: number,
  limit?: number,
  filters?: {
    clientId?: string;
    status?: components["schemas"]["MeetingStatus"];
    meetingYear?: number;
    cusip?: string;
    ticker?: string;
  }
): Promise<
  ApiResponse<{
    meetings?: Meeting[];
    pagination?: components["schemas"]["Pagination"];
  }>
> {
  try {
    // Explicit, stable ordering is required for range-based pagination to be
    // deterministic. Without it, PostgREST range queries can return inconsistent
    // row counts (notably an exact page size of 100 collapsing to a single row).
    let query = supabase
      .from("meeting")
      .select("*", { count: "exact" })
      .order("meeting_date", { ascending: false })
      .order("id", { ascending: true });

    // Apply filters
    if (filters?.clientId) {
      query = query.eq("client_id", filters.clientId);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.ticker) {
      query = query.eq("ticker", filters.ticker);
    }
    if (filters?.cusip) {
      query = query.eq("cusip", filters.cusip);
    }
    if (filters?.meetingYear) {
      const startDate = `${filters.meetingYear}-01-01`;
      const endDate = `${filters.meetingYear}-12-31`;
      query = query.gte("meeting_date", startDate).lte("meeting_date", endDate);
    }

    // PostgREST returns empty results when range length is exactly 250.
    const safeLimit =
      limit === undefined ? undefined : Math.min(Math.max(limit, 1), 249);

    // Apply pagination
    if (page && safeLimit) {
      const from = (page - 1) * safeLimit;
      const to = from + safeLimit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      return {
        error: { message: error.message ?? "Failed to fetch meetings" },
      };
    }

    const rows = data ?? [];

    // Fetch client data for all unique client_ids and attach manually.
    // A direct FK join is not available because the schema has no FK constraints.
    const uniqueClientIds = [
      ...new Set(
        rows
          .map((row) => row.client_id)
          .filter(
            (clientId): clientId is string => typeof clientId === "string"
          )
      ),
    ];
    const clientMap = new Map<string, ClientRow>();

    if (uniqueClientIds.length > 0) {
      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .in("id", uniqueClientIds);

      for (const c of clientsData ?? []) {
        if (c.id) {
          clientMap.set(c.id, c);
        }
      }
    }

    const meetings = rows.map((row) => {
      const client = row.client_id ? clientMap.get(row.client_id) : undefined;
      return transformMeeting({ ...row, client: client ?? null });
    });

    return {
      data: {
        meetings,
        pagination: {
          page: page || 1,
          limit: safeLimit ?? limit ?? meetings.length,
          // Use the exact count from Supabase so pagination loops fetch all pages correctly
          total: count ?? meetings.length,
        },
      },
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to fetch meetings",
      },
    };
  }
}

export async function createMeeting(
  meetingData: CreateMeetingRequest
): Promise<ApiResponse<Meeting>> {
  try {
    // Basic validation for required fields
    if (!meetingData.id || !meetingData.clientId || !meetingData.meetingType) {
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

    const { data, error } = await supabase
      .from("meeting")
      .insert(databaseInsert)
      .select()
      .single();

    if (error) {
      return {
        error: {
          message: error.message ?? "Failed to create meeting",
          statusCode: 400,
        },
      };
    }

    return {
      data: transformMeeting(data),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to create meeting",
      },
    };
  }
}

export async function getMeetingById(
  id: string
): Promise<ApiResponse<Meeting>> {
  try {
    const { data, error } = await supabase
      .from("meeting")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      // Check if it's a not found error
      if (error.code === "PGRST116") {
        return {
          error: { message: "Meeting not found", statusCode: 404 },
        };
      }
      return {
        error: { message: error.message ?? "Failed to fetch meeting" },
      };
    }

    if (!data) {
      return {
        error: { message: "Meeting not found", statusCode: 404 },
      };
    }

    return {
      data: transformMeeting(data),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to fetch meeting",
      },
    };
  }
}

// Legacy functions for backwards compatibility - should be updated to use proper OpenAPI endpoints
export async function getMeetingByIdAndTicker(
  id: string,
  _ticker: string
): Promise<ApiResponse<Meeting>> {
  // Use the standard getMeetingById and filter by ticker in the app layer
  return await getMeetingById(id);
}

export async function updateMeetingByIdAndTicker(
  id: string,
  _ticker: string,
  meetingData: UpdateMeetingRequest
): Promise<ApiResponse<Meeting>> {
  // Use the standard updateMeeting - ticker validation should be handled in API layer
  return await updateMeeting(id, meetingData);
}

export async function deleteMeetingByIdAndTicker(
  id: string,
  _ticker: string
): Promise<ApiResponse<void>> {
  // Use the standard deleteMeeting - ticker validation should be handled in API layer
  return await deleteMeeting(id);
}

// Helper function for backward compatibility - delegates to phases API
export async function getMeetingPhases(
  meetingId: string
): Promise<ApiResponse<Phase[]>> {
  // Import here to avoid circular dependency
  const { listPhases } = await import("./phases");
  return await listPhases(meetingId);
}

export async function updateMeeting(
  id: string,
  meetingData: UpdateMeetingRequest
): Promise<ApiResponse<Meeting>> {
  try {
    // Transform camelCase to snake_case for database
    const databaseUpdate: MeetingUpdate = {};
    if (meetingData.title !== undefined) {
      databaseUpdate.title = meetingData.title;
    }
    if (meetingData.cusip !== undefined) {
      databaseUpdate.cusip = meetingData.cusip;
    }
    if (meetingData.brokerSearchDate !== undefined) {
      databaseUpdate.broker_search_date = meetingData.brokerSearchDate;
    }
    if (meetingData.recordDate !== undefined) {
      databaseUpdate.record_date = meetingData.recordDate;
    }
    if (meetingData.mailingDate !== undefined) {
      databaseUpdate.mailing_date = meetingData.mailingDate;
    }
    if (meetingData.meetingDate !== undefined) {
      databaseUpdate.meeting_date = meetingData.meetingDate;
    }
    if (meetingData.cutoffDate !== undefined) {
      databaseUpdate.cutoff_date = meetingData.cutoffDate;
    }
    if (meetingData.meetingType !== undefined) {
      databaseUpdate.meeting_type = meetingData.meetingType;
    }
    if (meetingData.status !== undefined) {
      databaseUpdate.status = meetingData.status;
    }
    if (meetingData.currentPhase !== undefined) {
      databaseUpdate.current_phase = meetingData.currentPhase;
    }
    if (meetingData.overallCompletion !== undefined) {
      databaseUpdate.overall_completion = meetingData.overallCompletion;
    }
    if (meetingData.distributionType !== undefined) {
      databaseUpdate.distribution_type = meetingData.distributionType;
    }
    if (meetingData.transferAgent !== undefined) {
      databaseUpdate.transfer_agent = meetingData.transferAgent;
    }
    if (meetingData.employeeStockPlans !== undefined) {
      databaseUpdate.employee_stock_plans = meetingData.employeeStockPlans;
    }
    if (meetingData.planAdministrator !== undefined) {
      databaseUpdate.plan_administrator = meetingData.planAdministrator;
    }
    if (meetingData.planAdministratorContact !== undefined) {
      databaseUpdate.plan_administrator_contact =
        meetingData.planAdministratorContact;
    }
    if (meetingData.planAdministratorContactEmail !== undefined) {
      databaseUpdate.plan_administrator_contact_email =
        meetingData.planAdministratorContactEmail;
    }
    if (meetingData.solicitor !== undefined) {
      databaseUpdate.solicitor = meetingData.solicitor;
    }
    if (meetingData.solicitorEmail !== undefined) {
      databaseUpdate.solicitor_email = meetingData.solicitorEmail;
    }
    if (meetingData.ivrDialInNumber !== undefined) {
      databaseUpdate.ivr_dial_in_number = meetingData.ivrDialInNumber;
    }
    if (meetingData.totalSharesOutstanding !== undefined) {
      databaseUpdate.total_shares_outstanding =
        meetingData.totalSharesOutstanding;
    }
    if (meetingData.quorumRequirement !== undefined) {
      databaseUpdate.quorum_requirement = meetingData.quorumRequirement;
    }
    if (meetingData.brokerNonVote !== undefined) {
      databaseUpdate.broker_non_vote = meetingData.brokerNonVote;
    }
    if (meetingData.mailingStatus !== undefined) {
      databaseUpdate.mailing_status = meetingData.mailingStatus;
    }
    if (meetingData.tabulationDistribution !== undefined) {
      databaseUpdate.tabulation_distribution =
        meetingData.tabulationDistribution
          ? JSON.parse(JSON.stringify(meetingData.tabulationDistribution))
          : null;
    }

    const { data, error } = await supabase
      .from("meeting")
      .update(databaseUpdate)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to update meeting" },
      };
    }

    const updated = transformMeeting(data);

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
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to update meeting",
      },
    };
  }
}

export async function deleteMeeting(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase.from("meeting").delete().eq("id", id);

    if (error) {
      return {
        error: { message: error.message ?? "Failed to delete meeting" },
      };
    }

    return {
      data: undefined,
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to delete meeting",
      },
    };
  }
}
