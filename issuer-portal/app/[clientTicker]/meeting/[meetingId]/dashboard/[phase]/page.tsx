"use client";

import { Box, Container } from "@mui/material";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

import { useMeeting } from "@/contexts/MeetingContext";
import { TabulationDisplayProvider } from "@/contexts/TabulationDisplayContext";

// Dynamically load layout & tracker to reduce initial JS bundle
const Phase1Layout = dynamic(() => import("@/components/Meeting/Phase1Layout"), {});
const TabulationTracker = dynamic(() => import("@/components/Meeting/TabulationTracker"), {});

const PhasePage = () => {
  const params = useParams();
  const meetingId = params.meetingId as string;
  const phase = params.phase as string;
  const { getMeetingById } = useMeeting();
  const meeting = getMeetingById(meetingId);

  const meetingForPhase = meeting
    ? {
        ...meeting,
        client: meeting.client
          ? {
              ...meeting.client,
              isActive: meeting.client.isActive ?? true,
            }
          : meeting.client,
      }
    : meeting;

  return (
    <Container component="main" maxWidth="xl" data-testid="meeting-dashboard">
      <Box
        display="flex"
        flexGrow={1}
        flexDirection="column"
        paddingY={{ xs: 2, sm: 3 }}
        gap={{ xs: 2, md: 3 }}
      >
        <TabulationTracker meetingId={meetingId} phase={phase} />

        <TabulationDisplayProvider>
          <Phase1Layout meeting={meetingForPhase} />
        </TabulationDisplayProvider>
      </Box>
    </Container>
  );
};

export default PhasePage;
