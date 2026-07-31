"use client";

import { Box } from "@mui/material";
import dynamic from "next/dynamic";
import React from "react";
import useSWR from "swr";

import { TabulationPDFDocument } from "@/utils/exportTabulationPdf";

const PDFViewer = dynamic(
  async () => await import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false }
);

interface LogoData {
  clientLogo: string;
  betanxtLogo: string;
}

const fetchLogoAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load logo: ${url}`);
  }
  const blob = await response.blob();
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
};

const fetchPreviewLogos = async (): Promise<LogoData> => {
  const baseUrl = window.location.origin;
  const [clientLogo, betanxtLogo] = await Promise.all([
    fetchLogoAsBase64(`${baseUrl}/logos/WEN_logo.png`),
    fetchLogoAsBase64(`${baseUrl}/images/betanxt-logo.png`),
  ]);
  return { clientLogo, betanxtLogo };
};

// Sample tabulation data for preview
const sampleData: React.ComponentProps<
  typeof TabulationPDFDocument
>["tabulationData"] = {
  companyName: "The Wendy's Company",
  meetingType: "Annual Meeting",
  meetingDate: "2025-05-21",
  recordDate: "2025-03-25",
  totalOutstanding: 196234142,
  votesRepresentedForQuorum: 173753542,
  quorumPercentage: 88.54,
  quorumRequirement: "50%",
  votesOverUnderQuorum: 75636471,
  cusipList: "95058W100",
  brokerNonVote: 22480600,
  reportTitle: "Preliminary Tabulation Results",
  proposals: [
    {
      proposalNumber: "1",
      title: "Election of Director: Samuel Adams",
      directorName: "Samuel Adams",
      voteFor: 150000000,
      voteAgainst: 15000000,
      voteAbstain: 8753542,
      percentFor: 86.32,
      percentAgainst: 8.63,
      percentAbstain: 5.04,
      percentOfOutstanding: 88.54,
      percentOfTotalVoted: 100.0,
      percentOfProposalVotes: 100.0,
    },
    {
      proposalNumber: "2",
      title: "Election of Director: Benjamin Franklin",
      directorName: "Benjamin Franklin",
      voteFor: 155000000,
      voteAgainst: 10000000,
      voteAbstain: 8753542,
      percentFor: 89.2,
      percentAgainst: 5.75,
      percentAbstain: 5.04,
      percentOfOutstanding: 88.54,
      percentOfTotalVoted: 100.0,
      percentOfProposalVotes: 100.0,
    },
    {
      proposalNumber: "3",
      title: "Ratification of Independent Auditors",
      directorName: "",
      voteFor: 160000000,
      voteAgainst: 5000000,
      voteAbstain: 8753542,
      percentFor: 92.11,
      percentAgainst: 2.88,
      percentAbstain: 5.04,
      percentOfOutstanding: 88.54,
      percentOfTotalVoted: 100.0,
      percentOfProposalVotes: 100.0,
    },
  ],
};

const PDFPreview = () => {
  const { data, error, isLoading } = useSWR<LogoData, Error>(
    "pdf-preview-logos",
    fetchPreviewLogos
  );

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <Box color="error.main">Error: {error.message}</Box>
        <Box>Check the console for more details.</Box>
      </Box>
    );
  }

  if (isLoading || !data) {
    return null;
  }

  return (
    <PDFViewer
      width="100%"
      height="100%"
      style={{ minHeight: "100vh", border: "none" }}
    >
      <TabulationPDFDocument
        tabulationData={sampleData}
        clientTicker="WEN"
        clientLogoUrl={data.clientLogo}
        betanxtLogoUrl={data.betanxtLogo}
      />
    </PDFViewer>
  );
};

export default PDFPreview;
