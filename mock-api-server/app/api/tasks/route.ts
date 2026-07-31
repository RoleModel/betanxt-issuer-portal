import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { listAllTasks } from "@/domain-models/api/tasks";
import { handleCors, withCors } from "@/utils/cors";

const parsePositiveInteger = (raw: string | null, fallback: number): number => {
  if (raw === null) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const limit = parsePositiveInteger(searchParams.get("limit"), 100);

    const meetingIdParameter = searchParams.get("meetingId");
    const meetingIds =
      meetingIdParameter === null
        ? undefined
        : meetingIdParameter
            .split(",")
            .map((value) => value.trim())
            .filter((value) => value.length > 0);

    const status = searchParams.get("status") ?? undefined;
    const dueBefore = searchParams.get("dueBefore") ?? undefined;
    const openOnly = searchParams.get("openOnly") === "true";

    const { data, error } = await listAllTasks({
      page,
      limit,
      meetingIds,
      status,
      dueBefore,
      openOnly,
    });

    if (error) {
      return withCors(
        NextResponse.json(
          { error: error.message },
          { status: error.statusCode ?? 500 }
        )
      );
    }

    return withCors(NextResponse.json(data));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: Error.isError(error) ? error.message : "Unknown error",
          operationId: "listAllTasks",
        },
        { status: 500 }
      )
    );
  }
}

// Handle preflight requests
export function OPTIONS() {
  return handleCors();
}
