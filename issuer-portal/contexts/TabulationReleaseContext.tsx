"use client";

import type { ReactNode } from "react";

import { createContext, useContext, useMemo } from "react";

import { useMeeting } from "@/contexts/MeetingContext";

interface TabulationReleaseContextValue {
  /**
   * Whether a CSM has released this meeting's tabulation.
   *
   * @remarks
   * False withholds every tabulation surface — the charts, the tables, the
   * dashboard's share counts, the tracker's progress bar and the quorum
   * gauge. Nothing about the meeting's dates changes this: release is a
   * decision a CSM makes, and the "15 days before the meeting" the empty
   * state mentions is when they are expected to make it, not a rule the app
   * applies.
   */
  readonly isReleased: boolean;
}

const TabulationReleaseContext =
  createContext<TabulationReleaseContextValue | null>(null);

/**
 * Publishes one meeting's tabulation release state to everything under it.
 *
 * @remarks
 * Mounted beside {@link TabulationDisplayProvider} at the meeting layout, so
 * the answer survives navigation between a meeting's tabs. It reads rather
 * than owns the flag: a CSM changes it from the events list, and it arrives
 * here as the meeting's `tabulationReleased` field.
 */
export const TabulationReleaseProvider = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const { currentMeeting } = useMeeting();

  // Only a literal true releases. A meeting still loading, or a row that
  // predates the column, reads as withheld rather than flashing the numbers
  // up and then taking them away again.
  const isReleased = currentMeeting?.tabulationReleased === true;

  // React Compiler is deliberately not enabled (see issuer-portal/next.config.ts),
  // so this memo is load-bearing for context consumer stability.
  const value = useMemo<TabulationReleaseContextValue>(
    () => ({ isReleased }),
    [isReleased]
  );

  return (
    <TabulationReleaseContext.Provider value={value}>
      {children}
    </TabulationReleaseContext.Provider>
  );
};

/**
 * Whether tabulation may be shown.
 *
 * @remarks
 * Falls back to withheld rather than throwing when no provider is above it.
 * A component rendered outside the meeting layout — a chart on the reporting
 * page, a card in a drawer — should hide its figures rather than crash, and
 * withholding is the safe direction to fail in.
 */
export const useTabulationRelease = (): TabulationReleaseContextValue => {
  const context = useContext(TabulationReleaseContext);

  return context ?? { isReleased: false };
};
