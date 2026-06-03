import type { NextRequest } from "next/server";

import { render } from "@react-email/render";
import { NextResponse } from "next/server";
import React from "react";

import { DocumentUpdateNotification } from "@/emails/DocumentUpdateNotification";
import { TabulationReportEmail } from "@/emails/TabulationReportEmail";
import { handleCors, withCors } from "@/utils/cors";

const DOCUMENT_FIXTURE = {
  meetingType: "Annual Meeting",
  issuerAccountName: "Sample Issuer Account",
  documentName: "Proxy Notice",
  uploaderName: "Sarah Chen",
  documentDescription: "Sarah Chen has uploaded the first draft of the Proxy Notice.",
  uploadDate: "2026-06-02T12:00:00.000Z",
  viewDocumentUrl: "http://localhost:3000/documents/preview",
  portalBaseUrl: "http://localhost:3000",
};

const TABULATION_FIXTURE = {
  companyName: "Wendy's International",
  meetingType: "Annual Meeting 2026",
  meetingDate: "2026-06-17T14:00:00.000Z",
  reportDate: "2026-06-02T06:00:00.000Z",
  daysUntilMeeting: 15,
  recipientName: "Dallas Peters",
  totalSharesEligible: 12_500_000,
  totalSharesVoted: 6_842_000,
  quorumRequired: 50,
  quorumMet: true,
  viewTabulationUrl: "http://localhost:3000/WEN/meeting/wen-annual-meeting-2026/tabulation",
  portalBaseUrl: "http://localhost:3000",
  proposals: [
    {
      number: "1",
      title: "Election of Directors — Class II",
      totalShares: 12_500_000,
      votesFor: 6_021_000,
      votesAgainst: 420_000,
      votesAbstain: 401_000,
      votesNotCast: 5_658_000,
    },
    {
      number: "2",
      title: "Advisory Vote on Executive Compensation (Say-on-Pay)",
      totalShares: 12_500_000,
      votesFor: 5_810_000,
      votesAgainst: 780_000,
      votesAbstain: 252_000,
      votesNotCast: 5_658_000,
    },
    {
      number: "3",
      title: "Ratification of Independent Registered Public Accounting Firm",
      totalShares: 12_500_000,
      votesFor: 6_500_000,
      votesAgainst: 190_000,
      votesAbstain: 152_000,
      votesNotCast: 5_658_000,
    },
    {
      number: "4",
      title: "Approval of the 2026 Equity Incentive Plan",
      totalShares: 12_500_000,
      votesFor: 4_200_000,
      votesAgainst: 2_100_000,
      votesAbstain: 542_000,
      votesNotCast: 5_658_000,
    },
  ],
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (process.env.VERCEL_ENV === "production") {
    return withCors(NextResponse.json({ error: "Not available in production" }, { status: 404 }));
  }

  const { searchParams } = new URL(request.url);
  const template = searchParams.get("template") ?? "tabulation-daily-report";

  let element: React.ReactElement;

  if (template === "document-update-notification") {
    element = React.createElement(DocumentUpdateNotification, DOCUMENT_FIXTURE);
  } else if (template === "tabulation-daily-report") {
    element = React.createElement(TabulationReportEmail, TABULATION_FIXTURE);
  } else {
    return withCors(NextResponse.json({ error: "Unknown template" }, { status: 400 }));
  }

  const html = await render(element);
  return withCors(NextResponse.json({ html }));
}

export function OPTIONS() {
  return handleCors();
}
