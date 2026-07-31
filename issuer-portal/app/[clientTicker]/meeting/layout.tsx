"use client";

import { Box } from "@mui/material";
import React from "react";

import type { LayoutProps } from "@/types/next-layout";

import { EventTabs } from "@/components/Navigation/EventTabs";
import { DocumentProvider } from "@/contexts/DocumentContext";
import { MeetingProvider } from "@/contexts/MeetingContext";
import { TabulationDisplayProvider } from "@/contexts/TabulationDisplayContext";

// Main meeting layout with normal nested routes
// EventTabs stay mounted while nested routes change
const MeetingLayout = (props: LayoutProps<"/[clientTicker]/meeting">) => {
  return (
    <MeetingProvider>
      <DocumentProvider>
        <TabulationDisplayProvider>
          <Box sx={{ flexShrink: 0 }}>
            <EventTabs />
          </Box>
          <Box sx={{ flexGrow: 1, flex: 1 }}>{props.children}</Box>
        </TabulationDisplayProvider>
      </DocumentProvider>
    </MeetingProvider>
  );
};

export default MeetingLayout;
