"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import HandTouchIcon from "@rolemodel/betanxt-design-system/components/icons/brand/HandTouchIcon";
import React from "react";

const defaultEmptyStateIcon = <HandTouchIcon />;

interface EmptyStateProps {
  readonly icon?: React.ReactNode;
  readonly title: string;
  readonly minHeight?: number | string;
  readonly height?: number | string;
  readonly description?: string | React.ReactNode;
  readonly action?: React.ReactNode;
  readonly children?: React.ReactNode;
}

export const EmptyState = ({
  icon = defaultEmptyStateIcon,
  title,
  minHeight = 400,
  height,
  description,
  action,
  children,
}: EmptyStateProps) => {
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          background: "var(--mui-palette-tableCellRow-fill)",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          p: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight,
          height: height ?? "100%",
        }}
      >
        <Stack
          spacing={1}
          alignItems="center"
          sx={{ maxWidth: 600, textAlign: "center" }}
        >
          <Box
            sx={{
              display: "flex",
              fontSize: 64,
              "& .MuiSvgIcon-root": {
                fontSize: 64,
                height: "64px !important",
                width: "64px !important",
              },
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>

          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: 1.43,
              letterSpacing: "1.07%",
              color: "text.primary",
              mt: 1,
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body3"
            sx={{
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: 1.43,
              letterSpacing: "1.07%",
              color: "text.secondary",
              textAlign: "center",
            }}
          >
            {description}
          </Typography>
          {children}
          {action === undefined || action === null ? null : (
            <Box sx={{ mt: 3 }}>{action}</Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

// Export types for external use
export type { EmptyStateProps };

// Also export as default for backward compatibility
export default EmptyState;
