"use client";

import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useState } from "react";

import BeneficialVsRegisteredCard from "@/components/Charts/BeneficialVsRegistered/BeneficialVsRegisteredCard";
import { ConsolidatedVoteChart } from "@/components/Charts/ConsolidatedVote/ConsolidatedVoteChart";
import { ResponseRateTimeline } from "@/components/Charts/ResponseRateTimeline/ResponseRateTimeline";
import { useVoteBreakdown } from "@/components/Charts/ConsolidatedVote/useVoteBreakdown";
import VotingActivityCard from "@/components/Charts/VotingActivity/VotingActivityCard";

/**
 * Exploration surface, not production UI.
 *
 * Puts a single three-ring breakdown next to the two cards it could replace so
 * the consolidation can be judged side by side. Reachable only by typing the
 * URL — nothing links here.
 */
const ChartLabPage = () => {
  const parameters = useParams();
  const meetingId =
    typeof parameters.meetingId === "string" ? parameters.meetingId : undefined;

  const [selectedProposalId, setSelectedProposalId] = useState<string>("");
  const { leaves, proposals, totalShares, isLoading, error } = useVoteBreakdown(
    meetingId,
    selectedProposalId.length > 0 ? selectedProposalId : undefined
  );

  const activeProposalId =
    selectedProposalId.length > 0
      ? selectedProposalId
      : (proposals[0]?.id ?? "");

  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h1">Chart lab</Typography>
        <Typography color="text.secondary" variant="body2">
          Exploring whether the voting-activity and beneficial-vs-registered
          cards can collapse into one figure. Rings read outward: how the vote
          arrived, who held the shares, and how it was cast.
        </Typography>
        <Alert severity="info" sx={{ alignSelf: "flex-start" }}>
          Prototype — not linked from navigation.
        </Alert>
      </Stack>

      {error === null ? null : <Alert severity="error">{error}</Alert>}

      <Grid columns={12} container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card variant="outlined">
            <CardHeader
              action={
                proposals.length > 0 ? (
                  <TextField
                    label="Proposal"
                    onChange={(event) => {
                      setSelectedProposalId(event.target.value);
                    }}
                    select
                    size="small"
                    sx={{ minWidth: 260 }}
                    value={activeProposalId}
                  >
                    {proposals.map((proposal) => (
                      <MenuItem key={proposal.id} value={proposal.id}>
                        {proposal.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : null
              }
              subheader="Source → holder type → vote"
              title="Consolidated breakdown"
            />
            <CardContent>
              {isLoading ? (
                <Skeleton height={420} variant="rectangular" />
              ) : (
                <ConsolidatedVoteChart
                  leaves={leaves}
                  totalShares={totalShares}
                />
              )}
              <Box sx={{ mt: 2 }}>
                <Typography color="text.secondary" variant="body3">
                  Inner ring: registered vs beneficial. Middle ring: how those
                  shares were cast. Outer ring: the channel they arrived
                  through. Every percentage is of its own parent slice, so each
                  ring reads on its own. Hover any arc for share counts.
                  Channels are Mail / Email — the API does not serve the
                  votingSource field, so Web / Print / IVR is not available
                  (which is also why the Voting Activity card beside this one
                  shows no methods).
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card variant="outlined">
            <CardHeader
              subheader="Response rate by submission channel, with solicitation milestones"
              title="Response over time"
            />
            <CardContent>
              <ResponseRateTimeline />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="body2">
              Today, for comparison
            </Typography>
            {meetingId === undefined ? null : (
              <>
                <VotingActivityCard meetingId={meetingId} />
                <BeneficialVsRegisteredCard meetingId={meetingId} />
              </>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChartLabPage;
