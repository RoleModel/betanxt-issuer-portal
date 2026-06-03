import type { NextRequest } from "next/server";

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import type { TabulationReportProposal } from "@/emails/types";
import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { getEmailService } from "@/lib/email/EmailService";
import { handleCors, withCors } from "@/utils/cors";
import { resolveNotificationUserId } from "@/utils/resolveNotificationUser";
import { supabase } from "@/utils/supabase/client";

export const runtime = "nodejs";

type TabulationDistribution = components["schemas"]["TabulationDistribution"];
type MeetingRow = Database["public"]["Tables"]["meeting"]["Row"];
type NotificationInsert = Database["public"]["Tables"]["notification"]["Insert"];
type TabulationDistributeResult = components["schemas"]["TabulationDistributeResult"];
type TabulationDistributeMeetingResult = components["schemas"]["TabulationDistributeMeetingResult"];

const DISTRIBUTION_TIME_ZONE = "America/Chicago";
const SCHEDULED_DISTRIBUTION_HOUR = 8;

function getDistributionDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISTRIBUTION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

function getDistributionHour(date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: DISTRIBUTION_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = hour.find((part) => part.type === "hour")?.value;
  return value ? Number(value) : -1;
}

function isScheduledDistributionHour(): boolean {
  return getDistributionHour() === SCHEDULED_DISTRIBUTION_HOUR;
}

function isInWindow(meetingDateStr: string, startOffsetDays: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const meetingDate = new Date(meetingDateStr);
  meetingDate.setHours(0, 0, 0, 0);
  const windowStart = new Date(meetingDate);
  windowStart.setDate(meetingDate.getDate() - startOffsetDays);
  return today >= windowStart && today <= meetingDate;
}

function alreadySentToday(lastSentAt: string | null | undefined): boolean {
  if (!lastSentAt) return false;
  return getDistributionDate(new Date(lastSentAt)) === getDistributionDate();
}

function parseDist(raw: MeetingRow["tabulation_distribution"]): TabulationDistribution | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  return {
    enabled: Boolean(obj.enabled),
    startOffsetDays: typeof obj.startOffsetDays === "number" ? obj.startOffsetDays : 15,
    recipients: Array.isArray(obj.recipients) ? (obj.recipients as string[]) : [],
    lastSentAt: typeof obj.lastSentAt === "string" ? obj.lastSentAt : null,
    nextScheduledAt: typeof obj.nextScheduledAt === "string" ? obj.nextScheduledAt : null,
  };
}

async function getNotificationUserIds(
  meeting: Pick<MeetingRow, "client_id" | "ticker">,
  requestingUserId?: string,
  requestingUsername?: string,
): Promise<string[]> {
  const ids = new Set<string>();

  const resolvedRequesterId = await resolveNotificationUserId(requestingUserId, requestingUsername);
  if (resolvedRequesterId) ids.add(resolvedRequesterId);

  const clientId = meeting.client_id;

  try {
    let resolvedClientId = clientId;
    if (!resolvedClientId && meeting.ticker) {
      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("ticker", meeting.ticker)
        .limit(1)
        .single();
      resolvedClientId = clientData?.id ?? null;
    }

    if (resolvedClientId) {
      const { data: accounts } = await supabase
        .from("account")
        .select("id, primary_contact")
        .eq("client_id", resolvedClientId);

      const accountIds = (accounts ?? []).map((a) => a.id).filter(Boolean) as string[];
      for (const account of accounts ?? []) {
        if (account.primary_contact) ids.add(account.primary_contact);
      }

      if (accountIds.length > 0) {
        const { data: users } = await supabase
          .from("user")
          .select("id")
          .in("account_id", accountIds);

        for (const u of users ?? []) {
          if (u.id) ids.add(u.id);
        }
      }
    }
  } catch {
    // Non-fatal — requestingUserId still ensures the triggering user is notified
  }

  return [...ids];
}

interface MeetingEmailData {
  proposals: TabulationReportProposal[];
  totalSharesEligible: number;
  totalSharesVoted: number;
  quorumRequired: number;
  quorumMet: boolean;
}

