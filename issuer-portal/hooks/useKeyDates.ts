"use client";

import { useMemo } from "react";

export interface KeyDate {
  id: string;
  title: string;
  date: string | null;
  phaseNumber: number;
}

interface Meeting {
  id: string;
  preFilingDate?: string | null;
  filingDate?: string | null;
  brokerSearchDate?: string | null;
  recordDate?: string | null;
  mailingDate?: string | null;
  meetingDate?: string | null;
}

export const useKeyDates = (meeting: Meeting): KeyDate[] =>
  useMemo(() => {
    const keyDates: KeyDate[] = [];

    // Add meeting-level key dates with phase numbers based on when they typically occur
    if (meeting.preFilingDate) {
      keyDates.push({
        id: `${meeting.id}-prefiling`,
        title: "Pre-Filing Date",
        date: meeting.preFilingDate,
        phaseNumber: 1, // Project Launch & Data Check phase
      });
    }

    if (meeting.brokerSearchDate) {
      keyDates.push({
        id: `${meeting.id}-brokersearch`,
        title: "Broker Search Date",
        date: meeting.brokerSearchDate,
        phaseNumber: 2, // Broker Search phase
      });
    }

    if (meeting.recordDate) {
      keyDates.push({
        id: `${meeting.id}-record`,
        title: "Record Date",
        date: meeting.recordDate,
        phaseNumber: 3, // Approaching Record Date phase
      });
    }

    if (meeting.filingDate) {
      keyDates.push({
        id: `${meeting.id}-filing`,
        title: "Filing Date",
        date: meeting.filingDate,
        phaseNumber: 5, // Pre-Mail Date phase
      });
    }

    if (meeting.mailingDate) {
      keyDates.push({
        id: `${meeting.id}-mailing`,
        title: "Mailing Date",
        date: meeting.mailingDate,
        phaseNumber: 6, // Post Mail Date phase
      });
    }

    if (meeting.meetingDate) {
      keyDates.push({
        id: `${meeting.id}-meeting`,
        title: "Meeting Date",
        date: meeting.meetingDate,
        phaseNumber: 7, // Tabulation Report & Meeting Details phase
      });
    }

    // Sort by date
    return keyDates.sort((a, b) => {
      if (!a.date || !b.date) {
        return 0;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [
    meeting.id,
    meeting.preFilingDate,
    meeting.filingDate,
    meeting.brokerSearchDate,
    meeting.recordDate,
    meeting.mailingDate,
    meeting.meetingDate,
  ]);
