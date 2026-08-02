"use client";

import type { ReactNode } from "react";

import { Box, Typography } from "@mui/material";

export interface LegendToggleProps {
  /** The swatch shown before the label — a colour chip or a pattern sample. */
  readonly children: ReactNode;
  readonly hidden: boolean;
  readonly label: string;
  readonly onToggle: () => void;
  readonly testId: string;
}

/**
 * One entry in a chart legend: a swatch, its label, and a pressed state that
 * doubles as the series' visibility toggle.
 *
 * Shared by the vote-breakdown cards so their legends stay visually identical
 * and expose the same `aria-pressed` semantics to assistive tech and tests.
 */
export const LegendToggle = ({
  children,
  hidden,
  label,
  onToggle,
  testId,
}: LegendToggleProps) => (
  <Box
    aria-pressed={!hidden}
    component="button"
    data-testid={testId}
    onClick={onToggle}
    sx={{
      alignItems: "center",
      background: "none",
      border: 0,
      color: "text.primary",
      cursor: "pointer",
      display: "flex",
      gap: 0.5,
      opacity: hidden ? 0.45 : 1,
      p: 0,
    }}
    type="button"
  >
    {children}
    <Typography variant="caption">{label}</Typography>
  </Box>
);

export default LegendToggle;
