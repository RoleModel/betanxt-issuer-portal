"use client";

import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import React from "react";

import {
  ReportMetaGrid,
  ReportPageNumber,
  ReportPdfHeader,
  downloadBlob,
  formatReportDate,
  formatReportPercent,
  reportStyles,
  resolveReportLogos,
} from "@/utils/reportPdfTheme";

/**
 * Tabulation Report PDF, restyled to the shared report redesign: portrait
 * page, fixed logo row, left-aligned title block, hairline meta grid, a
 * single column-header row, and light-gray proposal bands with hairline vote
 * rows (no colored header bars or bordered tables).
 */

interface ProposalVote {
  proposalNumber: string;
  title: string;
  directorName?: string;
  voteFor: number;
  voteAgainst: number;
  voteAbstain: number;
  percentFor: number;
  percentAgainst: number;
  percentAbstain: number;
  percentOfOutstanding: number;
  percentOfProposalVotes: number;
}

interface TabulationData {
  companyName: string;
  meetingType: string;
  meetingDate: string;
  recordDate: string;
  totalOutstanding: number;
  votesRepresentedForQuorum: number;
  quorumPercentage: number;
  quorumRequirement: string;
  votesOverUnderQuorum: number;
  cusipList: string;
  brokerNonVote: number;
  proposals: ProposalVote[];
  reportTitle?: string; // Optional custom title (Preliminary vs Final)
}

interface ExportOptions {
  tabulationData: TabulationData;
  clientTicker?: string;
}

const columnWidths = StyleSheet.create({
  label: { width: "30%" },
  votes: { width: "17.5%" },
  percentOutstanding: { width: "17.5%" },
  percentTotal: { width: "17.5%" },
  percentProposal: { width: "17.5%" },
});

// Format number with thousand separators and decimals
const formatNumber = (num: number, decimals = 2): string => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/** Accounting-style number: negatives rendered in parentheses. */
const formatSignedNumber = (num: number): string => {
  return num < 0 ? `(${formatNumber(Math.abs(num))})` : formatNumber(num);
};

interface VoteRowProps {
  label: string;
  votes: number;
  percentOfProposal: number;
  totalOutstanding: number;
  votesRepresentedForQuorum: number;
}

/** One For/Against/Abstain row with hairline separator and derived percents. */
const VoteRow: React.FC<VoteRowProps> = ({
  label,
  votes,
  percentOfProposal,
  totalOutstanding,
  votesRepresentedForQuorum,
}) => (
  <View style={reportStyles.tableRow}>
    <Text style={[reportStyles.cellLabel, columnWidths.label]}>{label}</Text>
    <Text style={[reportStyles.cell, columnWidths.votes, reportStyles.cellRight]}>
      {formatNumber(votes)}
    </Text>
    <Text style={[reportStyles.cell, columnWidths.percentOutstanding, reportStyles.cellRight]}>
      {formatReportPercent(totalOutstanding > 0 ? (votes / totalOutstanding) * 100 : 0)}
    </Text>
    <Text style={[reportStyles.cell, columnWidths.percentTotal, reportStyles.cellRight]}>
      {formatReportPercent(
        votesRepresentedForQuorum > 0 ? (votes / votesRepresentedForQuorum) * 100 : 0,
      )}
    </Text>
    <Text style={[reportStyles.cell, columnWidths.percentProposal, reportStyles.cellRight]}>
      {formatReportPercent(percentOfProposal)}
    </Text>
  </View>
);

interface ProposalSectionProps {
  proposal: ProposalVote;
  totalOutstanding: number;
  votesRepresentedForQuorum: number;
}

/** Gray proposal band plus its For/Against/Abstain rows; kept on one page. */
const ProposalSection: React.FC<ProposalSectionProps> = ({
  proposal,
  totalOutstanding,
  votesRepresentedForQuorum,
}) => {
  const abstainLabel = proposal.directorName ? "Abstain/Withhold" : "Abstain";

  return (
    <View wrap={false}>
      <View style={reportStyles.sectionRow}>
        <Text style={[reportStyles.sectionCell, columnWidths.label]}>
          Proposal {proposal.proposalNumber}
        </Text>
        <Text style={[reportStyles.sectionCell, { flex: 1 }]}>
          {proposal.directorName ?? proposal.title}
        </Text>
      </View>
      <VoteRow
        label="For"
        votes={proposal.voteFor}
        percentOfProposal={proposal.percentFor}
        totalOutstanding={totalOutstanding}
        votesRepresentedForQuorum={votesRepresentedForQuorum}
      />
      <VoteRow
        label="Against"
        votes={proposal.voteAgainst}
        percentOfProposal={proposal.percentAgainst}
        totalOutstanding={totalOutstanding}
        votesRepresentedForQuorum={votesRepresentedForQuorum}
      />
      <VoteRow
        label={abstainLabel}
        votes={proposal.voteAbstain}
        percentOfProposal={proposal.percentAbstain}
        totalOutstanding={totalOutstanding}
        votesRepresentedForQuorum={votesRepresentedForQuorum}
      />
    </View>
  );
};

interface TabulationPDFDocumentProps {
  tabulationData: TabulationData;
  clientTicker?: string;
  clientLogoUrl?: string;
  betanxtLogoUrl?: string;
}

