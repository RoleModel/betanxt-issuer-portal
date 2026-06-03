"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import HandTouchIcon from "@rolemodel/betanxt-design-system/components/icons/brand/HandTouchIcon";
import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  minHeight?: number | string;
  description?: string | React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  dangerouslySetInnerHTML?: boolean;
}

export function EmptyState({
  icon = <HandTouchIcon />,
  title,
  minHeight = 400,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <Box sx={{ p: 1 }}>
      <Paper
        elevation={0}
        sx={(theme) => ({
          background: theme.vars.palette.tableCellRow.fill,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          p: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: minHeight || 400,
        })}
      >
        <Stack spacing={1} alignItems="center" sx={{ maxWidth: 600, textAlign: "center" }}>
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
          {action && <Box sx={{ mt: 3 }}>{action}</Box>}
        </Stack>
      </Paper>
    </Box>
  );
}

// Export types for external use
export type { EmptyStateProps };

// Also export as default for backward compatibility
export default EmptyState;
