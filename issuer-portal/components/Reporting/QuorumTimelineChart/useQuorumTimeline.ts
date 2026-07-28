"use client";

import { useMemo } from "react";

export type QuorumTimelineDate = Date | string;

export interface QuorumTimelineVote {
  date: QuorumTimelineDate;
  shares: number;
}

export type QuorumMilestoneKind = "mail" | "followUp" | "deadline";

export interface QuorumTimelineMilestoneInput {
  date: QuorumTimelineDate;
  kind: QuorumMilestoneKind;
  label: string;
}

export interface QuorumTimelinePoint {
  cumulativeSharesVoted: number;
  date: Date;
  percentOfOutstanding: number;
}

export interface QuorumTimelineMilestone {
  date: Date;
  kind: QuorumMilestoneKind;
  label: string;
}

export interface UseQuorumTimelineParameters {
  /** Optional start boundary for the chart, such as a mailing date. */
  startDate?: QuorumTimelineDate | null;
  /** Optional end boundary for the chart, such as a meeting or vote deadline. */
  endDate?: QuorumTimelineDate | null;
  /** Total used as the percentage denominator. */
  totalOutstandingShares?: number | null;
  /** Vote records already mapped from the receiving app's data model. */
  votes: QuorumTimelineVote[];
  /** Reference markers already mapped from the receiving app's data model. */
  milestones?: QuorumTimelineMilestoneInput[];
}

export interface QuorumTimelineResult {
  milestones: QuorumTimelineMilestone[];
  points: QuorumTimelinePoint[];
}

const emptyMilestones: QuorumTimelineMilestoneInput[] = [];

const toDate = (value: QuorumTimelineDate | null | undefined): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

export const useQuorumTimeline = ({
  endDate,
  milestones = emptyMilestones,
  startDate,
  totalOutstandingShares = 0,
  votes,
}: UseQuorumTimelineParameters): QuorumTimelineResult =>
  useMemo(() => {
    const parsedStartDate = toDate(startDate);
    const parsedEndDate = toDate(endDate);
    const outstandingShares = totalOutstandingShares ?? 0;
    const totalOutstanding =
      Number.isFinite(outstandingShares) && outstandingShares > 0
        ? outstandingShares
        : 0;

    const sharesByDay = new Map<number, number>();
    for (const vote of votes) {
      const date = toDate(vote.date);
      if (!date || !Number.isFinite(vote.shares) || vote.shares <= 0) {
        continue;
      }

      date.setHours(0, 0, 0, 0);
      const timestamp = date.getTime();
      sharesByDay.set(
        timestamp,
        (sharesByDay.get(timestamp) ?? 0) + vote.shares
      );
    }

    const sortedVotes = [...sharesByDay].sort(
      ([firstTimestamp], [secondTimestamp]) => firstTimestamp - secondTimestamp
    );
    const points: QuorumTimelinePoint[] = [];
    let cumulativeSharesVoted = 0;
    const toPercent = (shares: number): number =>
      totalOutstanding > 0 ? roundToTwo((shares / totalOutstanding) * 100) : 0;

    if (
      parsedStartDate &&
      (sortedVotes.length === 0 ||
        sortedVotes[0][0] > parsedStartDate.getTime())
    ) {
      points.push({
        cumulativeSharesVoted: 0,
        date: parsedStartDate,
        percentOfOutstanding: 0,
      });
    }

    for (const [timestamp, shares] of sortedVotes) {
      cumulativeSharesVoted += shares;
      points.push({
        cumulativeSharesVoted,
        date: new Date(timestamp),
        percentOfOutstanding: toPercent(cumulativeSharesVoted),
      });
    }

    const lastPoint = points.at(-1);
    if (
      parsedEndDate &&
      (!lastPoint || lastPoint.date.getTime() < parsedEndDate.getTime())
    ) {
      points.push({
        cumulativeSharesVoted,
        date: parsedEndDate,
        percentOfOutstanding: toPercent(cumulativeSharesVoted),
      });
    }

    const parsedMilestones = milestones.flatMap((milestone) => {
      const date = toDate(milestone.date);
      if (!date) {
        return [];
      }

      const timestamp = date.getTime();
      const startTimestamp = parsedStartDate?.getTime();
      const endTimestamp = parsedEndDate?.getTime();
      const isBeforeTimeline =
        startTimestamp !== undefined && timestamp < startTimestamp;
      const isAfterTimeline =
        endTimestamp !== undefined && timestamp > endTimestamp;
      return isBeforeTimeline || isAfterTimeline
        ? []
        : [{ ...milestone, date }];
    });

    return { milestones: parsedMilestones, points };
  }, [endDate, milestones, startDate, totalOutstandingShares, votes]);
