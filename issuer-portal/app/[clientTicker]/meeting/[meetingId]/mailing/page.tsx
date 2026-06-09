"use client";

import {
  Card,
  CardContent,
  CardHeader,
  Container,
  LinearProgress,
  Skeleton,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import FeatureTile from "@/components/FeatureTile";
import AdditionalMailingSummaryCard from "@/components/Meeting/AdditionalMailingSummaryCard";
import MailingDataCard from "@/components/Meeting/MailingDataCard";
import MailingTimelineCard from "@/components/Meeting/MailingTimelineCard";
import { useMeeting } from "@/contexts/MeetingContext";
import { useMailing } from "@/hooks/useMailing";

type MailingData = components["schemas"]["Mailing"];

const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "0";
  return num.toLocaleString("en-US");
};

export default function MailingPage() {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting();
  const meetingId = currentMeeting?.id;
  const { getMailingByMeetingId, loading: mailingLoading } = useMailing();
  const [mailingData, setMailingData] = useState<MailingData | null>(null);

  useEffect(() => {
    if (meetingId) {
      void getMailingByMeetingId(meetingId).then((data) => {
        setMailingData(data);
      });
    }
  }, [meetingId, getMailingByMeetingId]);

  // Show loading state while data is being fetched
  if (meetingLoading || (meetingId && !currentMeeting)) {
    return (
      <LinearProgress
        sx={{
          height: 4,
        }}
      />
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{ my: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 3 }}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 12, lg: 9 }}>
          <Stack spacing={2}>
            <Card>
              <CardHeader title="Primary Mailing Summary" />
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    {mailingLoading ? (
                      <Skeleton variant="rounded" height={80} />
                    ) : (
                      <FeatureTile
                        height="auto"
                        variant="base"
                        title={formatNumber(mailingData?.fullsetMailPositions)}
                        subtitle="Full Set"
                      />
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    {mailingLoading ? (
                      <Skeleton variant="rounded" height={80} />
                    ) : (
                      <FeatureTile
                        height="auto"
                        variant="base"
                        title={formatNumber(mailingData?.naaMailPositions)}
                        subtitle="NAA"
                      />
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    {mailingLoading ? (
                      <Skeleton variant="rounded" height={80} />
                    ) : (
                      <FeatureTile
                        height="auto"
                        variant="base"
                        title={formatNumber(mailingData?.electronicSuppressedPositions)}
                        subtitle="Electronic"
                      />
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <MailingDataCard meetingId={meetingId} />
            <AdditionalMailingSummaryCard ticker={currentMeeting?.ticker} />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 3 }}>
          <Stack direction="column" spacing={2}>
            <MailingTimelineCard
              currentStatus={
                currentMeeting?.mailingStatus as
                  | React.ComponentProps<typeof MailingTimelineCard>["currentStatus"]
                  | undefined
              }
              statusDate={currentMeeting?.updatedAt}
              meetingId={meetingId}
            />
            <Card>
              <CardHeader
                title="Fullfillment Requests"
                slotProps={{ title: { variant: "h4" } }}
                sx={{
                  paddingBottom: 0,
                }}
              />
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Grid container spacing={2}>
                  <Stack direction="column" width="100%" useFlexGap={true} spacing={1}>
                    {mailingLoading ? (
                      <Skeleton variant="rounded" height={80} />
                    ) : (
                      <FeatureTile
                        titleVariant="h4"
                        bodyVariant="body3"
                        title={"12"}
                        subtitle="Bounceback Emails"
                        gutterBottom={false}
                        height="90px"
                        variant="base"
                        sx={{
                          paddingTop: 2,
                          alignItems: "flex-start",
                          "& .MuiBox-root ": {
                            paddingTop: 0,
                            alignItems: "flex-start",
                          },
                        }}
                      />
                    )}

                    {mailingLoading ? (
                      <Skeleton variant="rounded" height={80} />
                    ) : (
                      <FeatureTile
                        titleVariant="h4"
                        bodyVariant="body3"
                        title={"10"}
                        subtitle="Adhoc"
                        gutterBottom={false}
                        height="90px"
                        variant="base"
                        sx={{
                          paddingTop: 2,
                          alignItems: "flex-start",
                          "& .MuiBox-root ": {
                            paddingTop: 0,
                            alignItems: "flex-start",
                          },
                        }}
                      />
                    )}
                  </Stack>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
