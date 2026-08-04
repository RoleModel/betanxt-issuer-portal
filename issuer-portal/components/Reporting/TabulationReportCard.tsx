/* eslint-disable @typescript-eslint/strict-void-return */
/* eslint-disable @typescript-eslint/no-misused-promises */

/* eslint-disable react-doctor/js-tosorted-immutable */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable react-doctor/rerender-state-only-in-handlers */
"use client";

import { IconForFileType } from "@rolemodel/betanxt-design-system/components/icons/IconForFileType";
import { useEffect, useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import { useClient } from "@/contexts/ClientContext";
import { useMeeting } from "@/contexts/MeetingContext";
import buildApiClient from "@/domain-models/apiClient";
import { useVotingTabulation } from "@/hooks/use-voting-tabulation";
import { exportTabulationPdf } from "@/utils/exportTabulationPdf";
import {
  formatQuorumRequirementPercentLabel,
  quorumRequiredShares,
} from "@/utils/quorum";

import FeatureTile from "../FeatureTile";

const TabulationReportCard = () => {
  const { currentClient } = useClient();
  const { currentMeeting } = useMeeting();
  const { proposals: votingProposals } = useVotingTabulation(
    currentMeeting?.id
  );
  const [rawProposals, setRawProposals] = useState<
    components["schemas"]["Proposal"][]
  >([]);

  useEffect(() => {
    let ignore = false;

    const fetchProposals = async () => {
      if (currentMeeting?.id == null) return;

      const apiClient = await buildApiClient();
      const { data } = await apiClient.GET("/meetings/{meetingId}/proposals", {
        params: { path: { meetingId: currentMeeting.id } },
      });

      if (data && !ignore) {
        const proposals = Array.isArray(data) ? data : [];
        setRawProposals(proposals);
      }
    };

    void fetchProposals();

    return () => {
      ignore = true;
    };
  }, [currentMeeting?.id]);

  const handleDownload = async () => {
    if (!currentMeeting) return;

    const sortedRawProposals = [...rawProposals].sort(
      (a, b) => (a.proposalNumber ?? 0) - (b.proposalNumber ?? 0)
    );
    const proposalsForExport = sortedRawProposals.map((rp) => {
      const totalVotesFor = rp.totalVotesFor ?? 0;
      const totalVotesAgainst = rp.totalVotesAgainst ?? 0;
      const totalVotesAbstain = rp.totalVotesAbstain ?? 0;
      const totalVotes = totalVotesFor + totalVotesAgainst + totalVotesAbstain;

      return {
        proposalNumber: rp.proposalNumber ?? 0,
        proposalTitle: rp.proposalTitle ?? "",
        directorName: rp.directorName ?? "",
        totalVotesFor,
        totalVotesAgainst,
        totalVotesAbstain,
        forPercentage: totalVotes > 0 ? (totalVotesFor / totalVotes) * 100 : 0,
        againstPercentage:
          totalVotes > 0 ? (totalVotesAgainst / totalVotes) * 100 : 0,
        abstainPercentage:
          totalVotes > 0 ? (totalVotesAbstain / totalVotes) * 100 : 0,
      };
    });

    const firstProposal =
      sortedRawProposals.find(
        (rp) =>
          (rp.totalVotesFor ?? 0) +
            (rp.totalVotesAgainst ?? 0) +
            (rp.totalVotesAbstain ?? 0) >
          0
      ) ?? sortedRawProposals[0];
    const votesRepresented = firstProposal
      ? (firstProposal.totalVotesFor ?? 0) +
        (firstProposal.totalVotesAgainst ?? 0) +
        (firstProposal.totalVotesAbstain ?? 0)
      : 0;

    const proposalSharesEligible = Number(
      firstProposal?.totalSharesEligible ?? 0
    );
    const totalOutstanding =
      proposalSharesEligible > 0
        ? proposalSharesEligible
        : Number(currentMeeting.totalSharesOutstanding ?? 0);

    const quorumPercentage =
      totalOutstanding > 0 ? (votesRepresented / totalOutstanding) * 100 : 0;
    const quorumRequirement = formatQuorumRequirementPercentLabel(
      currentMeeting.quorumRequirement
    );
    const votesOverUnderQuorum =
      votesRepresented -
      quorumRequiredShares(totalOutstanding, currentMeeting.quorumRequirement);

    const isMeetingConcluded = currentMeeting.meetingDate
      ? new Date(currentMeeting.meetingDate) < new Date()
      : false;

    const reportTitle = isMeetingConcluded
      ? "Final Tabulation Results"
      : "Preliminary Tabulation Results";

    await exportTabulationPdf({
      tabulationData: {
        companyName:
          currentClient?.company_name ?? currentClient?.short_name ?? "Company",
        meetingType: currentMeeting.meetingType ?? "Annual Meeting",
        meetingDate: currentMeeting.meetingDate ?? "",
        recordDate: currentMeeting.recordDate ?? "",
        totalOutstanding,
        votesRepresentedForQuorum: votesRepresented,
        quorumPercentage,
        quorumRequirement,
        votesOverUnderQuorum,
        cusipList: currentMeeting.cusip ?? "",
        reportTitle,
        brokerNonVote: currentMeeting.brokerNonVote ?? 0,
        proposals: proposalsForExport.map((p) => {
          const totalVotes =
            p.totalVotesFor + p.totalVotesAgainst + p.totalVotesAbstain;
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
            percentOfOutstanding:
              totalOutstanding > 0 ? (totalVotes / totalOutstanding) * 100 : 0,
            percentOfTotalVoted:
              votesRepresented > 0 ? (totalVotes / votesRepresented) * 100 : 0,
            percentOfProposalVotes: 100,
          };
        }),
      },
      clientTicker: currentMeeting.ticker || undefined,
    });
  };

  const isDataReady = !!(currentMeeting && votingProposals.length > 0);

  const isMeetingConcluded = currentMeeting?.meetingDate
    ? new Date(currentMeeting.meetingDate) < new Date()
    : false;

  const reportTitle = isMeetingConcluded
    ? "Final Tabulation Results"
    : "Preliminary Tabulation Results";

  return (
    <FeatureTile
      title={reportTitle}
      description="Results for each proposal, showing vote counts, percentages, and quorum status."
      icon={<IconForFileType fileType="PDF" />}
      variant="tertiary"
      actionText={isDataReady ? "Download" : "Loading..."}
      onClick={isDataReady ? handleDownload : undefined}
    />
  );
};

export default TabulationReportCard;
