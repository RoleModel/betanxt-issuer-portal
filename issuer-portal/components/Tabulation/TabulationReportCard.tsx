"use client";

import React, { useEffect, useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import FeatureTile from "@/components/FeatureTile";
import { useClient } from "@/contexts/ClientContext";
import { useMeeting } from "@/contexts/MeetingContext";
import buildApiClient from "@/domain-models/apiClient";
import { useVotingTabulation } from "@/hooks/useVotingTabulation";
import { exportTabulationPdf } from "@/utils/exportTabulationPdf";
import { formatQuorumRequirementPercentLabel, quorumRequiredShares } from "@/utils/quorum";

interface TabulationReportCardProps {
  variant?: "default" | "primary" | "secondary" | "tertiary" | "base";
}

export default function TabulationReportCard({ variant = "tertiary" }: TabulationReportCardProps) {
  const { currentClient } = useClient();
  const { currentMeeting } = useMeeting();
  const { proposals: votingProposals } = useVotingTabulation(currentMeeting?.id);
  const [rawProposals, setRawProposals] = useState<components["schemas"]["Proposal"][]>([]);

  // Fetch raw proposal data to get all fields
  useEffect(() => {
    const fetchProposals = async () => {
      if (!currentMeeting?.id) return;

      const apiClient = await buildApiClient();
      const { data } = await apiClient.GET("/meetings/{meetingId}/proposals", {
        params: { path: { meetingId: currentMeeting.id } },
      });

      if (data) {
        const proposals = Array.isArray(data) ? data : [];
        setRawProposals(proposals);
      }
    };

    void fetchProposals();
  }, [currentMeeting?.id]);

  const handleDownload = async () => {
    if (!currentMeeting) {
      console.error("Missing meeting data:", currentMeeting);
      alert("Unable to generate report. Meeting data is not available.");
      return;
    }
    // Map proposals to the format expected by the PDF export
    // Use raw proposal data which contains the actual totals from the CSV
    // Sort by proposal number so director elections appear in order (1.01, 1.02, ...)
    const sortedRawProposals = [...rawProposals].sort(
      (a, b) => (a.proposalNumber ?? 0) - (b.proposalNumber ?? 0),
    );
    const proposalsForExport = sortedRawProposals.map((rp) => {
      const totalVotesFor = rp.totalVotesFor ?? 0;
      const totalVotesAgainst = rp.totalVotesAgainst ?? 0;
      const totalVotesAbstain = rp.totalVotesAbstain ?? 0;
      const totalVotes = totalVotesFor + totalVotesAgainst + totalVotesAbstain;

      return {
        proposalNumber: rp.proposalNumber ?? 0,
        proposalTitle: rp.proposalTitle ?? "",
        proposalType: rp.proposalType ?? "",
        directorName: rp.directorName ?? "",
        recommendation: rp.recommendation ?? "FOR",
        totalVotesFor,
        totalVotesAgainst,
        totalVotesAbstain,
        forPercentage: totalVotes > 0 ? (totalVotesFor / totalVotes) * 100 : 0,
        againstPercentage: totalVotes > 0 ? (totalVotesAgainst / totalVotes) * 100 : 0,
        abstainPercentage: totalVotes > 0 ? (totalVotesAbstain / totalVotes) * 100 : 0,
      };
    });

    // Get votes represented — use any proposal that has votes (participation is the same across all)
    const firstProposal =
      sortedRawProposals.find(
        (rp) =>
          (rp.totalVotesFor ?? 0) + (rp.totalVotesAgainst ?? 0) + (rp.totalVotesAbstain ?? 0) > 0,
      ) ?? sortedRawProposals[0];
    const votesRepresented = firstProposal
      ? (firstProposal.totalVotesFor ?? 0) +
        (firstProposal.totalVotesAgainst ?? 0) +
        (firstProposal.totalVotesAbstain ?? 0)
      : 0;

    // Prefer proposal.totalSharesEligible — it reflects the actual eligible share count
    // used when votes were recorded, which may differ from meeting.totalSharesOutstanding
    const proposalSharesEligible = Number(firstProposal?.totalSharesEligible ?? 0);
    const totalOutstanding =
      proposalSharesEligible > 0
        ? proposalSharesEligible
        : Number(currentMeeting.totalSharesOutstanding ?? 0);

    const quorumPercentage = totalOutstanding > 0 ? (votesRepresented / totalOutstanding) * 100 : 0;
    const quorumRequirement = formatQuorumRequirementPercentLabel(currentMeeting.quorumRequirement);
    const votesOverUnderQuorum =
      votesRepresented - quorumRequiredShares(totalOutstanding, currentMeeting.quorumRequirement);

    // Determine if meeting has concluded
    const isMeetingConcluded = currentMeeting.meetingDate
      ? new Date(currentMeeting.meetingDate) < new Date()
      : false;

    const reportTitle = isMeetingConcluded
      ? "Final Tabulation Results"
      : "Preliminary Tabulation Results";

    // Prepare tabulation data in the format expected by the PDF export
    const tabulationData = {
      companyName: currentClient?.company_name ?? currentClient?.short_name ?? "Company",
      meetingType: currentMeeting.meetingType ?? "Annual Meeting",
      meetingDate: currentMeeting.meetingDate ?? "",
      recordDate: currentMeeting.recordDate ?? "",
      totalOutstanding,
      votesRepresentedForQuorum: votesRepresented,
      quorumPercentage,
      quorumRequirement,
      votesOverUnderQuorum,
      cusipList: currentMeeting.cusip ?? "", // Use cusip from meeting
      reportTitle, // Pass the dynamic title
      brokerNonVote: currentMeeting.brokerNonVote ?? 0,
      proposals: proposalsForExport.map((p) => {
        const totalVotes = p.totalVotesFor + p.totalVotesAgainst + p.totalVotesAbstain;

        return {
          proposalNumber: p.proposalNumber.toString(),
          title: p.proposalTitle,
          directorName: p.directorName,
          voteFor: p.totalVotesFor,
          voteAgainst: p.totalVotesAgainst,
          voteAbstain: p.totalVotesAbstain,
          percentFor: p.forPercentage,
          percentAgainst: p.againstPercentage,
          percentAbstain: p.abstainPercentage,
          percentOfOutstanding: totalOutstanding > 0 ? (totalVotes / totalOutstanding) * 100 : 0,
          percentOfTotalVoted: votesRepresented > 0 ? (totalVotes / votesRepresented) * 100 : 0,
          percentOfProposalVotes: 100,
        };
      }),
    };

    await exportTabulationPdf({
      tabulationData,
      clientTicker: currentMeeting.ticker || undefined,
    });
  };

  const isDataReady = !!(currentMeeting && votingProposals.length > 0);

  // Determine if meeting has concluded (meeting date has passed)
  const isMeetingConcluded = currentMeeting?.meetingDate
    ? new Date(currentMeeting.meetingDate) < new Date()
    : false;

  const reportTitle = isMeetingConcluded
    ? "Final Tabulation Results"
    : "Preliminary Tabulation Results";

  return (
    <FeatureTile
      height="100%"
      title={reportTitle}
      variant={variant}
      flex={true}
      description="Results for each proposal, showing vote counts, percentages, and quorum status."
      actionText={isDataReady ? "Download" : "Loading..."}
      onClick={isDataReady ? handleDownload : undefined}
      sx={{
        opacity: isDataReady ? 1 : 0.6,
        cursor: isDataReady ? "pointer" : "default",
      }}
    />
  );
}