async function getMeetingEmailData(
  meetingId: string,
  meetingTotalSharesOutstanding: number | string | null | undefined,
  meetingQuorumRequirement: number | null | undefined,
): Promise<MeetingEmailData> {
  const { data: rows } = await supabase
    .from("proposal")
    .select(
      "proposal_number, proposal_title, total_shares_eligible, total_votes_for, total_votes_against, total_votes_abstain",
    )
    .eq("meeting_id", meetingId)
    .order("proposal_number", { ascending: true });

  const proposals: TabulationReportProposal[] = (rows ?? []).map((r) => {
    const eligible = r.total_shares_eligible ?? 0;
    const votesFor = r.total_votes_for ?? 0;
    const votesAgainst = r.total_votes_against ?? 0;
    const votesAbstain = r.total_votes_abstain ?? 0;
    const votesNotCast = Math.max(0, eligible - votesFor - votesAgainst - votesAbstain);
    return {
      number: String(r.proposal_number ?? ""),
      title: r.proposal_title ?? `Proposal ${r.proposal_number ?? ""}`,
      totalShares: eligible,
      votesFor,
      votesAgainst,
      votesAbstain,
      votesNotCast,
    };
  });

  const totalSharesEligible = Number(meetingTotalSharesOutstanding ?? 0);
  const quorumRequired = Number(meetingQuorumRequirement ?? 50);

  // Total voted = sum of for+against+abstain across all proposals (use first proposal's
  // eligible shares as the basis if we have no meeting-level breakdown)
  const totalSharesVoted =
    proposals.length > 0
      ? proposals.reduce((sum, p) => sum + p.votesFor + p.votesAgainst + p.votesAbstain, 0) /
        proposals.length
      : 0;

  const quorumMet =
    totalSharesEligible > 0
      ? (totalSharesVoted / totalSharesEligible) * 100 >= quorumRequired
      : false;

  return {
    proposals,
    totalSharesEligible,
    totalSharesVoted: Math.round(totalSharesVoted),
    quorumRequired,
    quorumMet,
  };
}

