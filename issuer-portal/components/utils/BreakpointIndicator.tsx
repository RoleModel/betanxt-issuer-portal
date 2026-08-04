"use client";

import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import dynamic from "next/dynamic";
import React from "react";

const BreakpointIndicatorComponent: React.FC = () => {
  const theme = useTheme();

  // Check all breakpoints
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));
  const isSm = useMediaQuery(theme.breakpoints.only("sm"));
  const isMd = useMediaQuery(theme.breakpoints.only("md"));
  const isLg = useMediaQuery(theme.breakpoints.only("lg"));
  const isXl = useMediaQuery(theme.breakpoints.only("xl"));

  // Determine current breakpoint
  const currentBreakpoint = isXs
    ? "xs"
    : isSm
      ? "sm"
      : isMd
        ? "md"
        : isLg
          ? "lg"
          : isXl
            ? "xl"
            : "unknown";

  // Get the pixel values for reference
  const breakpointValues = {
    xs: `0-${theme.breakpoints.values.sm}px`,
    sm: `${theme.breakpoints.values.sm}-${theme.breakpoints.values.md}px`,
    md: `${theme.breakpoints.values.md}-${theme.breakpoints.values.lg}px`,
    lg: `${theme.breakpoints.values.lg}-${theme.breakpoints.values.xl}px`,
    xl: `${theme.breakpoints.values.xl}px+`,
  };

  return (
    <Box
      role="complementary"
      aria-label="Breakpoint Indicator"
      sx={{
        position: "fixed",
        bottom: 100,
        left: 16,
        backgroundColor: "lch(30% 80 200)",
        color: "white",
        padding: "8px 12px",
        borderRadius: 1,
        zIndex: 9999,
        pointerEvents: "none",
        fontFamily: "monospace",
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: "bold", display: "block" }}
      >
        Breakpoint: {currentBreakpoint.toUpperCase()}
      </Typography>
      <Typography variant="caption" sx={{ fontSize: "10px", opacity: 0.8 }}>
        {breakpointValues[currentBreakpoint as keyof typeof breakpointValues]}
      </Typography>
      <Typography
        variant="caption"
        sx={{ fontSize: "10px", opacity: 0.6, display: "block" }}
      >
        Window:{" "}
        {typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : "N/A"}
      </Typography>
    </Box>
  );
};

// Create dynamic wrapper with SSR disabled to prevent hydration mismatches
export const BreakpointIndicator = dynamic(
  async () => await Promise.resolve(BreakpointIndicatorComponent),
  {
    ssr: false,
  }
);

export default BreakpointIndicator;
