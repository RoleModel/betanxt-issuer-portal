/* eslint-disable unicorn/filename-case -- The `Navigation` directory name is intentional and shared by the rest of the app; renaming it is out of scope for lint cleanup. */
import type { NavigationTab } from "./types";

const buildNavigationTabs = (currentPhase: number): NavigationTab[] => [
  {
    featureGate: null,
    label: "Meeting Dashboard",
    route: `/dashboard/${currentPhase}`,
  },
  { featureGate: "agenda", label: "Agenda", route: "/agenda" },
  { featureGate: "mailing", label: "Mailing", route: "/mailing" },
  { featureGate: "tabulation", label: "Tabulation", route: "/tabulation" },
  { featureGate: "reports", label: "Reports", route: "/reports" },
  { featureGate: "nobo", label: "NOBO", route: "/nobo" },
];

export const getNavigationTabs = (currentPhase: number): NavigationTab[] =>
  buildNavigationTabs(currentPhase);

/**
 * Stable empty list for pages rendered outside a MeetingProvider. Sharing one
 * frozen reference keeps `meetings` referentially stable across renders without
 * a useMemo.
 */
export const emptyMeetings: readonly never[] = Object.freeze([]);
