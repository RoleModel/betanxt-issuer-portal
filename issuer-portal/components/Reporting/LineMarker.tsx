"use client";

import type { MarkElementProps } from "@mui/x-charts";

import React from "react";

interface LineMarkerProps extends MarkElementProps {
  size?: number;
}

/**
 * Custom marker component based on LineMarker.svg
 * Used as a custom MarkElement in MUI X Charts
 */
const LineMarker = ({
  x,
  y,
  color = "#EB6333",
  size = 32,
}: LineMarkerProps) => {
  // Convert x and y to numbers, with fallbacks
  const numX =
    typeof x === "number" ? x : typeof x === "string" ? parseFloat(x) : 0;
  const numY =
    typeof y === "number" ? y : typeof y === "string" ? parseFloat(y) : 0;

  const scale = size / 16; // Original SVG is 32px high
  const adjustedWidth = 30 * scale;
  const adjustedHeight = 30 * scale;

  return (
    <g
      transform={`translate(${numX - adjustedWidth / 2}, ${numY - adjustedHeight / 2})`}
    >
      <svg
        width={adjustedWidth}
        height={adjustedHeight}
        viewBox="0 0 25 24"
        fill="none"
      >
        {/* Left line */}
        <path
          d="M2.23438 12H7.23438"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Right line */}
        <path
          d="M17.2344 12H22.2344"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Center circle */}
        <circle
          cx="12.2344"
          cy="12"
          r="5"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </g>
  );
};

export default LineMarker;

/**
 * Factory function to create a LineMarker component compatible with MUI X Charts MarkElement slot
 */
export function createLineMarkerElement(
  options: { color?: string; size?: number } = {}
) {
  return (props: MarkElementProps) => {
    const { x, y, color: seriesColor, ...restProps } = props;
    const finalColor = options.color ?? seriesColor ?? "#EB6333";

    return (
      <LineMarker
        x={x}
        y={y}
        color={finalColor}
        size={options.size || 24}
        {...restProps}
      />
    );
  };
}
