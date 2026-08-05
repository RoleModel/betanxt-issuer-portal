"use client";

import { Card, CardContent, CardHeader, Container } from "@mui/material";
import Grid from "@mui/material/Grid";

import { NoboPositionsTable } from "@/components/Nobo/NoboPositionsTable";
import { GeoHeatmapCard } from "@/components/Charts/GeoHeatmap/GeoHeatmapCard";
import { useMeeting } from "@/contexts/MeetingContext";
import { useNoboPositions } from "@/hooks/useNoboPositions";

const formatNumber = (value: number): string => value.toLocaleString("en-US");

/**
 * NOBO tab for a meeting: a side-by-side layout of the NOBO positions table
 * and the geographic distribution heat map.
 *
 * The route is only reachable through navigation when the client's `nobo`
 * feature flag is enabled (the tab is filtered out of `EventTabs` otherwise).
 * Renders nothing while the meeting context resolves; the position count in
 * the card subheader updates once the positions fetch completes.
 */
const NoboPage = () => {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting();
  const meetingId = currentMeeting?.id;
  const { positions, loading: positionsLoading } = useNoboPositions(meetingId);

  if (meetingLoading) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="NOBO Positions"
              subheader={
                positionsLoading
                  ? "Loading positions…"
                  : `${formatNumber(positions.length)} non-objecting beneficial owner positions`
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <NoboPositionsTable
                positions={positions}
                loading={positionsLoading}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <GeoHeatmapCard meetingId={meetingId} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default NoboPage;
