import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { handleCors, withCors } from "@/utils/cors";
import { supabase } from "@/utils/supabase/client";

interface RouteParams {
  params: Promise<{ meetingId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { meetingId } = await params;

    const { data, error } = await supabase
      .from("mailing")
      .select("*")
      .eq("meeting_id", meetingId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No mailing data found for this meeting
        return withCors(NextResponse.json(null));
      }
      throw error;
    }

    // Transform snake_case to camelCase for API response
    const response = {
      id: data.id,
      meetingId: data.meeting_id,
      ticker: data.ticker,
      totalAccounts: data.total_accounts,
      totalPositions: data.total_positions,
      totalRetransmissions: data.total_retransmissions,
      totalRollups: data.total_rollups,
      fullsetMailPositions: data.fullset_mail_positions,
      naaMailPositions: data.naa_mail_positions,
      courtesyOtherMailPositions: data.courtesy_other_mail_positions,
      electronicSuppressedPositions: data.electronic_suppressed_positions,
      householdSuppressedPositions: data.household_suppressed_positions,
      managedSuppressedPositions: data.managed_suppressed_positions,
      consolidatedSuppressedPositions: data.consolidated_suppressed_positions,
      canceledSuppressedPositions: data.canceled_suppressed_positions,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return withCors(NextResponse.json(response));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
          operationId: "getMailingStatistics",
        },
        { status: 500 },
      ),
    );
  }
}

// Handle preflight requests
export function OPTIONS() {
  return handleCors();
}
