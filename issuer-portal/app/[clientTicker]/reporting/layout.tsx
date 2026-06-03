"use client";

import { Box } from "@mui/material";
import React from "react";

import { MeetingProvider } from "@/contexts/MeetingContext";

// Reporting layout with navigation
export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MeetingProvider>
      <Box sx={{ flexGrow: 1, flex: 1 }}>{children}</Box>
    </MeetingProvider>
  );
}
