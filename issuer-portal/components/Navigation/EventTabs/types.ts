import type { components } from "@/domain-models/generated-schema";
import type { TabulationDisplayMode } from "@/utils/tabulation-display";

export interface MeetingTab {
  id: string;
  title: string;
  ticker: string;
  cusip: string;
  recordDate: string;
  mailingDate: string;
  meetingDate: string;
  status: "ACTIVE" | "COMPLETE" | "ADJOURNED";
  currentPhase: string;
  overallCompletion: number;
  client: string;
}

/**
 * Client feature key a navigation tab is gated behind, or `null` for tabs
 * that are always visible (the dashboard). Gated tabs — including the NOBO
 * tab — are filtered out of the rendered tab list whenever the client's
 * matching feature flag is disabled.
 */
export type FeatureGate =
  "agenda" | "mailing" | "tabulation" | "reports" | "nobo" | null;

export interface NavigationTab {
  label: string;
  route: string;
  featureGate: FeatureGate;
}

export interface MeetingTabItemProperties {
  readonly meeting: MeetingTab;
  readonly src: components["schemas"]["Meeting"];
  readonly index: number;
  readonly currentMeetingId: string | undefined;
  readonly ticker: string | undefined;
  readonly pathname: string;
  readonly isMobile: boolean;
  readonly isCSM: boolean;
}

export interface MeetingTabsScrollerProperties {
  readonly transformedMeetings: readonly {
    tab: MeetingTab;
    src: components["schemas"]["Meeting"];
  }[];
  readonly currentMeetingId: string | undefined;
  readonly ticker: string | undefined;
  readonly pathname: string;
  readonly isMobile: boolean;
  readonly isCSM: boolean;
}

export interface MeetingNavigationBarProperties {
  readonly isPending: boolean;
  readonly activeTab: string;
  readonly navigationTabs: readonly NavigationTab[];
  readonly currentMeeting: components["schemas"]["Meeting"] | null | undefined;
  readonly currentClientTicker: string | undefined;
  readonly pathname: string;
  readonly displayMode: TabulationDisplayMode;
  readonly setDisplayMode: (displayMode: TabulationDisplayMode) => void;
}
