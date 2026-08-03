import { NextResponse } from "next/server";

import {
  configureDistributionFlag,
  enableCsmTabulationApprovalFlag,
  enableTabulationTrackerColorsFlag,
  enableNoboFlag,
} from "@/flags";

/**
 * Exposes server-evaluated Vercel Flags to the client-rendered app.
 * The portal is fully client-side, so client components read flag values
 * through this endpoint (via `useFeatureFlags`) instead of evaluating
 * flags directly.
 */
export async function GET() {
  const [
    enableNobo,
    configureDistribution,
    enableTabulationTrackerColors,
    enableCsmTabulationApproval,
  ] = await Promise.all([
    enableNoboFlag(),
    configureDistributionFlag(),
    enableTabulationTrackerColorsFlag(),
    enableCsmTabulationApprovalFlag(),
  ]);

  return NextResponse.json({
    configureDistribution,
    enableTabulationTrackerColors,
    enableNobo,
    enableCsmTabulationApproval,
  });
}
