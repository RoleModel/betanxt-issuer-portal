import type { NextRequest } from "next/server";

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import type { TabulationReportProposal } from "@/emails/types";
import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { getEmailService } from "@/lib/email/EmailService";
import { handleCors, withCors } from "@/utils/cors";
import { supabase } from "@/utils/supabase/client";

type TabulationDistribution = components["schemas"]["TabulationDistribution"];
type MeetingRow = Database["public"]["Tables"]["meeting"]["Row"];
type TabulationDistributeResult = components["schemas"]["TabulationDistributeResult"];
type TabulationDistributeMeetingResult = components["schemas"]["TabulationDistributeMeetingResult"];

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
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
  return lastSentAt.slice(0, 10) === todayUtc();
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

async function getUsersForTicker(ticker: string): Promise<string[]> {
  const { data } = await supabase
    .from("notification")
    .select("user_id")
    .ilike("action_url", `%/${ticker}/%`);

  if (!data) return [];
  const ids = data.map((r) => r.user_id).filter((id): id is string => Boolean(id));
  return [...new Set(ids)];
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
  meetingTotalSharesOutstanding: number | null | undefined,
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

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const results: TabulationDistributeMeetingResult[] = [];
  const today = todayUtc();

  try {
    let query = supabase
      .from("meeting")
      .select(
        "id, ticker, meeting_date, tabulation_distribution, title, meeting_type, total_shares_outstanding, quorum_requirement",
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

      const userIds = await getUsersForTicker(ticker);

      const daysUntil = Math.ceil(
        (new Date(meetingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const actionUrl = `/${ticker}/meeting/${meetingId}/tabulation`;
      const notificationRows = userIds.map((userId) => ({
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
      if (notificationRows.length > 0) {
        const { error: insertError } = await supabase.from("notification").insert(notificationRows);
        if (!insertError) notificationsCreated = notificationRows.length;
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

export function OPTIONS() {
  return handleCors();
}
