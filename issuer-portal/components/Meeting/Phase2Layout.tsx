"use client";

import { Grid } from "@mui/material";

import type { Meeting } from "@/types/api-exports";

import KeyDatesCard from "@/components/Meeting/KeyDatesCard";
import MeetingDocuments from "@/components/Meeting/MeetingDocuments";

interface Phase2LayoutProps {
  readonly meeting?: Meeting;
}

const Phase2Layout = ({ meeting }: Phase2LayoutProps) => {
  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={{ xs: 12, md: 12 }}>
        <KeyDatesCard meeting={meeting} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <MeetingDocuments meetingId={meeting?.id} meeting={meeting} />
      </Grid>
    </Grid>
  );
};

export default Phase2Layout;
