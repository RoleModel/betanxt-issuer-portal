"use client";

import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import React from "react";

interface DrawerHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  navigation?: {
    current: number;
    total: number;
    onPrevious: () => void;
    onNext: () => void;
  };
  color?: string;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  title,
  subtitle,
  onClose,
  navigation,
  color,
}) => {
  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.vars.palette.appSwitcher.background,
        color: color || theme.vars.palette.appSwitcher.contrastText,
      })}
    >
      {/* Main header with title and close button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          height: 60,
        }}
      >
        <Typography variant="h6" sx={{ fontSize: "18px", fontWeight: 500 }}>
          {title}
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close drawer"
          sx={{ color: "inherit" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Optional navigation controls */}
      {navigation && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
            px: 1,
            height: 40,
          }}
        >
          <IconButton
            size="small"
            disabled={navigation.current <= 1}
            onClick={navigation.onPrevious}
            aria-label="Go to previous phase"
            sx={{
              color: "inherit",
              opacity: navigation.current <= 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeftIcon />
          </IconButton>

          <Typography
            variant="caption"
            sx={{ color: "inherit", fontSize: "12px" }}
          >
            {subtitle ?? `Phase ${navigation.current} of ${navigation.total}`}
          </Typography>

          <IconButton
            size="small"
            disabled={navigation.current >= navigation.total}
            onClick={navigation.onNext}
            aria-label="Go to next phase"
            sx={{
              color: "inherit",
              opacity: navigation.current >= navigation.total ? 0.5 : 1,
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default DrawerHeader;