// Tabulation PDF Document Component
export const TabulationPDFDocument: React.FC<TabulationPDFDocumentProps> = ({
  tabulationData,
  clientTicker,
  clientLogoUrl,
  betanxtLogoUrl,
}) => {
  const {
    companyName,
    meetingType,
    meetingDate,
    recordDate,
    totalOutstanding,
    votesRepresentedForQuorum,
    quorumPercentage,
    quorumRequirement,
    votesOverUnderQuorum,
    cusipList,
    proposals,
    reportTitle,
  } = tabulationData;

  // Director elections share a parent band (e.g. "Proposal 1 — The election
  // of N directors") followed by one section per nominee.
  const directorProposals = proposals.filter((p) => p.directorName);
  const otherProposals = proposals.filter((p) => !p.directorName);
  const directorGroupNumber = directorProposals[0]?.proposalNumber.split(".")[0];
  const directorGroupTitle =
    directorProposals[0]?.title || `The election of ${directorProposals.length} directors`;

  return (
    <Document>
      <Page size="LETTER" style={reportStyles.page}>
        <ReportPdfHeader
          reportTitle={reportTitle ?? "Tabulation Report"}
          subtitle={meetingType}
          clientTicker={clientTicker}
          clientLogoUrl={clientLogoUrl}
          betanxtLogoUrl={betanxtLogoUrl}
        />

        <ReportMetaGrid
          items={[
            { label: "Company Name:", value: companyName },
            { label: "Total Outstanding:", value: formatNumber(totalOutstanding) },
            { label: "Type:", value: meetingType },
            {
              label: "Votes Represented for Quorum:",
              value: formatNumber(votesRepresentedForQuorum),
            },
            { label: "Meeting Date:", value: formatReportDate(meetingDate) },
            { label: "Quorum:", value: formatReportPercent(quorumPercentage) },
            { label: "Record Date:", value: formatReportDate(recordDate) },
            { label: "% Needed for Quorum:", value: `${quorumRequirement} + 1 Vote` },
            { label: "", value: "" },
            {
              label: "Votes over / (under) Quorum:",
              value: formatSignedNumber(votesOverUnderQuorum),
            },
          ]}
        />

        <View style={reportStyles.metaFullRow}>
          <Text style={[reportStyles.metaLabel, { width: "23%" }]}>CUSIP(s) (multiplier):</Text>
          <Text style={reportStyles.metaValue}>{cusipList || "N/A"}</Text>
        </View>

        {/* Column headers */}
        <View style={[reportStyles.tableHeaderRow, { marginTop: 18 }]}>
          <View style={columnWidths.label} />
          <Text style={[reportStyles.headerCell, columnWidths.votes, reportStyles.cellRight]}>
            Vote{"\n"}Submitted
          </Text>
          <Text
            style={[
              reportStyles.headerCell,
              columnWidths.percentOutstanding,
              reportStyles.cellRight,
            ]}
          >
            % of{"\n"}Outstanding
          </Text>
          <Text
            style={[reportStyles.headerCell, columnWidths.percentTotal, reportStyles.cellRight]}
          >
            % of{"\n"}Total Voted
          </Text>
          <Text
            style={[reportStyles.headerCell, columnWidths.percentProposal, reportStyles.cellRight]}
          >
            % of{"\n"}Proposal Votes
          </Text>
        </View>

        {proposals.length === 0 ? (
          <View style={reportStyles.tableRow}>
            <Text style={reportStyles.cell}>No proposals to display</Text>
          </View>
        ) : (
          <>
            {directorProposals.length > 0 && (
              <>
                <View style={reportStyles.sectionRow}>
                  <Text style={[reportStyles.sectionCell, columnWidths.label]}>
                    Proposal {directorGroupNumber}
                  </Text>
                  <Text style={[reportStyles.sectionCell, { flex: 1 }]}>{directorGroupTitle}</Text>
                </View>
                {directorProposals.map((proposal, index) => (
                  <ProposalSection
                    key={`director-${index}`}
                    proposal={proposal}
                    totalOutstanding={totalOutstanding}
                    votesRepresentedForQuorum={votesRepresentedForQuorum}
                  />
                ))}
              </>
            )}
            {otherProposals.map((proposal, index) => (
              <ProposalSection
                key={`other-${index}`}
                proposal={proposal}
                totalOutstanding={totalOutstanding}
                votesRepresentedForQuorum={votesRepresentedForQuorum}
              />
            ))}
          </>
        )}

        <ReportPageNumber />
      </Page>
    </Document>
  );
};

// Main export function
export async function exportTabulationPdf(options: ExportOptions) {
  const { tabulationData, clientTicker } = options;

  try {
    const { clientLogoUrl, betanxtLogoUrl } = await resolveReportLogos(clientTicker);

    const pdfBlob = await pdf(
      <TabulationPDFDocument
        tabulationData={tabulationData}
        clientTicker={clientTicker}
        clientLogoUrl={clientLogoUrl}
        betanxtLogoUrl={betanxtLogoUrl}
      />,
    ).toBlob();

    const fileName = `${tabulationData.companyName.replace(/\s+/g, "_")}_Tabulation_Report_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    downloadBlob(pdfBlob, fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