async function handleDistribute(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }
  }

  // force=true bypasses window and already-sent checks (for manual testing from the drawer)
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";
  const forceMeetingId = url.searchParams.get("meetingId");
  const requestingUserId = url.searchParams.get("userId") ?? undefined;
  const requestingUsername = url.searchParams.get("username") ?? undefined;

  const results: TabulationDistributeMeetingResult[] = [];
  const today = getDistributionDate();

  if (!force && !isScheduledDistributionHour()) {
    return withCors(
      NextResponse.json({
        ok: true,
        date: today,
        processed: 0,
        skipped: 0,
        results,
        message: `Scheduled distribution only runs at ${SCHEDULED_DISTRIBUTION_HOUR}:00 ${DISTRIBUTION_TIME_ZONE}`,
      }),
    );
  }

  try {
    let query = supabase
      .from("meeting")
      .select(
        "id, ticker, client_id, meeting_date, tabulation_distribution, title, meeting_type, total_shares_outstanding, quorum_requirement",
      );

    if (forceMeetingId) query = query.eq("id", forceMeetingId);

    const { data: meetings, error: meetingsError } = await query;

    if (meetingsError) {
      return withCors(
        NextResponse.json(
          { error: "Failed to fetch meetings", message: meetingsError.message },
          { status: 500 },
        ),
      );
    }

    for (const meeting of meetings ?? []) {
      const meetingId = meeting.id ?? "";
      const ticker = meeting.ticker ?? "";
      const dist = parseDist(meeting.tabulation_distribution);

      if (!dist?.enabled) {
        results.push({
          meetingId,
          ticker,
          notificationsCreated: 0,
          emailsSent: 0,
          emailRecipients: [],
          skipped: "distribution disabled",
        });
        continue;
      }

      const meetingDate = meeting.meeting_date ?? "";
      const offsetDays = dist.startOffsetDays ?? 15;

      if (!force && !isInWindow(meetingDate, offsetDays)) {
        results.push({
          meetingId,
          ticker,
          notificationsCreated: 0,
          emailsSent: 0,
          emailRecipients: [],
          skipped: "outside distribution window",
        });
        continue;
      }

      if (!force && alreadySentToday(dist.lastSentAt)) {
        results.push({
          meetingId,
          ticker,
          notificationsCreated: 0,
          emailsSent: 0,
          emailRecipients: [],
          skipped: "already sent today",
        });
        continue;
      }

      const userIds = await getNotificationUserIds(meeting, requestingUserId, requestingUsername);

      const daysUntil = Math.ceil(
        (new Date(meetingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const actionUrl = `/${ticker}/meeting/${meetingId}/tabulation`;
      const notificationRows: NotificationInsert[] = userIds.map((userId) => ({
        id: randomUUID(),
        user_id: userId,
        meeting_id: meetingId,
        title: "Daily Tabulation Report Available",
        message: `Today's tabulation report for ${meeting.title ?? ticker} is ready. ${daysUntil} day${daysUntil !== 1 ? "s" : ""} until the meeting.`,
        type: "info" as const,
        priority: "medium" as const,
        action_url: actionUrl,
        read: false,
        created_at: new Date().toISOString(),
      }));

      let notificationsCreated = 0;
      let notificationError: string | undefined;
      if (notificationRows.length > 0) {
        const { error: insertError } = await supabase.from("notification").insert(notificationRows);
        if (!insertError) {
          notificationsCreated = notificationRows.length;
        } else {
          notificationError = insertError.message;
        }
      }

      const recipients = dist.recipients ?? [];
      let emailsSent = 0;

      if (recipients.length > 0) {
        try {
          const emailService = getEmailService();
          const { default: TabulationReportEmail } = await import("@/emails/TabulationReportEmail");
          const React = (await import("react")).default;

          const emailData = await getMeetingEmailData(
            meetingId,
            meeting.total_shares_outstanding,
            meeting.quorum_requirement,
          );

          await emailService.send({
            to: recipients,
            subject: `Daily Tabulation Report — ${meeting.title ?? ticker} (${daysUntil}d until meeting)`,
            react: React.createElement(TabulationReportEmail, {
              companyName: meeting.title ?? ticker,
              meetingType: meeting.meeting_type ?? "Annual Meeting",
              meetingDate,
              reportDate: today,
              daysUntilMeeting: daysUntil,
              recipientName: "Issuer Team",
              proposals: emailData.proposals,
              totalSharesEligible: emailData.totalSharesEligible,
              totalSharesVoted: emailData.totalSharesVoted,
              quorumRequired: emailData.quorumRequired,
              quorumMet: emailData.quorumMet,
              viewTabulationUrl: `${process.env.PORTAL_BASE_URL ?? "http://localhost:3000"}${actionUrl}`,
              portalBaseUrl: process.env.PORTAL_BASE_URL ?? "http://localhost:3000",
            }),
          });
          emailsSent = recipients.length;
        } catch (emailError) {
          console.error(`[tabulation-distribute] Email failed for ${meetingId}:`, emailError);
        }
      }

      const updatedDist: TabulationDistribution = { ...dist, lastSentAt: new Date().toISOString() };
      await supabase
        .from("meeting")
        .update({ tabulation_distribution: JSON.parse(JSON.stringify(updatedDist)) })
        .eq("id", meetingId);

      results.push({
        meetingId,
        ticker,
        notificationsCreated,
        emailsSent,
        emailRecipients: recipients,
        ...(notificationError
          ? { skipped: `notification insert failed: ${notificationError}` }
          : {}),
      });
    }

    const response: TabulationDistributeResult = {
      ok: true,
      date: today,
      processed: results.filter((r) => !r.skipped).length,
      skipped: results.filter((r) => r.skipped).length,
      results,
    };

    return withCors(NextResponse.json(response));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      ),
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleDistribute(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleDistribute(request);
}

export function OPTIONS() {
  return handleCors();
}
