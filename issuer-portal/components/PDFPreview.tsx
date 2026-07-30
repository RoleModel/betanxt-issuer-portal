"use client";

import { Box } from "@mui/material";
import { PDFViewer } from "@react-pdf/renderer";
import { useEffect, useState } from "react";

import { TabulationPDFDocument } from "@/utils/exportTabulationPdf";

const PDFPreview = () => {
  const [clientLogoBase64, setClientLogoBase64] = useState<string>("");
  const [betanxtLogoBase64, setBetanxtLogoBase64] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLogos = async () => {
      try {
        const baseUrl = window.location.origin;

        // Load client logo
        const clientLogoResponse = await fetch(`${baseUrl}/logos/WEN_logo.png`);
        if (!clientLogoResponse.ok) {
          throw new Error("Failed to load client logo");
        }
        const clientLogoBlob = await clientLogoResponse.blob();
        const clientLogo = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(clientLogoBlob);
        });

        // Load BetaNXT logo
        const betanxtLogoResponse = await fetch(
          `${baseUrl}/images/betanxt-logo.png`
        );
        if (!betanxtLogoResponse.ok) {
          throw new Error("Failed to load BetaNXT logo");
        }
        const betanxtLogoBlob = await betanxtLogoResponse.blob();
        const betanxtLogo = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(betanxtLogoBlob);
        });

        setClientLogoBase64(clientLogo);
        setBetanxtLogoBase64(betanxtLogo);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load logos:", err);
        setError(err instanceof Error ? err.message : "Failed to load logos");
        setIsLoading(false);
      }
    };

    void loadLogos();
  }, []);

  // Sample tabulation data for preview
  const sampleData = {
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
        <Box color="error.main">Error: {error}</Box>
        <Box>Check the console for more details.</Box>
      </Box>
    );
  }

  if (isLoading || !clientLogoBase64 || !betanxtLogoBase64) {
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
        clientLogoUrl={clientLogoBase64}
        betanxtLogoUrl={betanxtLogoBase64}
      />
    </PDFViewer>
  );
};

export default PDFPreview;
