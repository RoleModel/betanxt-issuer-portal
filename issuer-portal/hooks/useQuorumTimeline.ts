"use client";

/**
 * Cumulative quorum progression timeline for a meeting.
 *
 * Derives a day-by-day series of cumulative shares voted (and percent of
 * outstanding) from voted positions, plus milestone markers for the mail
 * date, follow-up mailings, and the meeting/vote deadline. Backs the Quorum
 * Timeline chart on the Reporting page.
 */
import { useMemo } from "react";

import type { components } from "@/domain-models/generated-schema";

import {
  classifyMailingDistribution,
  computeRecommendedMailByDate,
  mailingDistributionShortLabel,
} from "@/utils/dateUtils";

type Meeting = components["schemas"]["Meeting"];
type Position = components["schemas"]["Position"];

/** One day on the timeline: the running vote total as of that date. */
export interface QuorumTimelinePoint {
  date: Date;
  cumulativeSharesVoted: number;
  /** Cumulative shares voted as a percentage of total shares outstanding, rounded to 2 decimals (0 when outstanding is unknown). */
  percentOfOutstanding: number;
}

/** Milestone marker type: initial mail date, a follow-up mailing, or the meeting/vote deadline. */
export type QuorumMilestoneKind = "mail" | "followUp" | "deadline";

/** A labeled vertical marker rendered on the timeline chart. */
export interface QuorumTimelineMilestone {
  label: string;
  date: Date;
  kind: QuorumMilestoneKind;
}

/** A follow-up mailing supplied by the caller (e.g. from additional mailing records). */
export interface FollowUpMailingInput {
  label: string;
  /** Mailing date string; entries with missing or unparseable dates are dropped. */
  date?: string | null;
}

interface UseQuorumTimelineParams {
  meeting?: Meeting | null;
  positions: Position[];
  followUpMailings?: FollowUpMailingInput[];
}

interface QuorumTimelineResult {
  points: QuorumTimelinePoint[];
  milestones: QuorumTimelineMilestone[];
}

const US_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Parses "MM/dd/yyyy hh:mma" (Position.dateVoted), "MM/dd/yyyy", or "yyyy-MM-dd"
 * (Meeting date fields) into a local-midnight Date; returns null when unparseable.
 */
function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;

  const usMatch = US_DATE_PATTERN.exec(value);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const isoMatch = ISO_DATE_PATTERN.exec(value);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const fallback = new Date(value);
  if (Number.isNaN(fallback.getTime())) return null;
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

function toFiniteNumber(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Builds the quorum timeline series and milestones for a meeting.
 *
 * Voted positions belonging to the meeting are grouped by vote date and
 * accumulated chronologically. The series is anchored at the mail date with a
 * zero point (when voting started later) and extended flat to the deadline
 * (cutoff date, falling back to the meeting date) so the line spans the full
 * solicitation window. Follow-up mailing milestones outside the
 * mail-date–deadline window are excluded.
 *
 * @param meeting - Meeting providing the mail date, deadline, and shares outstanding; empty result while null/undefined
 * @param positions - Positions to aggregate; entries for other meetings or without voted shares are ignored
 * @param followUpMailings - Additional mailing milestones to mark on the chart
 * @returns Chronological cumulative points and milestone markers (both empty when no meeting is loaded)
 */
export function useQuorumTimeline({
  meeting,
  positions,
  followUpMailings = [],
}: UseQuorumTimelineParams): QuorumTimelineResult {
  return useMemo(() => {
    if (!meeting?.id) {
      return { points: [], milestones: [] };
    }

    const meetingDate = parseDateOnly(meeting.meetingDate);
    const distribution = classifyMailingDistribution(meeting.distributionType);
    // The mail date is driven by the distribution rules (N&A = 40 calendar days
    // before the meeting, adjusted off weekends; Full Set = 15 calendar days),
    // falling back to the meeting's stored mailing date when unclassifiable.
    const mailDate =
      meetingDate && distribution
        ? computeRecommendedMailByDate(meetingDate, distribution).date
        : parseDateOnly(meeting.mailingDate);
    // Anchor the end of the timeline on the meeting date so the mail date reads
    // exactly N days ahead of the meeting (e.g. N&A = 40). Fall back to the
    // cutoff date only when the meeting date is unavailable.
    const deadlineDate = meetingDate ?? parseDateOnly(meeting.cutoffDate);
    const totalOutstanding = toFiniteNumber(String(meeting.totalSharesOutstanding ?? ""));

    const milestones: QuorumTimelineMilestone[] = [];
    if (mailDate) {
      const mailLabel = distribution
        ? `Mail Date · ${mailingDistributionShortLabel(distribution)}`
        : "Mail Date";
      milestones.push({ label: mailLabel, date: mailDate, kind: "mail" });
    }

    followUpMailings.forEach((mailing) => {
      const date = parseDateOnly(mailing.date);
      if (!date) return;
      if (mailDate && date.getTime() < mailDate.getTime()) return;
      if (deadlineDate && date.getTime() > deadlineDate.getTime()) return;
      milestones.push({ label: mailing.label, date, kind: "followUp" });
    });
    if (deadlineDate) {
      milestones.push({
        label: "Meeting Date",
        date: deadlineDate,
        kind: "deadline",
      });
    }

    const sharesByDay = new Map<number, number>();
    positions.forEach((position) => {
      if (position.meetingId !== meeting.id) return;
      if (position.voteStatus !== "Voted") return;
      const shares = toFiniteNumber(position.sharesVoted);
      if (shares <= 0) return;
      const date = parseDateOnly(position.dateVoted);
      if (!date) return;
      const key = date.getTime();
      sharesByDay.set(key, (sharesByDay.get(key) ?? 0) + shares);
    });

    const sortedDays = [...sharesByDay.entries()].sort((a, b) => a[0] - b[0]);

    const points: QuorumTimelinePoint[] = [];
    let cumulative = 0;

    const toPercent = (shares: number): number =>
      totalOutstanding > 0 ? roundToTwo((shares / totalOutstanding) * 100) : 0;

    if (mailDate && (sortedDays.length === 0 || sortedDays[0][0] > mailDate.getTime())) {
      points.push({ date: mailDate, cumulativeSharesVoted: 0, percentOfOutstanding: 0 });
    }

    sortedDays.forEach(([time, shares]) => {
      cumulative += shares;
      points.push({
        date: new Date(time),
        cumulativeSharesVoted: cumulative,
        percentOfOutstanding: toPercent(cumulative),
      });
    });

    const lastPoint = points[points.length - 1];
    if (deadlineDate && (!lastPoint || lastPoint.date.getTime() < deadlineDate.getTime())) {
      points.push({
        date: deadlineDate,
        cumulativeSharesVoted: cumulative,
        percentOfOutstanding: toPercent(cumulative),
      });
    }

    return { points, milestones };
  }, [meeting, positions, followUpMailings]);
}
