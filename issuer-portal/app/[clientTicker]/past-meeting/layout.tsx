"use client";

import { Box } from "@mui/material";
import React from "react";

import type { LayoutProps } from "@/types/next-layout";

import { EventTabs } from "@/components/Navigation/EventTabs";
import { DocumentProvider } from "@/contexts/DocumentContext";
import { MeetingProvider } from "@/contexts/MeetingContext";

// Main meeting layout with normal nested routes
// EventTabs stay mounted while nested routes change
const MeetingLayout = (props: LayoutProps<"/[clientTicker]/meeting">) => {
  return (
    <MeetingProvider>
      <DocumentProvider>
        <Box sx={{ flexShrink: 0 }}>
          <EventTabs />
        </Box>
        <Box sx={{ flexGrow: 1, flex: 1 }}>{props.children}</Box>
      </DocumentProvider>
    </MeetingProvider>
  );
};

export default MeetingLayout;
