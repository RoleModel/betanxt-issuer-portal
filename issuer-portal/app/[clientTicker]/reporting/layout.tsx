"use client";

import { Box } from "@mui/material";
import React from "react";

import { MeetingProvider } from "@/contexts/MeetingContext";

// Reporting layout with navigation
const ReportingLayout = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => {
  return (
    <MeetingProvider>
      <Box sx={{ flexGrow: 1, flex: 1 }}>{children}</Box>
    </MeetingProvider>
  );
};

export default ReportingLayout;
