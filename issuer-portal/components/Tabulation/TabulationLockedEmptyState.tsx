"use client";

import TimerClockIcon from "@rolemodel/betanxt-design-system/components/icons/brand/TimerClockIcon";

import EmptyState from "@/components/EmptyState";

/**
 * Shown wherever tabulation results are withheld. Visibility is driven purely
 * by the CSM's release flag — the 15 days in the copy is descriptive, and no
 * part of this component derives anything from the meeting date.
 */
export const TabulationUnavailableMessage =
  "Tabulation will be available 15 days before the meeting.";

interface TabulationUnavailableEmptyStateProps {
  /**
   * Lets the same message drop into a small card slot (pass `"unset"`) as well
   * as a full page, without a second component or a hand-rolled layout.
   */
  readonly minHeight?: number | string;
  readonly height?: number | string;
}

export const TabulationUnavailableEmptyState = ({
  minHeight,
  height,
}: TabulationUnavailableEmptyStateProps) => {
  return (
    <EmptyState
      icon={<TimerClockIcon accentColor="var(--mui-palette-primary-main)" />}
      minHeight={minHeight}
      height={height ?? "100%"}
      title={TabulationUnavailableMessage}
    />
  );
};

export type { TabulationUnavailableEmptyStateProps };

export default TabulationUnavailableEmptyState;
