"use client";

import { Box, Typography } from "@mui/material";
import React from "react";

import LineMarker from "./LineMarker";

interface LegendItem {
  label: string;
  color: string;
  type?: "line" | "bar" | "area"; // Add type to determine symbol
}

interface CustomLegendProps {
  items: LegendItem[];
  direction?: "horizontal" | "vertical";
  markerSize?: number;
  gap?: number;
  textVariant?: "body1" | "body3" | "caption";
}

/**
 * Custom legend component that uses LineMarker as the legend symbol
 * for use with MUI X Charts line charts
 */
const CustomLegend: React.FC<CustomLegendProps> = ({
  items,
  direction = "horizontal",
  markerSize = 16,
  gap = 3,
}) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      flexDirection={direction === "horizontal" ? "row" : "column"}
      gap={gap}
      mt={2}
    >
      {items.map((item, index) => {
        const renderSymbol = () => {
          if (item.type === "line") {
            // Use LineMarker for line series
            return (
              <svg width={25} height={24}>
                <LineMarker
                  x={12.5}
                  y={12}
                  color={item.color}
                  size={markerSize}
                  id={`legend-${index}`}
                  shape="circle"
                  dataIndex={index}
                />
              </svg>
            );
          } else {
            // Use colored rectangle for bar/area series
            return <Box width={14} height={14} bgcolor={item.color} borderRadius={0.5} />;
          }
        };

        return (
          <Box key={item.label} display="flex" alignItems="center" gap={1}>
            {renderSymbol()}
            <Typography variant="caption" color="text.primary">
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default CustomLegend;
