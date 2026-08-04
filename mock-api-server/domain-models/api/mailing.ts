import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";

// Use generated types from OpenAPI schema
type Mailing = components["schemas"]["Mailing"];
type MailingRow = Database["public"]["Tables"]["mailing"]["Row"];

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

// Transform snake_case database fields to camelCase API fields
function transformMailing(databaseMailing: MailingRow): Mailing {
  return {
    id: nullToUndefined(databaseMailing.id),
    meetingId: nullToUndefined(databaseMailing.meeting_id),
    ticker: nullToUndefined(databaseMailing.ticker),
    totalAccounts: nullToUndefined(databaseMailing.total_accounts),
    totalPositions: nullToUndefined(databaseMailing.total_positions),
    totalRetransmissions: nullToUndefined(
      databaseMailing.total_retransmissions
    ),
    totalRollups: nullToUndefined(databaseMailing.total_rollups),
    fullsetMailPositions: nullToUndefined(
      databaseMailing.fullset_mail_positions
    ),
    naaMailPositions: nullToUndefined(databaseMailing.naa_mail_positions),
    courtesyOtherMailPositions: nullToUndefined(
      databaseMailing.courtesy_other_mail_positions
    ),
    electronicSuppressedPositions: nullToUndefined(
      databaseMailing.electronic_suppressed_positions
    ),
    householdSuppressedPositions: nullToUndefined(
      databaseMailing.household_suppressed_positions
    ),
    managedSuppressedPositions: nullToUndefined(
      databaseMailing.managed_suppressed_positions
    ),
    consolidatedSuppressedPositions: nullToUndefined(
      databaseMailing.consolidated_suppressed_positions
    ),
    canceledSuppressedPositions: nullToUndefined(
      databaseMailing.canceled_suppressed_positions
    ),
    createdAt: nullToUndefined(databaseMailing.created_at),
    updatedAt: nullToUndefined(databaseMailing.updated_at),
  };
}

export async function getMailingByMeetingId(
  meetingId: string
): Promise<ApiResponse<Mailing>> {
  try {
    const { data, error } = await supabase
      .from("mailing")
      .select("*")
      .eq("meeting_id", meetingId)
      .maybeSingle();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to fetch mailing data" },
      };
    }

    if (!data) {
      return {
        error: { message: "Mailing data not found", statusCode: 404 },
      };
    }

    return {
      data: transformMailing(data),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to fetch mailing data",
      },
    };
  }
}
