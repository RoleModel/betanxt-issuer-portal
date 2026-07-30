"use client";

import { Card, CardContent, Grid, Stack } from "@mui/material";
import { Container } from "@mui/material";
import ChartBarsIcon from "@rolemodel/betanxt-design-system/components/icons/brand/ChartBarsIcon";
import PersonArmsUpIcon from "@rolemodel/betanxt-design-system/components/icons/brand/PersonArmsUpIcon";
import { PdfIcon } from "@rolemodel/betanxt-design-system/components/icons/PdfIcon";
import React from "react";

import type { Meeting } from "@/types/api-exports";

import FeatureTile from "@/components/FeatureTile";
import { useClient } from "@/contexts/ClientContext";
import { useVotingTabulation } from "@/hooks/useVotingTabulation";
import { exportTabulationPdf } from "@/utils/exportTabulationPdf";
import {
  formatQuorumRequirementPercentLabel,
  quorumRequiredShares,
} from "@/utils/quorum";

interface Phase8LayoutProps {
  meetingId?: string;
  meeting?: Meeting;
}

export default React.memo(({ meeting, meetingId }: Phase8LayoutProps) => {
  const { currentClient } = useClient();
  const { proposals, votingSummary } = useVotingTabulation(meetingId);

  const handleTabulationDownload = async () => {
    if (!meeting || !proposals) return;

    try {
      await exportTabulationPdf({
        tabulationData: {
          companyName:
            currentClient?.company_name ??
            currentClient?.short_name ??
            "Company",
          meetingType: meeting.meetingType ?? "Annual Meeting",
          meetingDate: meeting.meetingDate ?? "",
          recordDate: meeting.recordDate ?? "",
          totalOutstanding: votingSummary?.totalSharesOutstanding ?? 0,
          votesRepresentedForQuorum: votingSummary?.totalSharesVoted ?? 0,
          quorumPercentage: votingSummary?.percentageVoted ?? 0,
          quorumRequirement: formatQuorumRequirementPercentLabel(
            meeting.quorumRequirement
          ),
          votesOverUnderQuorum:
            (votingSummary?.totalSharesVoted ?? 0) -
            quorumRequiredShares(
              votingSummary?.totalSharesOutstanding ?? 0,
              meeting.quorumRequirement
            ),
          cusipList: meeting.cusip ?? "",
          brokerNonVote: meeting.brokerNonVote ?? 0,
          proposals: proposals.map((p) => ({
            proposalNumber: String(p.proposalNumber),
            title: p.proposalTitle ?? "",
            directorName: p.directorName ?? "",
            voteFor: p.votingResults.for.shares,
            voteAgainst: p.votingResults.against.shares,
            voteAbstain: p.votingResults.abstain.shares,
            percentFor: p.votingResults.for.percentage,
            percentAgainst: p.votingResults.against.percentage,
            percentAbstain: p.votingResults.abstain.percentage,
            percentOfOutstanding:
              (p.votingResults.for.shares /
                (votingSummary?.totalSharesOutstanding || 1)) *
              100,
            percentOfTotalVoted:
              (p.votingResults.for.shares /
                (votingSummary?.totalSharesVoted || 1)) *
              100,
            percentOfProposalVotes: p.votingResults.for.percentage,
          })),
        },
        clientTicker: meeting.ticker,
      });
    } catch (error) {
      console.error("Failed to export tabulation report:", error);
    }
  };

  const handleRegisteredAccountsDownload = async () => {
    // Placeholder for registered accounts report - can be implemented later
    // TODO: Implement registered accounts report download
  };
  return (
    <Container component="main">
      <Stack spacing={{ xs: 2, md: 3 }}>
        <FeatureTile
          title={`Congratulations on the Completion of your ${meeting?.meetingYear} ${meeting?.meetingType}!`}
          icon={<PersonArmsUpIcon fontSize="4xl" />}
        />
        <Card>
          <CardContent>
            <FeatureTile
              title="Post Meeting Survey"
              variant="tertiary"
              description="We would love to hear from you! With every Meeting, we at BetaNXT are always looking for ways to improve your expereince and get your feedback on how your Meeting went this year. Please take a moment to complete this Post-Meeting survey to help us continue better assisting you in the future!"
              actionText="Take Survey"
              icon={<ChartBarsIcon fontSize="4xl" />}
              onClick={() => {
                // Event handler intentionally empty - button is disabled
              }}
            />
          </CardContent>
        </Card>
        <Grid
          container
          spacing={{ xs: 2, md: 3 }}
          direction="row"
          justifyContent="stretch"
        >
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <FeatureTile
              title="Final Tabulation Report"
              actionText="Download"
              icon={<PdfIcon fontSize="inherit" />}
              onClick={handleTabulationDownload}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <FeatureTile
              title="Registered Accounts Voted Report"
              actionText="Download"
              icon={<PdfIcon fontSize="inherit" />}
              onClick={handleRegisteredAccountsDownload}
            />
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
});
